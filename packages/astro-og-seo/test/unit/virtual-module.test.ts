import { describe, expect, test } from "vite-plus/test";
import {
  createVirtualModulePlugin,
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
} from "../../src/virtual-module";

const resolvedOptions = {
  siteName: "Site",
  outDir: "/tmp/dist",
  outputDir: "_og",
  image: {
    width: 1200,
    height: 630,
    format: "png" as const,
  },
};

describe("createVirtualModulePlugin", () => {
  test("resolves the virtual module id", () => {
    const plugin = createVirtualModulePlugin({ siteName: "Site" }, resolvedOptions);
    const resolveId = plugin.resolveId as (id: string) => string | null;

    expect(resolveId(VIRTUAL_MODULE_ID)).toBe(RESOLVED_VIRTUAL_MODULE_ID);
    expect(resolveId("other")).toBeNull();
  });

  test("loads a module without a stylesheet", () => {
    const plugin = createVirtualModulePlugin({ siteName: "Site" }, resolvedOptions);
    const load = plugin.load as (id: string) => string | null;
    const code = load(RESOLVED_VIRTUAL_MODULE_ID);

    expect(code).toContain("const stylesheet = '';");
    expect(code).toContain("export const astroOgSeoConfig");
    expect(code).toContain("astroOgSeoConfig.stylesheet = stylesheet;");
  });

  test("loads a module with an inline stylesheet import", () => {
    const plugin = createVirtualModulePlugin(
      { siteName: "Site", stylesheet: "./src/og.css" },
      resolvedOptions,
    );
    const load = plugin.load as (id: string) => string | null;
    const code = load(RESOLVED_VIRTUAL_MODULE_ID);

    expect(code).toContain('import stylesheet from "./src/og.css?inline";');
  });
});
