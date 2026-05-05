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
});
