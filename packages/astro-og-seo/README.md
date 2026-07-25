# astro-og-seo

SEO metadata, static and SSR Open Graph images, and an actionable dev-toolbar inspector for Astro 6.4+ and Astro 7.

## Install

```bash
npm install astro-og-seo
```

Add the integration and set Astro's required `site` URL:

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

The integration's toolbar is enabled by default. Astro's global `devToolbar` option still controls whether any toolbar apps are shown.

## Add metadata to a page

Render `OgSeo` inside the page or layout `<head>`:

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
  <!-- Optional: this slot becomes a generated Open Graph image. -->
  <div slot="image" class="og-card">
    <h1>A useful page title</h1>
  </div>
</OgSeo>
```

`title` is the only required component prop. Canonical URLs default to the current pathname resolved against Astro's `site`. The defaults are `lang="en-US"`, `robots="index,follow"`, `type="website"`, and a Twitter `summary` card when no image is present.

### External images

Use the `image` prop when the image is already hosted:

```astro
<OgSeo
  title="A useful page title"
  image={{
    url: "https://cdn.example.com/social/page.png",
    alt: "A useful page title",
    width: 1200,
    height: 630,
    type: "image/png",
  }}
/>
```

Do not combine the `image` prop with the `image` slot.

### Article and Twitter metadata

```astro
<OgSeo
  title="A useful article"
  type="article"
  article={{
    publishedTime: new Date("2026-07-24"),
    modifiedTime: new Date("2026-07-25"),
    authors: ["Example Author"],
    section: "Guides",
    tags: ["astro", "seo"],
  }}
  twitter={{
    card: "summary_large_image",
    site: "@example",
    creator: "@author",
  }}
  image={{ url: "/social/article.png", alt: "A useful article" }}
/>
```

Passing `article` automatically changes the Open Graph type to `article` unless `type` is set explicitly. Dates accept `Date` objects or strings that JavaScript can parse. A `summary_large_image` card requires an external image or image slot.

## Generated images

The `image` slot is rendered during static builds to `dist/_og` by default. The generated URL follows the page pathname: `/guides/intro/` becomes `/_og/guides/intro/index.png`. If the slot is omitted, no fallback image or image metadata is generated.

The slot can use page-local content, while its CSS comes from the integration's `image.stylesheet` file. Takumi provides the default Geist fonts.

For `output: "server"`, the slot is rendered during the page request and served from the same generated URL. The SSR route keeps a bounded in-memory cache of rendered images, so the page should be requested before its `og:image` URL. This works with a long-lived server process; use an external image or a shared image cache when deploying across isolated serverless instances.

Use Astro's server output when the image should be generated on demand:

```ts
import astroOgSeo from "astro-og-seo";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
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

The `OgSeo` usage stays the same. Request the page before its generated URL so the server can render and cache the page-local slot:

```bash
curl http://localhost:4321/guides/intro/
curl http://localhost:4321/_og/guides/intro/index.png --output intro.png
```

SSR images are served at runtime and are not written to `dist/_og` during the build.

## Integration options

| Option             | Default | Description                                                              |
| ------------------ | ------- | ------------------------------------------------------------------------ |
| `siteName`         | —       | Required value for `og:site_name`.                                       |
| `toolbar.enabled`  | `true`  | Registers the SEO inspector in Astro's dev toolbar.                      |
| `image`            | `{}`    | Generated-image settings. Set to `false` to disable image slots.         |
| `image.stylesheet` | —       | CSS file imported and inlined for generated images and toolbar previews. |
| `image.outputDir`  | `"_og"` | Safe relative directory inside Astro's build output.                     |
| `image.width`      | `1200`  | Integer from 1 through 8192.                                             |
| `image.height`     | `630`   | Integer from 1 through 8192.                                             |
| `image.format`     | `"png"` | Output format: `"png"`, `"jpeg"`, or `"webp"`.                           |

## Component props

| Prop                | Description                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| `title`             | Required page, Open Graph, and Twitter title.                                     |
| `description`       | Page, Open Graph, and Twitter description.                                        |
| `canonical`         | Absolute or site-relative canonical URL; defaults to the current pathname.        |
| `lang`              | Open Graph locale in BCP 47 form.                                                 |
| `robots`            | Robots directive string.                                                          |
| `alternates`        | Array of `{ href, hreflang }` entries rendered as alternate links.                |
| `alternateLocales`  | Additional Open Graph locales.                                                    |
| `type`              | `"website"` or `"article"`.                                                       |
| `image`             | External image with `url` and optional `alt`, `width`, `height`, and MIME `type`. |
| `generatedImageAlt` | Alt text for an image slot; defaults to `title`.                                  |
| `article`           | Article publication dates, authors, section, and tags.                            |
| `twitter`           | Twitter card type, site handle, and creator handle.                               |

The package also exports `getOgImagePathname` and its public TypeScript option and prop types from `astro-og-seo`.
