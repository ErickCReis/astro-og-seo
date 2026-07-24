import { render } from "takumi-js";
import { describe, expect, test, vi } from "vite-plus/test";
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
  test("serializes concurrent renders", async () => {
    const mockedRender = vi.mocked(render);
    const originalImplementation = mockedRender.getMockImplementation()!;
    let activeRenders = 0;
    let maxActiveRenders = 0;

    mockedRender.mockImplementation(async (...arguments_) => {
      activeRenders += 1;
      maxActiveRenders = Math.max(maxActiveRenders, activeRenders);
      await new Promise((resolve) => setTimeout(resolve, 10));

      try {
        return await originalImplementation(...arguments_);
      } finally {
        activeRenders -= 1;
      }
    });

    try {
      await Promise.all([
        renderOgImage("<div>First</div>", createResolvedConfig()),
        renderOgImage("<div>Second</div>", createResolvedConfig()),
      ]);
    } finally {
      mockedRender.mockImplementation(originalImplementation);
    }

    expect(maxActiveRenders).toBe(1);
  });
  test("continues rendering after a failure", async () => {
    const mockedRender = vi.mocked(render);
    const originalImplementation = mockedRender.getMockImplementation()!;

    mockedRender
      .mockRejectedValueOnce(new Error("render failed"))
      .mockImplementationOnce(originalImplementation);

    await expect(renderOgImage("<div>Broken</div>", createResolvedConfig())).rejects.toThrow(
      "render failed",
    );

    const image = Buffer.from(
      await renderOgImage(
        "<div>Recovered</div>",
        createResolvedConfig({ image: { width: 600, height: 315 } }),
      ),
    );
    await assertImage(image, { format: "png", width: 600, height: 315 });
  });
});
