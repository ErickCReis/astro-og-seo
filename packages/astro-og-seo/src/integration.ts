import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { generateOgImagesFromHtmlDir } from "./build";
import { resolveAstroOgSeoOptions } from "./options";
import { handlePreviewRequest, PREVIEW_ENDPOINT } from "./preview";
import { createVirtualModulePlugin } from "./virtual-module";
import type { AstroOgSeoOptions, ResolvedAstroOgSeoOptions } from "./types";

function getNodeRenderAliases() {
  return {
    "@takumi-rs/core": fileURLToPath(
      new URL("../node_modules/@takumi-rs/core/dist/export.mjs", import.meta.url),
    ),
  };
}

export function astroOgSeo(options: AstroOgSeoOptions): AstroIntegration {
  let resolvedOptions: Omit<ResolvedAstroOgSeoOptions, "stylesheet"> | null = null;

  return {
    name: "astro-og-seo",
    hooks: {
      "astro:config:setup": ({ addDevToolbarApp, config, updateConfig }) => {
        resolvedOptions = resolveAstroOgSeoOptions(options, config);
        addDevToolbarApp({
          id: "astro-og-seo",
          name: "SEO",
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>',
          entrypoint: new URL("./toolbar-app.mjs", import.meta.url),
        });
        updateConfig({
          vite: {
            resolve: {
              alias: getNodeRenderAliases(),
              conditions: ["node", "import", "default"],
            },
            ssr: {
              noExternal: ["takumi-js", "@takumi-rs/core"],
            },
            plugins: [createVirtualModulePlugin(options, resolvedOptions)],
          },
        });
      },
      "astro:config:done": ({ injectTypes }) => {
        injectTypes({
          filename: "astro-og-seo.d.ts",
          content: `declare module "virtual:astro-og-seo" {
  import type { ResolvedAstroOgSeoOptions } from "astro-og-seo";

  export const astroOgSeoConfig: ResolvedAstroOgSeoOptions;
}
`,
        });
      },
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(PREVIEW_ENDPOINT, async (request, response) => {
          await handlePreviewRequest(request, response, resolvedOptions);
        });
      },
      "astro:build:done": async ({ dir, logger }) => {
        if (!resolvedOptions) {
          return;
        }

        const generatedCount = await generateOgImagesFromHtmlDir(
          fileURLToPath(dir),
          resolvedOptions,
        );

        logger.info(
          `generated ${generatedCount} Open Graph image${generatedCount === 1 ? "" : "s"}`,
        );
      },
    },
  };
}
