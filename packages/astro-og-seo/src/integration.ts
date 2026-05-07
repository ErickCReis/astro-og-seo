import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { resolveAstroOgSeoOptions } from "./options";
import { handlePreviewRequest, PREVIEW_ENDPOINT } from "./preview";
import { writeOgImage } from "./runtime";
import { createVirtualModulePlugin } from "./virtual-module";
import type { AstroOgSeoOptions, ResolvedAstroOgSeoOptions } from "./types";

const imageTemplatePattern =
  /<template data-astro-og-seo-image data-pathname="([^"]*)"(?: data-stylesheet(?:="([^"]*)")?)?>([\s\S]*?)<\/template>/g;

async function collectHtmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true });

  return entries.filter((entry) => entry.endsWith(".html")).map((entry) => join(dir, entry));
}

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

        const htmlFiles = await collectHtmlFiles(fileURLToPath(dir));
        let generatedCount = 0;

        for (const file of htmlFiles) {
          const html = await readFile(file, "utf8");
          const matches = [...html.matchAll(imageTemplatePattern)];

          if (matches.length === 0) {
            continue;
          }

          for (const match of matches) {
            const [, pathname = "/", encodedStylesheet = "", imageHtml = ""] = match;
            const stylesheet = Buffer.from(encodedStylesheet, "base64").toString("utf8");

            await writeOgImage(imageHtml, pathname, {
              ...resolvedOptions,
              stylesheet,
            });
            generatedCount += 1;
          }

          await writeFile(file, html.replace(imageTemplatePattern, ""));
        }

        logger.info(
          `generated ${generatedCount} Open Graph image${generatedCount === 1 ? "" : "s"}`,
        );
      },
    },
  };
}
