import type { ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { assertImage, expectImageToMatchSnapshot } from "../helpers/image";
import { startExampleDevServer, stopProcess, waitForUrl } from "../helpers/playwright";

const port = 4328;
const baseUrl = `http://127.0.0.1:${port}`;

let server: ChildProcess | undefined;
let browser: Browser | undefined;

async function clickSeoToolbarApp(page: Page) {
  await page.mouse.move(640, 700);
  await page.waitForTimeout(500);

  const clicked = await page.evaluate(() => {
    function visit(root: Document | ShadowRoot | Element): boolean {
      const elements = root.querySelectorAll("*");

      for (const element of elements) {
        const label = [
          element.textContent,
          element.getAttribute("aria-label"),
          element.getAttribute("title"),
          element.getAttribute("id"),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (
          label.includes("seo") ||
          label.includes("astro-og-seo") ||
          label.includes("open graph")
        ) {
          (element as HTMLElement).click();
          return true;
        }

        if (element.shadowRoot && visit(element.shadowRoot)) {
          return true;
        }
      }

      return false;
    }

    return visit(document);
  });

  expect(clicked).toBe(true);
}

async function readToolbarWindowText(page: Page) {
  return page.evaluate(() => {
    function visit(root: Document | ShadowRoot | Element): string | null {
      const window = root.querySelector("astro-dev-toolbar-window");

      if (window?.textContent) {
        return window.textContent;
      }

      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot) {
          const text = visit(element.shadowRoot);

          if (text) {
            return text;
          }
        }
      }

      return null;
    }

    return visit(document);
  });
}

async function screenshotToolbarWindow(page: Page) {
  const handle = await page.evaluateHandle(() => {
    function visit(root: Document | ShadowRoot | Element): Element | null {
      const window = root.querySelector("astro-dev-toolbar-window");

      if (window) {
        return window;
      }

      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot) {
          const found = visit(element.shadowRoot);

          if (found) {
            return found;
          }
        }
      }

      return null;
    }

    return visit(document);
  });
  const element = handle.asElement();

  if (!element) {
    throw new Error("Unable to find astro-dev-toolbar-window");
  }

  return element.screenshot({ animations: "disabled" });
}

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
  test("opens the SEO window and renders an OG preview", async () => {
    const page = await browser!.newPage({ viewport: { width: 1280, height: 800 } });
    const previewResponsePromise = page.waitForResponse(
      (response) => response.url().endsWith("/__astro-og-seo/preview") && response.status() === 200,
    );

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await expect(page.locator('meta[property="og:title"]').getAttribute("content")).resolves.toBe(
      "Astro OG SEO Example",
    );

    await clickSeoToolbarApp(page);

    const previewResponse = await previewResponsePromise;
    const previewImage = await previewResponse.body();
    const text = await readToolbarWindowText(page);
    const screenshot = await screenshotToolbarWindow(page);

    expect(previewResponse.headers()["content-type"]).toContain("image/png");
    await assertImage(previewImage, { format: "png", width: 1200, height: 630 });
    await expectImageToMatchSnapshot(previewImage, "dev-toolbar-preview-response");

    expect(text).toContain("Astro OG SEO");
    expect(text).toContain("Title");
    expect(text).toContain("Description");
    expect(text).toContain("OG image");
    expect(text).toContain("Twitter card");

    await expectImageToMatchSnapshot(screenshot, "dev-toolbar-window");
    await page.close();
  });
});
