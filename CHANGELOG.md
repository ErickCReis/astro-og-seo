# Changelog

## 0.1.4

- Serialize Takumi rendering to prevent elements from intermittently disappearing when multiple Open Graph images are generated concurrently.

## 0.1.3

- Update Astro, Takumi, Vite+, TypeScript, and the remaining workspace dependencies, including transitive security patches.
- Adapt generated-image rendering to Takumi 2's format-specific API and bundled default fonts.
- Expand package and workspace documentation, and replace the example's starter README.

## 0.1.2

- Sort SEO diagnostics by severity and streamline the toolbar summary.
- Improve the inspector header, page-path labeling, and scrolling behavior.
- Fix root test discovery, E2E task behavior, and dev-server startup ordering.

## 0.1.1

- Constrain the SEO inspector to Astro's dev-toolbar window.
- Simplify diagnostic summaries and collapse passing checks by default.
- Add browser coverage for horizontal toolbar overflow.

## 0.1.0

- Redesign the public metadata and integration APIs.
- Add secure build markers, bounded image rendering, and safer preview requests.
- Add actionable SEO diagnostics to the Astro dev toolbar.
- Support Astro 6.4+ and Astro 7 with Node 22.12+.
- Add package exports, discovery metadata, release gates, and consumer documentation.
