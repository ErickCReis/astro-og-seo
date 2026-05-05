import { fileURLToPath } from "node:url";
import type { AstroConfig } from "astro";
import type { AstroOgSeoOptions, ResolvedAstroOgSeoOptions } from "./types";

export function resolveAstroOgSeoOptions(
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
