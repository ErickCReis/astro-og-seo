# astro-og-seo

SEO metadata, static and SSR Open Graph images, and an actionable Astro dev-toolbar inspector.

The repository contains the published `astro-og-seo` package, an example app, and the package's test fixtures. The integration supports Astro 6.4+ and Astro 7 on Node 22.12+.

## Capabilities

- Canonical, robots, Open Graph, Twitter, article, and localized alternate metadata.
- Page-local Astro image slots rendered to PNG, JPEG, or WebP with Takumi.
- A dev-toolbar inspector for missing, duplicate, invalid, or conflicting metadata.
- Static image generation and request-time image rendering for server output.

## Workspace

Install [Vite+](https://viteplus.dev/guide/) and run commands from the repository root:

```bash
vp install
vp run ready
vp run dev
```

- `vp run ready` builds the package, checks the workspace, runs every test suite, inspects the package tarball, and builds all workspaces.
- `vp run dev` builds the package once, then watches the library and starts the example app.
- `vp run test` runs the library's unit, integration, browser, and end-to-end tests.

The package source lives in `packages/astro-og-seo`; `apps/example` is the interactive consumer fixture.

## Release

Releases use npm trusted publishing and provenance. Merge a version change after CI passes, then push a matching `v*` tag. The release workflow rebuilds, retests, inspects the tarball, and publishes it.

See the [package README](packages/astro-og-seo/README.md) for installation and API documentation.
