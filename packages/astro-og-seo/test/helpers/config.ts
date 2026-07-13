import type { AstroOgSeoImageFormat, ResolvedAstroOgSeoOptions } from "../../src/types";

export type ResolvedImageConfig = ResolvedAstroOgSeoOptions & {
  image: Exclude<ResolvedAstroOgSeoOptions["image"], false>;
};

export function createResolvedConfig(
  overrides: Partial<Omit<ResolvedAstroOgSeoOptions, "image">> & {
    format?: AstroOgSeoImageFormat;
    image?: Partial<ResolvedImageConfig["image"]>;
  } = {},
): ResolvedImageConfig {
  const { format, image, ...rest } = overrides;
  return {
    siteName: "Test",
    site: "https://example.test",
    outDir: "/tmp/dist",
    buildOutput: "static",
    toolbarEnabled: true,
    ...rest,
    image: {
      stylesheet: "",
      outputDir: "_og",
      width: 1200,
      height: 630,
      format: format ?? "png",
      ...image,
    },
  };
}
