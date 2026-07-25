import { astroOgSeo } from "astro-og-seo";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  site: "https://example.com",
  devToolbar: {
    enabled: true,
  },
  integrations: [
    astroOgSeo({
      siteName: "Astro OG SEO SSR Example",
      image: {
        stylesheet: "./src/layouts/og-image.css",
        outputDir: "_og",
        width: 1200,
        height: 630,
        format: "png",
      },
    }),
  ],
});
