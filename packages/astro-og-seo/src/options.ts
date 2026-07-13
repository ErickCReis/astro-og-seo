import { isAbsolute, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroConfig } from "astro";
import type { AstroOgSeoOptions, ResolvedAstroOgSeoOptions } from "./seo/types";

const imageFormats = new Set(["png", "jpeg", "webp"]);

function assertDimension(value: number, name: string) {
  if (!Number.isInteger(value) || value <= 0 || value > 8192) {
    throw new Error(`astro-og-seo: image.${name} must be an integer between 1 and 8192`);
  }
}

export function normalizeOutputDir(value: string) {
  const trimmed = value.replace(/^\/+|\/+$/g, "");
  const normalized = normalize(trimmed);
  const segments = normalized.split(sep);

  if (
    !trimmed ||
    isAbsolute(value) ||
    normalized === ".." ||
    segments.includes("..") ||
    segments.includes(".")
  ) {
    throw new Error("astro-og-seo: image.outputDir must be a safe relative directory");
  }

  return normalized.replaceAll(sep, "/");
}

export function resolveAstroOgSeoOptions(
  options: AstroOgSeoOptions,
  config: AstroConfig,
  buildOutput: "static" | "server" = "static",
): ResolvedAstroOgSeoOptions {
  if (!options.siteName.trim()) throw new Error("astro-og-seo: siteName is required");
  if (!config.site) throw new Error("astro-og-seo: Astro's `site` configuration is required");

  const rawImage = options.image === false ? false : (options.image ?? {});
  const width = rawImage === false ? 1200 : (rawImage.width ?? 1200);
  const height = rawImage === false ? 630 : (rawImage.height ?? 630);
  const format = rawImage === false ? "png" : (rawImage.format ?? "png");

  assertDimension(width, "width");
  assertDimension(height, "height");
  if (!imageFormats.has(format))
    throw new Error(`astro-og-seo: unsupported image format ${format}`);

  return {
    siteName: options.siteName.trim(),
    site: config.site.toString(),
    outDir: fileURLToPath(config.outDir),
    buildOutput,
    toolbarEnabled: options.toolbar?.enabled ?? true,
    image:
      rawImage === false
        ? false
        : {
            stylesheet: "",
            outputDir: normalizeOutputDir(rawImage.outputDir ?? "_og"),
            width,
            height,
            format,
          },
  };
}
