import { astroOgSeo } from "astro-og-seo";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: {
    enabled: true,
  },
  integrations: [
    astroOgSeo({
      siteName: "Astro OG SEO Example",
      image: {
        stylesheet: ["./src/layouts/og-image.css", "./src/styles/global.css"],
        outputDir: "_og",
        width: 1200,
        height: 630,
        format: "png",
      },
    }),
  ],
});
