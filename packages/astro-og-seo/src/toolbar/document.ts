import type { SeoSnapshot } from "./audit";

function contents(selector: string) {
  return [...document.head.querySelectorAll<HTMLMetaElement>(selector)].map(
    (element) => element.content,
  );
}

export function readSeoSnapshot(): SeoSnapshot {
  return {
    lang: document.documentElement.lang || null,
    fields: {
      title: [...document.head.querySelectorAll("title")].map(
        (element) => element.textContent ?? "",
      ),
      description: contents('meta[name="description"]'),
      robots: contents('meta[name="robots"]'),
      canonical: [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]')].map(
        (element) => element.href,
      ),
      hreflang: [
        ...document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]'),
      ].map((element) => element.hreflang),
      "og:title": contents('meta[property="og:title"]'),
      "og:description": contents('meta[property="og:description"]'),
      "og:url": contents('meta[property="og:url"]'),
      "og:type": contents('meta[property="og:type"]'),
      "og:image": contents('meta[property="og:image"]'),
      "twitter:card": contents('meta[name="twitter:card"]'),
      "article:published_time": contents('meta[property="article:published_time"]'),
      "article:modified_time": contents('meta[property="article:modified_time"]'),
    },
  };
}

export function getOgTemplate() {
  return document.head.querySelector<HTMLTemplateElement>("template[data-astro-og-seo-image]");
}

export function decodeTemplate(template: HTMLTemplateElement) {
  const encoded = template.dataset.astroOgSeoImage;
  if (!encoded) return null;
  try {
    const payload = JSON.parse(atob(encoded)) as { html?: unknown; stylesheet?: unknown };
    return typeof payload.html === "string" && typeof payload.stylesheet === "string"
      ? { html: payload.html, stylesheet: payload.stylesheet }
      : null;
  } catch {
    return null;
  }
}
