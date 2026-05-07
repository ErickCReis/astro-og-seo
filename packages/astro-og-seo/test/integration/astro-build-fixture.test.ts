import { spawn } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { assertImage, expectImageToMatchSnapshot } from "../helpers/image";
import { exists } from "../helpers/paths";
import { getVpBin } from "../helpers/playwright";

const fixtureUrl = new URL("../fixtures/astro-app/", import.meta.url);
const distDir = join(fixtureUrl.pathname, "dist");

async function buildFixture() {
  return new Promise<void>((resolve, reject) => {
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
}

describe("Astro fixture build", () => {
  beforeAll(async () => {
    await rm(distDir, { force: true, recursive: true });
    await buildFixture();
  }, 120_000);

  afterAll(async () => {
    await rm(distDir, { force: true, recursive: true });
  });

  test("renders home page SEO meta tags and strips template", async () => {
    const html = await readFile(join(distDir, "index.html"), "utf8");

    expect(html).toContain("<title>Fixture Home</title>");
    expect(html).toContain('property="og:image"');
    expect(html).toContain("https://example.test/social/index.png");
    expect(html).not.toContain("data-astro-og-seo-image");
  });

  test("renders article page SEO meta tags", async () => {
    const html = await readFile(join(distDir, "blog", "hello-world", "index.html"), "utf8");

    expect(html).toContain('property="article:published_time"');
    expect(html).toContain("https://example.test/articles/hello-world/");
    expect(html).toContain("https://example.test/social/blog/hello-world/index.png");
  });

  test("omits OG image tags for pages without the image slot", async () => {
    const html = await readFile(join(distDir, "no-image", "index.html"), "utf8");

    expect(html).not.toContain('property="og:image"');
    expect(html).not.toContain("data-astro-og-seo-image");
    expect(await exists(join(distDir, "social", "no-image", "index.png"))).toBe(false);
  });

  test("generates a valid OG image matching the snapshot", async () => {
    const image = await readFile(join(distDir, "social", "index.png"));

    await assertImage(image, { format: "png", width: 600, height: 315 });
    await expectImageToMatchSnapshot(image, "astro-build-fixture-home");
  });
});
