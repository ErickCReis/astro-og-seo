import type { AstroOgSeoOptions, ResolvedAstroOgSeoOptions } from "./seo/types";

type VirtualModulePlugin = {
  name: string;
  enforce: "pre";
  resolveId(id: string): string | null;
  load(id: string): string | null;
};

function resolveStylesheetSpecifiers(stylesheet: string | string[] | undefined, root?: URL) {
  const paths =
    stylesheet === undefined ? [] : Array.isArray(stylesheet) ? stylesheet : [stylesheet];
  return paths.map((stylesheetPath) =>
    stylesheetPath.startsWith(".") && root
      ? fileURLToPath(new URL(stylesheetPath, root))
      : stylesheetPath,
  );
}

function createStylesheetModule(specifiers: string[]) {
  if (specifiers.length === 0) return "const stylesheet = '';";
  if (specifiers.length === 1) {
    return `import stylesheet from ${JSON.stringify(`${specifiers[0]}?inline`)};`;
  }

  const imports = specifiers.map(
    (specifier, index) =>
      `import stylesheet${index} from ${JSON.stringify(`${specifier}?inline`)};`,
  );
  const values = specifiers.map((_, index) => `stylesheet${index}`).join(", ");
  return [...imports, `const stylesheet = [${values}].join("\\n");`].join("\n");
}

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
      const stylesheet = createStylesheetModule(
        resolveStylesheetSpecifiers(
          options.image === false ? undefined : options.image?.stylesheet,
          root,
        ),
      );
      return [
        stylesheet,
        `export const astroOgSeoConfig = ${JSON.stringify(resolved)};`,
        "if (astroOgSeoConfig.image) astroOgSeoConfig.image.stylesheet = stylesheet;",
      ].join("\n");
    },
  };
}
import { fileURLToPath } from "node:url";
