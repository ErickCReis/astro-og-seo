# Example app

This Astro app exercises the local `astro-og-seo` workspace package, including generated Open Graph metadata, image generation, and the dev-toolbar inspector.

Run it from the repository root so the library is built before Astro starts:

```bash
vp install
vp run dev
```

The package integration is configured in `astro.config.ts`. The home route (`/`) renders its OG image with plain CSS from `src/layouts/og-image.css`; `/tailwind` renders the same kind of image with Tailwind utilities from `src/styles/global.css`. The `image.stylesheet` option demonstrates combining both stylesheets. Production builds write both generated images under `dist/_og`.
