import { describe, expect, test } from "vite-plus/test";
import { normalizeOutputDir, resolveAstroOgSeoOptions } from "../../src/options";

function astroConfig(outDir = new URL("file:///tmp/site/dist/")) {
  return { outDir, site: new URL("https://example.test") } as never;
}

describe("resolveAstroOgSeoOptions", () => {
  test("applies defaults", () => {
    expect(resolveAstroOgSeoOptions({ siteName: "Site" }, astroConfig())).toMatchObject({
      siteName: "Site",
      site: "https://example.test/",
      outDir: "/tmp/site/dist/",
      buildOutput: "static",
      toolbarEnabled: true,
      image: { stylesheet: "", outputDir: "_og", width: 1200, height: 630, format: "png" },
    });
  });
  test("applies image options", () => {
    expect(
      resolveAstroOgSeoOptions(
        {
          siteName: "Site",
          image: { outputDir: "assets/og", width: 600, height: 315, format: "webp" },
        },
        astroConfig(),
      ),
    ).toMatchObject({ image: { outputDir: "assets/og", width: 600, height: 315, format: "webp" } });
  });
  test("supports disabling images and toolbar", () => {
    expect(
      resolveAstroOgSeoOptions(
        { siteName: "Site", image: false, toolbar: { enabled: false } },
        astroConfig(),
      ),
    ).toMatchObject({ image: false, toolbarEnabled: false });
  });
  test.each(["../outside", "/absolute", "a/../../b", ""])(
    "rejects unsafe output directory %s",
    (outputDir) => {
      expect(() => normalizeOutputDir(outputDir)).toThrow("safe relative directory");
    },
  );
  test.each([0, -1, 1.5, 8193])("rejects invalid dimensions %s", (width) => {
    expect(() =>
      resolveAstroOgSeoOptions({ siteName: "Site", image: { width } }, astroConfig()),
    ).toThrow("between 1 and 8192");
  });
  test("requires Astro site", () => {
    expect(() =>
      resolveAstroOgSeoOptions({ siteName: "Site" }, {
        outDir: new URL("file:///tmp/dist"),
      } as never),
    ).toThrow("`site`");
  });
});
