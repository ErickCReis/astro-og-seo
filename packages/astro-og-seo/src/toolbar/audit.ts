export type SeoSeverity = "error" | "warning" | "info" | "pass";
export type SeoDiagnostic = { severity: SeoSeverity; label: string; message: string };
export type SeoSnapshot = {
  lang: string | null;
  fields: Record<string, string[]>;
};

function first(snapshot: SeoSnapshot, key: string) {
  return snapshot.fields[key]?.[0]?.trim() ?? "";
}

function presence(
  diagnostics: SeoDiagnostic[],
  snapshot: SeoSnapshot,
  key: string,
  label: string,
  severity: "error" | "warning",
) {
  const values = snapshot.fields[key] ?? [];
  if (values.length === 0 || !values[0]?.trim()) {
    diagnostics.push({ severity, label, message: `${label} is missing.` });
  } else {
    diagnostics.push({ severity: "pass", label, message: `${label} is set.` });
  }
  if (values.length > 1)
    diagnostics.push({
      severity: "error",
      label,
      message: `${label} appears ${values.length} times.`,
    });
}

export function auditSeoSnapshot(snapshot: SeoSnapshot) {
  const diagnostics: SeoDiagnostic[] = [];
  presence(diagnostics, snapshot, "title", "Title", "error");
  presence(diagnostics, snapshot, "description", "Description", "warning");
  presence(diagnostics, snapshot, "canonical", "Canonical URL", "error");
  presence(diagnostics, snapshot, "og:title", "Open Graph title", "warning");
  presence(diagnostics, snapshot, "og:description", "Open Graph description", "warning");
  presence(diagnostics, snapshot, "og:url", "Open Graph URL", "warning");
  presence(diagnostics, snapshot, "og:type", "Open Graph type", "warning");
  presence(diagnostics, snapshot, "twitter:card", "Twitter card", "warning");

  if (!snapshot.lang)
    diagnostics.push({
      severity: "error",
      label: "Language",
      message: "The html element has no lang value.",
    });
  else
    diagnostics.push({
      severity: "pass",
      label: "Language",
      message: `Document language is ${snapshot.lang}.`,
    });

  const title = first(snapshot, "title");
  const description = first(snapshot, "description");
  if (title.length > 60)
    diagnostics.push({
      severity: "warning",
      label: "Title length",
      message: `Title is ${title.length} characters; search results may truncate it.`,
    });
  if (description.length > 160)
    diagnostics.push({
      severity: "warning",
      label: "Description length",
      message: `Description is ${description.length} characters; search results may truncate it.`,
    });

  const canonical = first(snapshot, "canonical");
  if (canonical) {
    try {
      const url = new URL(canonical);
      if (!/^https?:$/.test(url.protocol)) throw new Error();
    } catch {
      diagnostics.push({
        severity: "error",
        label: "Canonical URL",
        message: "Canonical URL must be an absolute HTTP(S) URL.",
      });
    }
  }

  const hreflangs = snapshot.fields.hreflang ?? [];
  const duplicates = hreflangs.filter((value, index) => hreflangs.indexOf(value) !== index);
  if (duplicates.length)
    diagnostics.push({
      severity: "warning",
      label: "Language alternates",
      message: `Duplicate hreflang values: ${[...new Set(duplicates)].join(", ")}.`,
    });
  if (hreflangs.filter((value) => value === "x-default").length > 1)
    diagnostics.push({
      severity: "error",
      label: "Language alternates",
      message: "Only one x-default alternate is allowed.",
    });

  const image = first(snapshot, "og:image");
  if (!image)
    diagnostics.push({
      severity: "info",
      label: "Open Graph image",
      message: "No social image is configured for this page.",
    });
  const card = first(snapshot, "twitter:card");
  if (card === "summary_large_image" && !image)
    diagnostics.push({
      severity: "error",
      label: "Twitter card",
      message: "summary_large_image requires an image.",
    });

  const published = first(snapshot, "article:published_time");
  const modified = first(snapshot, "article:modified_time");
  if (published && Number.isNaN(Date.parse(published)))
    diagnostics.push({
      severity: "error",
      label: "Published date",
      message: "Article published date is invalid.",
    });
  if (modified && Number.isNaN(Date.parse(modified)))
    diagnostics.push({
      severity: "error",
      label: "Modified date",
      message: "Article modified date is invalid.",
    });
  if (published && modified && Date.parse(modified) < Date.parse(published))
    diagnostics.push({
      severity: "warning",
      label: "Article dates",
      message: "Modified date is earlier than published date.",
    });

  const robots = first(snapshot, "robots");
  if (robots.toLowerCase().includes("noindex"))
    diagnostics.push({
      severity: "info",
      label: "Robots",
      message: "This page asks search engines not to index it.",
    });
  return diagnostics;
}
