export type AstroOgSeoImageFormat = "png" | "jpeg" | "webp";

export type AstroOgSeoImageOptions = {
  stylesheet?: string | string[];
  outputDir?: string;
  width?: number;
  height?: number;
  format?: AstroOgSeoImageFormat;
};

export type AstroOgSeoOptions = {
  siteName: string;
  toolbar?: {
    enabled?: boolean;
  };
  image?: false | AstroOgSeoImageOptions;
};

export type OgSeoAlternate = {
  href: string | URL;
  hreflang: string;
};

export type OgSeoExternalImage = {
  url: string | URL;
  alt?: string;
  width?: number;
  height?: number;
  type?: string;
};

export type OgSeoArticle = {
  publishedTime: Date | string;
  modifiedTime?: Date | string;
  authors?: string[];
  section?: string;
  tags?: string[];
};

export type OgSeoTwitter = {
  card?: "summary" | "summary_large_image";
  site?: string;
  creator?: string;
};

export type OgSeoProps = {
  title: string;
  description?: string;
  canonical?: string | URL;
  lang?: string;
  robots?: string;
  alternates?: OgSeoAlternate[];
  alternateLocales?: string[];
  type?: "website" | "article";
  image?: OgSeoExternalImage;
  generatedImageAlt?: string;
  article?: OgSeoArticle;
  twitter?: OgSeoTwitter;
};

export type ResolvedAstroOgSeoOptions = {
  siteName: string;
  site: string;
  outDir: string;
  buildOutput: "static" | "server";
  toolbarEnabled: boolean;
  image:
    | false
    | {
        stylesheet: string;
        outputDir: string;
        width: number;
        height: number;
        format: AstroOgSeoImageFormat;
      };
};
