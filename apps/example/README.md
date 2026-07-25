# Example app

This Astro app exercises the local `astro-og-seo` workspace package, including generated Open Graph metadata, image generation, and the dev-toolbar inspector.

Run it from the repository root so the library is built before Astro starts:

```bash
vp install
vp run dev
```

The package integration is configured in `astro.config.ts`. `src/layouts/Layout.astro` shows how to place `OgSeo` in a shared `<head>` and provide a page-local image slot. Production builds write static generated images under `dist/_og`.

## SSR example

Run the same app with Astro's server output:

```bash
cd apps/example
vp run dev:ssr
```

Open `http://localhost:4321/` first, then request its generated image:

```bash
curl http://localhost:4321/
curl http://localhost:4321/_og/index.png --output /tmp/astro-og-seo-example.png
```

The SSR config is in `astro.config.ssr.ts`. It uses the same `OgSeo` component and image slot, but renders the image on demand through the runtime `_og` route instead of writing it during a static build. The first page request populates the process-local image cache used by the second request.
