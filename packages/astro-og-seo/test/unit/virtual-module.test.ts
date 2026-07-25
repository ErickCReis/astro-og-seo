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
    const plugin = createVirtualModulePlugin({ siteName: "Site" }, () => resolvedOptions);
    expect(plugin.resolveId(VIRTUAL_MODULE_ID)).toBe(RESOLVED_VIRTUAL_MODULE_ID);
    expect(plugin.resolveId("other")).toBeNull();
  });

  test("returns null when loading a non-matching id", () => {
    const plugin = createVirtualModulePlugin({ siteName: "Site" }, () => resolvedOptions);
    expect(plugin.load("some-other-module")).toBeNull();
  });

  test("loads a module without a stylesheet", () => {
    const plugin = createVirtualModulePlugin({ siteName: "Site" }, () => resolvedOptions);
    const code = plugin.load(RESOLVED_VIRTUAL_MODULE_ID);

    expect(code).toContain("const stylesheet = '';");
    expect(code).toContain("export const astroOgSeoConfig");
    expect(code).toContain("astroOgSeoConfig.image.stylesheet = stylesheet");
  });

  test("loads a module with an inline stylesheet import", () => {
    const plugin = createVirtualModulePlugin(
      { siteName: "Site", image: { stylesheet: "./src/og.css" } },
      () => resolvedOptions,
    );
    const code = plugin.load(RESOLVED_VIRTUAL_MODULE_ID);

    expect(code).toContain('import stylesheet from "./src/og.css?inline";');
  });

  test("loads and combines multiple inline stylesheet imports", () => {
    const plugin = createVirtualModulePlugin(
      {
        siteName: "Site",
        image: { stylesheet: ["./src/base.css", "./src/tailwind.css"] },
      },
      () => resolvedOptions,
    );
    const code = plugin.load(RESOLVED_VIRTUAL_MODULE_ID);

    expect(code).toContain('import stylesheet0 from "./src/base.css?inline";');
    expect(code).toContain('import stylesheet1 from "./src/tailwind.css?inline";');
    expect(code).toContain('const stylesheet = [stylesheet0, stylesheet1].join("\\n");');
  });

  test("serializes resolved options into the generated module", () => {
    const custom = createResolvedConfig({ siteName: "My Blog", image: { outputDir: "social" } });
    const plugin = createVirtualModulePlugin({ siteName: "My Blog" }, () => custom);
    const code = plugin.load(RESOLVED_VIRTUAL_MODULE_ID)!;

    expect(code).toContain('"siteName":"My Blog"');
    expect(code).toContain('"outputDir":"social"');
  });
});
