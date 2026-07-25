import { dirname, join, relative } from "node:path";
import type { ResolvedAstroOgSeoOptions } from "../seo/types";

function getPathSegments(pathname: string) {
  return pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        throw new Error(`astro-og-seo: malformed pathname ${pathname}`);
      }
    });
}

export function getOgImagePathname(
  pathname: string,
  config: Pick<ResolvedAstroOgSeoOptions, "image">,
) {
  if (config.image === false) throw new Error("astro-og-seo: generated images are disabled");
  return `/${[config.image.outputDir, ...getPathSegments(pathname), `index.${config.image.format}`].join("/")}`;
}

export function getOutputPath(pathname: string, config: ResolvedAstroOgSeoOptions) {
  const outputPath = join(config.outDir, getOgImagePathname(pathname, config).replace(/^\/+/, ""));
  const fromRoot = relative(config.outDir, outputPath);
  if (fromRoot.startsWith("..") || dirname(outputPath) === "..") {
    throw new Error(`astro-og-seo: generated image path escapes outDir for ${pathname}`);
  }
  return outputPath;
}

export function getImageMimeType(format: "png" | "jpeg" | "webp") {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}
