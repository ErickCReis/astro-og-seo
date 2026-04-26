# Astro OG SEO

Inline-only Astro integration for SEO tags and Takumi-generated Open Graph images.

## Usage

```ts
import astroOgSeo from "astro-og-seo";

export default defineConfig({
  integrations: [
    astroOgSeo({
      siteName: "Erick Reis",
      stylesheet: "@web/styles/site.css",
      outputDir: "_og",
      image: {
        width: 1200,
        height: 630,
        format: "png",
      },
    }),
  ],
});
```

Render SEO tags from a layout:

```astro
---
import OgSeo from "astro-og-seo/OgSeo.astro";
---

<OgSeo title={title} description={description}>
  <Fragment slot="image">
    <div class="flex h-full w-full items-center justify-center bg-background text-foreground">
      <h1>{title}</h1>
    </div>
  </Fragment>
</OgSeo>
```

If the `image` slot is omitted, the component renders a built-in fallback image
using the page title, description, locale, site name, and pathname.
