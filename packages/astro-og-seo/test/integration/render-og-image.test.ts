import { describe, expect, test } from "vite-plus/test";
import { renderOgImage } from "../../src/runtime";
import type { ResolvedAstroOgSeoOptions } from "../../src/types";
import { assertImage, expectImageToMatchSnapshot } from "../helpers/image";

function config(format: ResolvedAstroOgSeoOptions["image"]["format"]) {
  return {
    siteName: "Site",
    stylesheet:
      ".card{width:600px;height:315px;display:flex;align-items:center;justify-content:center;background:#0f766e;color:white;font:700 48px Arial;}",
    outDir: "/tmp/dist",
    outputDir: "_og",
    image: {
      width: 600,
      height: 315,
      format,
    },
  } satisfies ResolvedAstroOgSeoOptions;
}

describe("renderOgImage", () => {
  test.each(["png", "jpeg", "webp"] as const)("renders %s images", async (format) => {
    const image = Buffer.from(
      await renderOgImage('<div class="card">OG Image</div>', config(format)),
    );

    await assertImage(image, { format, width: 600, height: 315 });
    await expectImageToMatchSnapshot(image, `render-og-image-${format}`);
  });

  test("renders without a stylesheet", async () => {
    const image = Buffer.from(
      await renderOgImage("<div>Plain fallback</div>", {
        ...config("png"),
        stylesheet: "",
      }),
    );

    await assertImage(image, { format: "png", width: 600, height: 315 });
    expect(image.byteLength).toBeGreaterThan(100);
  });
});
