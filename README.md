# astro-og-seo

SEO metadata, build-time Open Graph images, and an actionable Astro dev-toolbar inspector.

The repository contains the published `astro-og-seo` package and two Astro fixtures. The integration targets Astro 6.4+ and Astro 7 on Node 22.12+.

## Capabilities

- Canonical, robots, Open Graph, Twitter, article, and localized alternate metadata.
- Page-local Astro image slots rendered to PNG, JPEG, or WebP with Takumi.
- A dev-toolbar inspector for missing, duplicate, invalid, or conflicting metadata.
- Static image generation with metadata-only support for server output.

## Workspace

```bash
vp install
vp run ready
vp run dev
```

The package source lives in `packages/astro-og-seo`; `apps/example` is the current Astro consumer fixture.

## Release

Releases use npm trusted publishing and provenance. Merge a version change after CI passes, then push a matching `v*` tag. The release workflow rebuilds, retests, inspects the tarball, and publishes it.

See the [package README](packages/astro-og-seo/README.md) for installation and API documentation.
