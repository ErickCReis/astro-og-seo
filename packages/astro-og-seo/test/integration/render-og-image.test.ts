import { describe, expect, test } from "vite-plus/test";
import { renderOgImage } from "../../src/runtime";
import { assertImage, expectImageToMatchSnapshot } from "../helpers/image";
import { createResolvedConfig } from "../helpers/config";

describe("renderOgImage", () => {
  test.each(["png", "jpeg", "webp"] as const)("renders %s images", async (format) => {
    const image = Buffer.from(
      await renderOgImage(
        '<div class="card">OG Image</div>',
        createResolvedConfig({
          format,
          image: {
            width: 600,
            height: 315,
            stylesheet: ".card{display:flex;background:#0f766e;color:white}",
          },
        }),
      ),
    );
    await assertImage(image, { format, width: 600, height: 315 });
    await expectImageToMatchSnapshot(image, `render-og-image-${format}`);
  });
  test("renders without a stylesheet", async () => {
    const image = Buffer.from(
      await renderOgImage(
        "<div>Plain</div>",
        createResolvedConfig({ image: { width: 600, height: 315 } }),
      ),
    );
    await assertImage(image, { format: "png", width: 600, height: 315 });
    expect(image.byteLength).toBeGreaterThan(100);
  });
});
