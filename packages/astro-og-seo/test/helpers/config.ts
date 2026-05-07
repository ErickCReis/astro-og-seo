import type { AstroOgSeoImageFormat, ResolvedAstroOgSeoOptions } from "../../src/types";

export function createResolvedConfig(
  overrides: Partial<ResolvedAstroOgSeoOptions> & {
    format?: AstroOgSeoImageFormat;
  } = {},
): ResolvedAstroOgSeoOptions {
  const { format, image, ...rest } = overrides;

  return {
    siteName: "Test",
    stylesheet: "",
    outDir: "/tmp/dist",
    outputDir: "_og",
    ...rest,
    image: {
      width: 1200,
      height: 630,
      format: format ?? "png",
      ...image,
    },
  };
}
