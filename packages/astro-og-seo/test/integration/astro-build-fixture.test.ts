import { spawn } from "node:child_process";
import { readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import { assertImage, expectImageToMatchSnapshot } from "../helpers/image";
import { getVpBin } from "../helpers/playwright";

const fixtureUrl = new URL("../fixtures/astro-app/", import.meta.url);
const distDir = join(fixtureUrl.pathname, "dist");

async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

beforeEach(async () => {
  await rm(distDir, { force: true, recursive: true });
});

afterEach(async () => {
  await rm(distDir, { force: true, recursive: true });
});

describe("Astro fixture build", () => {
  test("renders SEO tags and generated OG images", async () => {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(getVpBin(), ["exec", "astro", "build", "--root", fixtureUrl.pathname], {
        cwd: new URL("../../", import.meta.url),
        env: {
          ...process.env,
          ASTRO_TELEMETRY_DISABLED: "1",
        },
        stdio: "pipe",
      });
      let output = "";

      child.stdout.on("data", (chunk) => {
        output += chunk;
      });
      child.stderr.on("data", (chunk) => {
        output += chunk;
      });
      child.on("error", reject);
      child.on("exit", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(output));
      });
    });

    const homeHtml = await readFile(join(distDir, "index.html"), "utf8");
    const articleHtml = await readFile(join(distDir, "blog", "hello-world", "index.html"), "utf8");
    const noImageHtml = await readFile(join(distDir, "no-image", "index.html"), "utf8");
    const homeImage = await readFile(join(distDir, "social", "index.png"));

    expect(homeHtml).toContain("<title>Fixture Home</title>");
    expect(homeHtml).toContain('property="og:image"');
    expect(homeHtml).toContain("https://example.test/social/index.png");
    expect(homeHtml).not.toContain("data-astro-og-seo-image");

    expect(articleHtml).toContain('property="article:published_time"');
    expect(articleHtml).toContain("https://example.test/articles/hello-world/");
    expect(articleHtml).toContain("https://example.test/social/blog/hello-world/index.png");

    expect(noImageHtml).not.toContain('property="og:image"');
    expect(noImageHtml).not.toContain("data-astro-og-seo-image");
    expect(await exists(join(distDir, "social", "no-image", "index.png"))).toBe(false);

    await assertImage(homeImage, { format: "png", width: 600, height: 315 });
    await expectImageToMatchSnapshot(homeImage, "astro-build-fixture-home");
  });
});
