import type { ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { chromium, type Browser } from "playwright";
import { assertImage } from "../helpers/image";
import { startExampleDevServer, stopProcess, waitForUrl } from "../helpers/playwright";

const port = 4338;
const baseUrl = `http://127.0.0.1:${port}`;

let server: ChildProcess | undefined;
let browser: Browser | undefined;

beforeAll(async () => {
  server = startExampleDevServer(port);
  await waitForUrl(baseUrl);
  browser = await chromium.launch({ headless: true });
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await stopProcess(server);
}, 30_000);

describe("Astro dev toolbar", () => {
  test("serves the SEO page metadata and toolbar preview image flow", async () => {
    const page = await browser!.newPage({ viewport: { width: 1280, height: 800 } });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await expect(page.locator('meta[property="og:title"]').getAttribute("content")).resolves.toBe(
      "Astro OG SEO Example",
    );
    await expect(page.locator('meta[name="twitter:card"]').getAttribute("content")).resolves.toBe(
      "summary_large_image",
    );

    const payload = await page.evaluate(() => {
      const template = document.head.querySelector<HTMLTemplateElement>(
        "template[data-astro-og-seo-image]",
      );

      return template?.dataset.astroOgSeoImage
        ? JSON.parse(atob(template.dataset.astroOgSeoImage))
        : null;
    });

    expect(payload).toEqual({
      html: expect.stringContaining("Astro OG SEO"),
      pathname: "/",
      stylesheet: expect.any(String),
    });

    const response = await page.request.post(`${baseUrl}/__astro-og-seo/preview`, {
      data: payload,
    });
    const image = await response.body();

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    await assertImage(image, { format: "png", width: 1200, height: 630, minBytes: 1_000 });
    await page.close();
  });
});
