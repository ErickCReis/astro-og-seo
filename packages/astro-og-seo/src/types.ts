export type AstroOgSeoImageFormat = "png" | "jpeg" | "webp";

export type AstroOgSeoOptions = {
  siteName: string;
  stylesheet?: string;
  outputDir?: string;
  image?: {
    width?: number;
    height?: number;
    format?: AstroOgSeoImageFormat;
  };
};

export type ResolvedAstroOgSeoOptions = {
  siteName: string;
  stylesheet: string;
  outDir: string;
  outputDir: string;
  image: {
    width: number;
    height: number;
    format: AstroOgSeoImageFormat;
  };
};
