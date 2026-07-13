import { astroOgSeo } from "../../../src";
import { defineConfig } from "astro/config";

export default defineConfig({
  outDir: "./dist",
  site: "https://example.test",
  integrations: [
    astroOgSeo({
      siteName: "Fixture Site",
      image: {
        stylesheet: "./src/layouts/og-image.css",
        outputDir: "social",
        width: 600,
        height: 315,
        format: "png",
      },
    }),
  ],
});
