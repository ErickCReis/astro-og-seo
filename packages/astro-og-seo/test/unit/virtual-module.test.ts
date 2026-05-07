import { describe, expect, test } from "vite-plus/test";
import {
  createVirtualModulePlugin,
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
} from "../../src/virtual-module";
import { createResolvedConfig } from "../helpers/config";

const resolvedOptions = createResolvedConfig();

describe("createVirtualModulePlugin", () => {
  test("resolves the virtual module id", () => {
    const plugin = createVirtualModulePlugin({ siteName: "Site" }, resolvedOptions);
    const resolveId = plugin.resolveId as (id: string) => string | null;

    expect(resolveId(VIRTUAL_MODULE_ID)).toBe(RESOLVED_VIRTUAL_MODULE_ID);
    expect(resolveId("other")).toBeNull();
  });

  test("returns null when loading a non-matching id", () => {
    const plugin = createVirtualModulePlugin({ siteName: "Site" }, resolvedOptions);
    const load = plugin.load as (id: string) => string | null;

    expect(load("some-other-module")).toBeNull();
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

  test("serializes resolved options into the generated module", () => {
    const custom = createResolvedConfig({ siteName: "My Blog", outputDir: "social" });
    const plugin = createVirtualModulePlugin({ siteName: "My Blog" }, custom);
    const load = plugin.load as (id: string) => string | null;
    const code = load(RESOLVED_VIRTUAL_MODULE_ID)!;

    expect(code).toContain('"siteName":"My Blog"');
    expect(code).toContain('"outputDir":"social"');
  });
});
