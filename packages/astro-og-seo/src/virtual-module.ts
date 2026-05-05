import type { Plugin } from "vite-plus";
import type { AstroOgSeoOptions, ResolvedAstroOgSeoOptions } from "./types";

export const VIRTUAL_MODULE_ID = "virtual:astro-og-seo";
export const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

export function createVirtualModulePlugin(
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
