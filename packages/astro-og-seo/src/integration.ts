import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { AstroConfig, AstroIntegration } from "astro";
import { generateBuildImages } from "./image/build";
import { handlePreviewRequest, PREVIEW_ENDPOINT } from "./image/preview";
import { resolveAstroOgSeoOptions } from "./options";
import type { AstroOgSeoOptions, ResolvedAstroOgSeoOptions } from "./seo/types";
import { createVirtualModulePlugin } from "./virtual-module";

const require = createRequire(import.meta.url);

function getNodeRenderAliases() {
  return { "@takumi-rs/core": require.resolve("@takumi-rs/core") };
}

export function astroOgSeo(options: AstroOgSeoOptions): AstroIntegration {
  let astroConfig: AstroConfig;
  let resolvedOptions: ResolvedAstroOgSeoOptions;

  return {
    name: "astro-og-seo",
    hooks: {
      "astro:config:setup": ({ addDevToolbarApp, config, updateConfig }) => {
        astroConfig = config;
        resolvedOptions = resolveAstroOgSeoOptions(options, config);
        if (resolvedOptions.toolbarEnabled) {
          addDevToolbarApp({
            id: "astro-og-seo",
            name: "SEO Inspector",
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>',
            entrypoint: new URL("./toolbar-app.mjs", import.meta.url),
          });
        }
        updateConfig({
          vite: {
            resolve: { alias: getNodeRenderAliases() },
            ssr: { noExternal: ["takumi-js", "@takumi-rs/core"] },
            plugins: [createVirtualModulePlugin(options, () => resolvedOptions, config.root)],
          },
        });
      },
      "astro:config:done": ({ buildOutput, injectTypes, logger }) => {
        resolvedOptions = resolveAstroOgSeoOptions(options, astroConfig, buildOutput);
        if (buildOutput === "server" && resolvedOptions.image !== false) {
          logger.warn(
            "generated images are unavailable for server output; external image metadata still works",
          );
        }
        injectTypes({
          filename: "astro-og-seo.d.ts",
          content: `declare module "virtual:astro-og-seo" {
  export const astroOgSeoConfig: {
    siteName: string;
    site: string;
    outDir: string;
    buildOutput: "static" | "server";
    toolbarEnabled: boolean;
    image: false | { stylesheet: string; outputDir: string; width: number; height: number; format: "png" | "jpeg" | "webp" };
  };
}`,
        });
      },
      "astro:server:setup": ({ logger, server }) => {
        server.middlewares.use(PREVIEW_ENDPOINT, async (request, response) => {
          await handlePreviewRequest(request, response, resolvedOptions, logger);
        });
      },
      "astro:build:done": async ({ dir, logger }) => {
        if (resolvedOptions.buildOutput === "server") return;
        await generateBuildImages(fileURLToPath(dir), resolvedOptions, logger);
      },
    },
  };
}
