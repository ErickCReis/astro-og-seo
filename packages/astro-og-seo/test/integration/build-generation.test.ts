import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { astroOgSeo } from "../../src/integration";
import { assertImage, expectImageToMatchSnapshot } from "../helpers/image";
import { createTempDir, removeTempDir } from "../helpers/paths";

let tempDir: string;

beforeEach(async () => {
  tempDir = await createTempDir("build");
});

afterEach(async () => {
  await removeTempDir(tempDir);
});

async function runBuildDone(outDir: string) {
  const logger = { info: vi.fn() };
  const integration = astroOgSeo({
    siteName: "Site",
    outputDir: "social",
    image: {
      width: 600,
      height: 315,
      format: "png",
    },
  });

  await integration.hooks["astro:config:setup"]?.({
    addDevToolbarApp: vi.fn(),
    config: { outDir: pathToFileURL(`${outDir}/`) },
    updateConfig: vi.fn(),
  } as never);
  await integration.hooks["astro:build:done"]?.({
    dir: pathToFileURL(`${outDir}/`),
    logger,
  } as never);

  return logger;
}

describe("Astro build image generation", () => {
  test("generates images from nested HTML files", async () => {
    const htmlDir = join(tempDir, "dist", "blog", "post");
    const outDir = join(tempDir, "dist");
    const stylesheet = Buffer.from(
      ".card{width:600px;height:315px;background:#be123c;color:white;display:flex;align-items:center;justify-content:center;font:700 44px Arial;}",
    ).toString("base64");

    await mkdir(htmlDir, { recursive: true });
    await writeFile(
      join(htmlDir, "index.html"),
      `<html><head><template data-astro-og-seo-image data-pathname="/blog/post/" data-stylesheet="${stylesheet}"><div class="card">Build</div></template></head><body>Post</body></html>`,
    );

    const logger = await runBuildDone(outDir);
    const html = await readFile(join(htmlDir, "index.html"), "utf8");
    const image = await readFile(join(outDir, "social", "blog", "post", "index.png"));

    expect(logger.info).toHaveBeenCalledWith("generated 1 Open Graph image");
    expect(html).not.toContain("data-astro-og-seo-image");
    await assertImage(image, { format: "png", width: 600, height: 315 });
    await expectImageToMatchSnapshot(image, "build-generation-png");
  });

  test("leaves directories without templates unchanged", async () => {
    const outDir = join(tempDir, "dist");
    const htmlPath = join(outDir, "plain", "index.html");

    await mkdir(join(outDir, "plain"), { recursive: true });
    await writeFile(htmlPath, "<html><head></head><body>Plain</body></html>");

    const logger = await runBuildDone(outDir);

    expect(logger.info).toHaveBeenCalledWith("generated 0 Open Graph images");
    expect(await readFile(htmlPath, "utf8")).toBe("<html><head></head><body>Plain</body></html>");
  });

  test("supports multiple templates in one HTML file", async () => {
    const outDir = join(tempDir, "dist");
    const htmlPath = join(outDir, "index.html");
    const stylesheet = Buffer.from(".one{}").toString("base64");

    await mkdir(outDir, { recursive: true });
    await writeFile(
      htmlPath,
      [
        '<template data-astro-og-seo-image data-pathname="/" data-stylesheet="',
        stylesheet,
        '"><div>One</div></template>',
        '<template data-astro-og-seo-image data-pathname="/two/"><div>Two</div></template>',
      ].join(""),
    );

    const logger = await runBuildDone(outDir);
    const html = await readFile(htmlPath, "utf8");

    expect(logger.info).toHaveBeenCalledWith("generated 2 Open Graph images");
    expect(html).toBe("");
    await assertImage(await readFile(join(outDir, "social", "index.png")), {
      format: "png",
      width: 600,
      height: 315,
    });
    await assertImage(await readFile(join(outDir, "social", "two", "index.png")), {
      format: "png",
      width: 600,
      height: 315,
    });
  });

  test("handles templates without a stylesheet attribute", async () => {
    const outDir = join(tempDir, "dist");

    await mkdir(outDir, { recursive: true });
    await writeFile(
      join(outDir, "index.html"),
      '<template data-astro-og-seo-image data-pathname="/"><div>No styles</div></template>',
    );

    const logger = await runBuildDone(outDir);
    const html = await readFile(join(outDir, "index.html"), "utf8");

    expect(logger.info).toHaveBeenCalledWith("generated 1 Open Graph image");
    expect(html).toBe("");
    await assertImage(await readFile(join(outDir, "social", "index.png")), {
      format: "png",
      width: 600,
      height: 315,
    });
  });

  test("does not create output directories when no templates are present", async () => {
    const outDir = join(tempDir, "dist");

    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "index.html"), "<html>No templates</html>");
    await runBuildDone(outDir);

    await expect(stat(join(outDir, "social"))).rejects.toThrow();
  });
});
