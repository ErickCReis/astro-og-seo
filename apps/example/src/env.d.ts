/// <reference types="astro/client" />

declare module "astro-og-seo" {
  import type { AstroIntegration } from "astro";
  import type { AstroOgSeoOptions } from "../../../packages/astro-og-seo/src/types";

  export function astroOgSeo(options: AstroOgSeoOptions): AstroIntegration;
}

declare module "astro-og-seo/OgSeo.astro" {
  const Component: typeof import("*.astro").default;

  export default Component;
}
