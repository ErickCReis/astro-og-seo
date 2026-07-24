# Example app

This Astro app exercises the local `astro-og-seo` workspace package, including generated Open Graph metadata, image generation, and the dev-toolbar inspector.

Run it from the repository root so the library is built before Astro starts:

```bash
vp install
vp run dev
```

The package integration is configured in `astro.config.ts`. `src/layouts/Layout.astro` shows how to place `OgSeo` in a shared `<head>` and provide a page-local image slot. Production builds write the generated image under `dist/_og`.
