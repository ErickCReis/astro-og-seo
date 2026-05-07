import { describe, expect, test } from "vite-plus/test";
import { resolveAstroOgSeoOptions } from "../../src/options";

function astroConfig(outDir = new URL("file:///tmp/site/dist/")) {
  return { outDir } as never;
}

describe("resolveAstroOgSeoOptions", () => {
  test("applies defaults", () => {
    expect(resolveAstroOgSeoOptions({ siteName: "Site" }, astroConfig())).toEqual({
      siteName: "Site",
      outDir: "/tmp/site/dist/",
      outputDir: "_og",
      image: {
        width: 1200,
        height: 630,
        format: "png",
      },
    });
  });

  test("applies custom output and image options", () => {
    expect(
      resolveAstroOgSeoOptions(
        {
          siteName: "Site",
          outputDir: "social",
          image: {
            width: 600,
            height: 315,
            format: "webp",
          },
        },
        astroConfig(),
      ),
    ).toMatchObject({
      outputDir: "social",
      image: {
        width: 600,
        height: 315,
        format: "webp",
      },
    });
  });

  test("merges partial image overrides with defaults", () => {
    const result = resolveAstroOgSeoOptions(
      { siteName: "Site", image: { format: "jpeg" } },
      astroConfig(),
    );

    expect(result.image).toEqual({ width: 1200, height: 630, format: "jpeg" });
  });

  test("resolves outDir from AstroConfig URL", () => {
    const result = resolveAstroOgSeoOptions(
      { siteName: "Site" },
      astroConfig(new URL("file:///home/user/project/build/")),
    );

    expect(result.outDir).toBe("/home/user/project/build/");
  });
});
