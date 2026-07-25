export type SeoSeverity = "error" | "warning" | "info" | "pass";
export type SeoDiagnostic = { severity: SeoSeverity; label: string; message: string };
export type SeoSnapshot = {
  lang: string | null;
  fields: Record<string, string[]>;
};

type PresenceCheck = {
  key: string;
  label: string;
  severity: "error" | "warning";
  missingMessage: string;
};

const presenceChecks: PresenceCheck[] = [
  {
    key: "title",
    label: "Title",
    severity: "error",
    missingMessage: "Add one unique <title>; it names the page in search results and browser tabs.",
  },
  {
    key: "description",
    label: "Description",
    severity: "warning",
    missingMessage:
      "Add one concise meta description, ideally 160 characters or fewer, to summarize the page in search results.",
  },
  {
    key: "canonical",
    label: "Canonical URL",
    severity: "error",
    missingMessage:
      "Add one absolute HTTP(S) canonical URL to identify this page's preferred address.",
  },
  {
    key: "og:title",
    label: "Open Graph title",
    severity: "warning",
    missingMessage:
      "Add one og:title so social platforms use a clear title when this page is shared.",
  },
  {
    key: "og:description",
    label: "Open Graph description",
    severity: "warning",
    missingMessage: "Add one og:description to control the summary shown in social previews.",
  },
  {
    key: "og:url",
    label: "Open Graph URL",
    severity: "warning",
    missingMessage: "Add one absolute og:url so social platforms can identify the shared page.",
  },
  {
    key: "og:type",
    label: "Open Graph type",
    severity: "warning",
    missingMessage: 'Add og:type, usually "website" or "article", to describe the page.',
  },
  {
    key: "twitter:card",
    label: "Twitter card",
    severity: "warning",
    missingMessage:
      'Add twitter:card, such as "summary" or "summary_large_image", to control the link preview.',
  },
];

function first(snapshot: SeoSnapshot, key: string) {
  return snapshot.fields[key]?.[0]?.trim() ?? "";
}

function presence(diagnostics: SeoDiagnostic[], snapshot: SeoSnapshot, check: PresenceCheck) {
  const values = snapshot.fields[check.key] ?? [];
  if (values.length === 0 || !values[0]?.trim()) {
    diagnostics.push({
      severity: check.severity,
      label: check.label,
      message: check.missingMessage,
    });
  } else {
    diagnostics.push({
      severity: "pass",
      label: check.label,
      message: `${check.label} is present and unique.`,
    });
  }
  if (values.length > 1)
    diagnostics.push({
      severity: "error",
      label: check.label,
      message: `Keep exactly one ${check.label} entry; found ${values.length}.`,
    });
}

export function auditSeoSnapshot(snapshot: SeoSnapshot) {
  const diagnostics: SeoDiagnostic[] = [];
  for (const check of presenceChecks) presence(diagnostics, snapshot, check);

  if (!snapshot.lang)
    diagnostics.push({
      severity: "error",
      label: "Language",
      message:
        'Set a lang attribute on <html>, for example lang="en-US", so browsers and search engines can identify the document language.',
    });
  else
    diagnostics.push({
      severity: "pass",
      label: "Language",
      message: `The document declares ${snapshot.lang} as its language.`,
    });

  const title = first(snapshot, "title");
  const description = first(snapshot, "description");
  if (title.length > 60)
    diagnostics.push({
      severity: "warning",
      label: "Title length",
      message: `Shorten the title from ${title.length} characters to 60 or fewer to reduce truncation in search results.`,
    });
  if (description.length > 160)
    diagnostics.push({
      severity: "warning",
      label: "Description length",
      message: `Shorten the description from ${description.length} characters to 160 or fewer to reduce truncation in search results.`,
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
        message: "Use an absolute canonical URL starting with http:// or https://.",
      });
    }
  }

  const hreflangs = snapshot.fields.hreflang ?? [];
  const duplicates = hreflangs.filter((value, index) => hreflangs.indexOf(value) !== index);
  if (duplicates.length)
    diagnostics.push({
      severity: "warning",
      label: "Language alternates",
      message: `Remove duplicate hreflang entries; each locale should appear once. Duplicates: ${[...new Set(duplicates)].join(", ")}.`,
    });
  if (hreflangs.filter((value) => value === "x-default").length > 1)
    diagnostics.push({
      severity: "error",
      label: "Language alternates",
      message: 'Keep exactly one hreflang="x-default" entry and remove the extras.',
    });

  const image = first(snapshot, "og:image");
  if (!image)
    diagnostics.push({
      severity: "info",
      label: "Open Graph image",
      message:
        "No og:image is set. Add a social image if this page should have a custom preview when shared.",
    });
  const card = first(snapshot, "twitter:card");
  if (card === "summary_large_image" && !image)
    diagnostics.push({
      severity: "error",
      label: "Twitter card",
      message:
        'twitter:card is "summary_large_image", but no og:image is set. Add an image or use a smaller card type.',
    });

  const published = first(snapshot, "article:published_time");
  const modified = first(snapshot, "article:modified_time");
  const publishedTimestamp = published ? Date.parse(published) : Number.NaN;
  const modifiedTimestamp = modified ? Date.parse(modified) : Number.NaN;
  if (published && Number.isNaN(publishedTimestamp))
    diagnostics.push({
      severity: "error",
      label: "Published date",
      message:
        "Replace article:published_time with a valid date, preferably ISO 8601, such as 2026-07-24T12:00:00Z.",
    });
  if (modified && Number.isNaN(modifiedTimestamp))
    diagnostics.push({
      severity: "error",
      label: "Modified date",
      message:
        "Replace article:modified_time with a valid date, preferably ISO 8601, such as 2026-07-24T12:00:00Z.",
    });
  if (
    published &&
    modified &&
    !Number.isNaN(publishedTimestamp) &&
    !Number.isNaN(modifiedTimestamp) &&
    modifiedTimestamp < publishedTimestamp
  )
    diagnostics.push({
      severity: "warning",
      label: "Article dates",
      message:
        "Set article:modified_time to the same time or a later time than article:published_time.",
    });

  const robots = first(snapshot, "robots");
  if (robots.toLowerCase().includes("noindex"))
    diagnostics.push({
      severity: "info",
      label: "Robots",
      message:
        "This page sends noindex to search engines. Remove noindex from robots if the page should appear in search results.",
    });
  return diagnostics;
}
