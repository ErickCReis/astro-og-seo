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

export type OgSeoAlternate = {
  href: string;
  hrefLang: string;
};

export type OgSeoArticle = {
  publishedTime: Date | string;
  modifiedTime?: Date | string;
};

export type OgSeoProps = {
  title: string;
  description?: string;
  lang?: string;
  canonical?: string | URL;
  alternates?: OgSeoAlternate[];
  article?: OgSeoArticle;
};
