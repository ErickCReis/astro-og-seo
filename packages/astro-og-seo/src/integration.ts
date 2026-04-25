import { readdir, readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroConfig, AstroIntegration } from "astro";
import type { Plugin } from "vite-plus";
import { getOgImageType, renderOgImage, writeOgImage } from "./runtime";
import type { AstroOgSeoOptions, ResolvedAstroOgSeoOptions } from "./types";

const VIRTUAL_MODULE_ID = "virtual:astro-og-seo";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;
const IMAGE_TEMPLATE_PATTERN =
  /<template data-astro-og-seo-image data-pathname="([^"]*)" data-stylesheet="([^"]*)">([\s\S]*?)<\/template>/g;
const PREVIEW_ENDPOINT = "/__astro-og-seo/preview";

async function collectHtmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(path)));
    } else if (entry.isFile() && path.endsWith(".html")) {
      files.push(path);
    }
  }

  return files;
}

function normalizeOptions(
  options: AstroOgSeoOptions,
  config: AstroConfig,
): Omit<ResolvedAstroOgSeoOptions, "stylesheet"> {
  return {
    siteName: options.siteName,
    outDir: fileURLToPath(config.outDir),
    outputDir: options.outputDir ?? "_og",
    image: {
      width: options.image?.width ?? 1200,
      height: options.image?.height ?? 630,
      format: options.image?.format ?? "png",
    },
  };
}

function createVirtualModulePlugin(
  options: AstroOgSeoOptions,
  resolvedOptions: Omit<ResolvedAstroOgSeoOptions, "stylesheet">,
): Plugin {
  return {
    name: "astro-og-seo:virtual-module",
    enforce: "pre",
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }

      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) {
        return null;
      }

      const stylesheetImport = options.stylesheet
        ? `import stylesheet from ${JSON.stringify(`${options.stylesheet}?inline`)};`
        : "const stylesheet = '';";

      return [
        stylesheetImport,
        "",
        `export const astroOgSeoConfig = ${JSON.stringify(resolvedOptions)};`,
        "astroOgSeoConfig.stylesheet = stylesheet;",
        "",
      ].join("\n");
    },
  };
}

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sendText(response: ServerResponse, statusCode: number, message: string) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.end(message);
}

export default function astroOgSeo(options: AstroOgSeoOptions): AstroIntegration {
  let resolvedOptions: Omit<ResolvedAstroOgSeoOptions, "stylesheet"> | null = null;

  return {
    name: "astro-og-seo",
    hooks: {
      "astro:config:setup": ({ addDevToolbarApp, config, updateConfig }) => {
        resolvedOptions = normalizeOptions(options, config);
        addDevToolbarApp({
          id: "astro-og-seo",
          name: "SEO",
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>',
          entrypoint: new URL("./toolbar-app.ts", import.meta.url),
        });
        updateConfig({
          vite: {
            plugins: [createVirtualModulePlugin(options, resolvedOptions)],
          },
        });
      },
      "astro:config:done": ({ injectTypes }) => {
        injectTypes({
          filename: "astro-og-seo.d.ts",
          content: `/// <reference path="${fileURLToPath(
            new URL("./virtual.d.ts", import.meta.url),
          )}" />`,
        });
      },
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(PREVIEW_ENDPOINT, async (request, response) => {
          if (request.method !== "POST") {
            sendText(response, 405, "Method not allowed");
            return;
          }

          if (!resolvedOptions) {
            sendText(response, 500, "astro-og-seo is not configured");
            return;
          }

          try {
            const payload = JSON.parse(await readRequestBody(request)) as {
              html?: unknown;
              stylesheet?: unknown;
            };

            if (typeof payload.html !== "string") {
              sendText(response, 400, "Missing OG image HTML");
              return;
            }

            const stylesheet =
              typeof payload.stylesheet === "string"
                ? Buffer.from(payload.stylesheet, "base64").toString("utf8")
                : "";
            const config = {
              ...resolvedOptions,
              stylesheet,
            };
            const image = await renderOgImage(payload.html, config);

            response.statusCode = 200;
            response.setHeader("content-type", getOgImageType(config));
            response.end(image);
          } catch (error) {
            sendText(
              response,
              500,
              error instanceof Error ? error.message : "Unable to render OG image",
            );
          }
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
          const matches = [...html.matchAll(IMAGE_TEMPLATE_PATTERN)];

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

          await writeFile(file, html.replace(IMAGE_TEMPLATE_PATTERN, ""));
        }

        logger.info(
          `generated ${generatedCount} Open Graph image${generatedCount === 1 ? "" : "s"}`,
        );
      },
    },
  };
}
