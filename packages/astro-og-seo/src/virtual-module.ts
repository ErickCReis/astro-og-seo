import type { AstroOgSeoOptions, ResolvedAstroOgSeoOptions } from "./seo/types";

type VirtualModulePlugin = {
  name: string;
  enforce: "pre";
  resolveId(id: string): string | null;
  load(id: string): string | null;
};

export const VIRTUAL_MODULE_ID = "virtual:astro-og-seo";
export const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

export function createVirtualModulePlugin(
  options: AstroOgSeoOptions,
  getResolvedOptions: () => ResolvedAstroOgSeoOptions,
  root?: URL,
): VirtualModulePlugin {
  return {
    name: "astro-og-seo:virtual-module",
    enforce: "pre",
    resolveId(id) {
      return id === VIRTUAL_MODULE_ID ? RESOLVED_VIRTUAL_MODULE_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return null;
      const resolved = getResolvedOptions();
      const stylesheetPath = options.image !== false ? options.image?.stylesheet : undefined;
      const stylesheetSpecifier =
        stylesheetPath?.startsWith(".") && root
          ? fileURLToPath(new URL(stylesheetPath, root))
          : stylesheetPath;
      const stylesheet = stylesheetSpecifier
        ? `import stylesheet from ${JSON.stringify(`${stylesheetSpecifier}?inline`)};`
        : "const stylesheet = '';";
      return [
        stylesheet,
        `export const astroOgSeoConfig = ${JSON.stringify(resolved)};`,
        "if (astroOgSeoConfig.image) astroOgSeoConfig.image.stylesheet = stylesheet;",
      ].join("\n");
    },
  };
}
import { fileURLToPath } from "node:url";
