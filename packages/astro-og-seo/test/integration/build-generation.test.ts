import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import {
  extractImageTemplates,
  generateOgImagesFromHtmlDir,
  removeImageTemplates,
} from "../../src/build";
import type { ResolvedAstroOgSeoOptions } from "../../src/types";
import { assertImage, expectImageToMatchSnapshot } from "../helpers/image";
import { createTempDir, removeTempDir } from "../helpers/paths";

let tempDir: string;

const resolvedOptions = {
  siteName: "Site",
  outDir: "",
  outputDir: "social",
  image: {
    width: 600,
    height: 315,
    format: "png",
  },
} satisfies Omit<ResolvedAstroOgSeoOptions, "stylesheet">;

beforeEach(async () => {
  tempDir = await createTempDir("build");
});

afterEach(async () => {
  await removeTempDir(tempDir);
});

describe("build image generation", () => {
  test("extracts and removes image templates", () => {
    const stylesheet = Buffer.from(".card{}").toString("base64");
    const html = `<html><head><template data-astro-og-seo-image data-pathname="/blog/post/" data-stylesheet="${stylesheet}"><div>Image</div></template></head></html>`;

    expect(extractImageTemplates(html)).toEqual([
      {
        pathname: "/blog/post/",
        stylesheet: ".card{}",
        html: "<div>Image</div>",
      },
    ]);
    expect(removeImageTemplates(html)).not.toContain("data-astro-og-seo-image");
  });

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

    const count = await generateOgImagesFromHtmlDir(outDir, {
      ...resolvedOptions,
      outDir,
    });
    const html = await readFile(join(htmlDir, "index.html"), "utf8");
    const image = await readFile(join(outDir, "social", "blog", "post", "index.png"));

    expect(count).toBe(1);
    expect(html).not.toContain("data-astro-og-seo-image");
    await assertImage(image, { format: "png", width: 600, height: 315 });
    await expectImageToMatchSnapshot(image, "build-generation-png");
  });

  test("leaves directories without templates unchanged", async () => {
    const outDir = join(tempDir, "dist");
    const htmlPath = join(outDir, "plain", "index.html");

    await mkdir(join(outDir, "plain"), { recursive: true });
    await writeFile(htmlPath, "<html><head></head><body>Plain</body></html>");

    const count = await generateOgImagesFromHtmlDir(outDir, {
      ...resolvedOptions,
      outDir,
    });

    expect(count).toBe(0);
    expect(await readFile(htmlPath, "utf8")).toBe("<html><head></head><body>Plain</body></html>");
  });

  test("supports multiple templates in one HTML file with an injected writer", async () => {
    const outDir = join(tempDir, "dist");
    const htmlPath = join(outDir, "index.html");
    const stylesheet = Buffer.from(".one{}").toString("base64");
    const writes: Array<{ html: string; pathname: string; stylesheet: string }> = [];

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

    const count = await generateOgImagesFromHtmlDir(
      outDir,
      {
        ...resolvedOptions,
        outDir,
      },
      async (html, pathname, config) => {
        writes.push({ html, pathname, stylesheet: config.stylesheet });
      },
    );
    const html = await readFile(htmlPath, "utf8");

    expect(count).toBe(2);
    expect(writes).toEqual([
      { html: "<div>One</div>", pathname: "/", stylesheet: ".one{}" },
      { html: "<div>Two</div>", pathname: "/two/", stylesheet: "" },
    ]);
    expect(html).toBe("");
  });

  test("does not create output directories when no templates are present", async () => {
    const outDir = join(tempDir, "dist");

    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "index.html"), "<html>No templates</html>");
    await generateOgImagesFromHtmlDir(outDir, {
      ...resolvedOptions,
      outDir,
    });

    await expect(stat(join(outDir, "social"))).rejects.toThrow();
  });
});
