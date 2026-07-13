# Astro OG SEO

An integrated SEO toolkit for Astro 6.4+ and Astro 7.

## Install

```bash
npm install astro-og-seo
```

```ts
import astroOgSeo from "astro-og-seo";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://example.com",
  integrations: [
    astroOgSeo({
      siteName: "Example",
      image: {
        stylesheet: "./src/styles/og-image.css",
        outputDir: "_og",
      },
    }),
  ],
});
```

`site` is required. The toolbar is registered by default and remains controlled by Astro's global `devToolbar` option.

## Metadata and generated images

```astro
---
import OgSeo from "astro-og-seo/OgSeo.astro";
---

<OgSeo
  title="A useful page title"
  description="A concise description of this page."
  lang="en-US"
  robots="index,follow"
  alternates={[{ href: "https://example.com/pt/", hreflang: "pt-BR" }]}
  alternateLocales={["pt-BR"]}
>
  <div slot="image" class="og-card">
    <h1>A useful page title</h1>
  </div>
</OgSeo>
```

The image slot is rendered at build time for static output. If the slot is omitted, no fallback image or image metadata is generated. Use the `image` prop for an externally hosted image.

Article metadata accepts `publishedTime`, optional `modifiedTime`, authors, section, and tags. Twitter cards accept `summary` or `summary_large_image`; the latter requires an image.

## Integration options

- `siteName` — required Open Graph site name.
- `toolbar.enabled` — defaults to `true`.
- `image` — set to `false` to disable generated images, or configure `stylesheet`, `outputDir`, `width`, `height`, and `format`.
- Image dimensions default to 1200×630 and must be between 1 and 8192.
- `outputDir` must be a safe relative directory inside Astro's output.

Generated images are intentionally static-only in 0.1. Server-output projects can use the metadata component, toolbar, and external image URLs, but an image slot produces a clear build error.

## Migration from 0.0.2

- The integration now has a real default export while retaining the named export.
- Move `stylesheet`, `outputDir`, and dimensions under `image`.
- Alternate entries use `hreflang` instead of `hrefLang`.
- No fallback image is created without an image slot.
- Unknown article modification dates are omitted rather than copied from the publication date.
