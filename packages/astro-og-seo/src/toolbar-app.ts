import { defineToolbarApp } from "astro/toolbar";

type SeoField = {
  label: string;
  value: string | null;
  required?: boolean;
};

const previewEndpoint = "/__astro-og-seo/preview";

function readMeta(selector: string) {
  return document.head.querySelector<HTMLMetaElement>(selector)?.content ?? null;
}

function readLink(selector: string) {
  return document.head.querySelector<HTMLLinkElement>(selector)?.href ?? null;
}

function readSeoFields(): SeoField[] {
  return [
    { label: "Title", value: document.title, required: true },
    {
      label: "Description",
      value: readMeta('meta[name="description"]'),
      required: true,
    },
    { label: "Canonical", value: readLink('link[rel="canonical"]'), required: true },
    { label: "OG title", value: readMeta('meta[property="og:title"]'), required: true },
    {
      label: "OG description",
      value: readMeta('meta[property="og:description"]'),
      required: true,
    },
    { label: "OG URL", value: readMeta('meta[property="og:url"]'), required: true },
    { label: "OG image", value: readMeta('meta[property="og:image"]') },
    { label: "Twitter card", value: readMeta('meta[name="twitter:card"]') },
    { label: "Twitter image", value: readMeta('meta[name="twitter:image"]') },
    {
      label: "Published",
      value: readMeta('meta[property="article:published_time"]'),
    },
    {
      label: "Modified",
      value: readMeta('meta[property="article:modified_time"]'),
    },
  ];
}

function getOgTemplate() {
  return document.head.querySelector<HTMLTemplateElement>("template[data-astro-og-seo-image]");
}

function createElement(tagName: string, className?: string) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
}

function createStatusBadge(ok: boolean, text: string) {
  const badge = createElement("span", ok ? "badge ok" : "badge warn");
  badge.textContent = text;
  return badge;
}

function createField(field: SeoField) {
  const row = createElement("article", "field");
  const header = createElement("div", "field-header");
  const label = createElement("span", "field-label");
  const value = createElement("p", "field-value");
  const hasValue = Boolean(field.value?.trim());

  label.textContent = field.label;
  header.append(label);
  header.append(
    createStatusBadge(
      hasValue || !field.required,
      hasValue ? "set" : field.required ? "missing" : "empty",
    ),
  );
  value.textContent = field.value?.trim() || "Not present on this page";

  row.append(header, value);
  return row;
}

function getMissingRequiredCount(fields: SeoField[]) {
  return fields.filter((field) => field.required && !field.value?.trim()).length;
}

async function renderPreview(
  image: HTMLImageElement,
  status: HTMLElement,
  template: HTMLTemplateElement,
) {
  status.textContent = "Rendering preview...";

  try {
    const response = await fetch(previewEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        html: template.innerHTML,
        stylesheet: template.dataset.stylesheet ?? "",
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const blob = await response.blob();
    const previousUrl = image.dataset.objectUrl;
    const nextUrl = URL.createObjectURL(blob);

    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }

    image.dataset.objectUrl = nextUrl;
    image.src = nextUrl;
    image.hidden = false;
    status.textContent = "Inline OG image slot rendered with Takumi.";
  } catch (error) {
    image.hidden = true;
    status.textContent = error instanceof Error ? error.message : "Unable to render preview.";
  }
}

function renderPanel(canvas: ShadowRoot) {
  console.log("renderPanel");
  const fields = readSeoFields();
  const template = getOgTemplate();
  const missingRequiredCount = getMissingRequiredCount(fields);

  canvas.textContent = "";

  const style = document.createElement("style");
  style.textContent = `
    :host { color-scheme: dark; }
    .panel {
      box-sizing: border-box;
      width: 100%;
      max-height: min(720px, calc(100vh - 96px));
      overflow: auto;
      border: 1px solid rgba(148, 163, 184, 0.28);
      border-radius: 10px;
      background: #07111f;
      color: #e5edf7;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.46);
      font: 13px/1.45 ui-sans-serif, system-ui, sans-serif;
    }
    .head {
      display: grid;
      gap: 10px;
      padding: 16px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), transparent 55%);
    }
    .eyebrow {
      color: #7dd3fc;
      font: 700 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    h2 {
      margin: 0;
      font-size: 18px;
      line-height: 1.2;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      border-radius: 999px;
      padding: 0 8px;
      font: 700 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      text-transform: uppercase;
    }
    .ok {
      background: rgba(34, 197, 94, 0.13);
      color: #86efac;
    }
    .warn {
      background: rgba(251, 191, 36, 0.14);
      color: #fde68a;
    }
    .content {
      display: grid;
      gap: 14px;
      padding: 14px;
    }
    .preview {
      display: grid;
      gap: 10px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 8px;
      padding: 10px;
      background: rgba(15, 23, 42, 0.72);
    }
    .preview img {
      width: 100%;
      aspect-ratio: 1200 / 630;
      border-radius: 6px;
      object-fit: cover;
      background: #020617;
    }
    .preview p {
      margin: 0;
      color: #a8b3c7;
    }
    .fields {
      display: grid;
      gap: 8px;
    }
    .field {
      display: grid;
      gap: 5px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.13);
      padding-bottom: 8px;
    }
    .field-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .field-label {
      color: #cbd5e1;
      font-weight: 700;
    }
    .field-value {
      margin: 0;
      overflow-wrap: anywhere;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
    }
  `;

  const panel = createElement("astro-dev-toolbar-window");
  const shell = createElement("section", "panel");
  const head = createElement("header", "head");
  const eyebrow = createElement("div", "eyebrow");
  const title = createElement("h2");
  const summary = createElement("div", "summary");
  const content = createElement("div", "content");
  const preview = createElement("section", "preview");
  const previewImage = createElement("img") as HTMLImageElement;
  const previewStatus = createElement("p");
  const fieldList = createElement("section", "fields");

  eyebrow.textContent = "Astro OG SEO";
  title.textContent = window.location.pathname;
  summary.append(
    createStatusBadge(missingRequiredCount === 0, `${missingRequiredCount} missing`),
    createStatusBadge(Boolean(template), template ? "image slot" : "no image slot"),
  );

  head.append(eyebrow, title, summary);
  previewImage.alt = "Open Graph image preview";
  previewImage.hidden = true;
  previewStatus.textContent = template
    ? "Preparing image preview..."
    : "No inline og-image slot on this page.";
  preview.append(previewImage, previewStatus);
  fieldList.append(...fields.map(createField));
  content.append(preview, fieldList);
  shell.append(head, content);
  panel.append(shell);
  canvas.append(style, panel);

  if (template) {
    void renderPreview(previewImage, previewStatus, template);
  }
}

export default defineToolbarApp({
  init(canvas, app) {
    renderPanel(canvas);

    app.onToggled(({ state }) => {
      if (state) {
        renderPanel(canvas);
      }
    });

    document.addEventListener("astro:page-load", () => renderPanel(canvas));
  },
});
