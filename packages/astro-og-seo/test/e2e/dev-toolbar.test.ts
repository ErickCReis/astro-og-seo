import type { ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { startExampleDevServer, stopProcess, waitForUrl } from "../helpers/playwright";

const port = 4328;
const baseUrl = `http://127.0.0.1:${port}`;

let server: ChildProcess | undefined;
let browser: Browser | undefined;

async function clickSeoToolbarApp(page: Page) {
  await page.waitForFunction(
    () => {
      const toolbar = document.querySelector("astro-dev-toolbar") as
        | (HTMLElement & {
            getAppById?: (id: string) => { status?: string } | undefined;
          })
        | null;

      return toolbar?.getAppById?.("astro-og-seo")?.status === "ready";
    },
    undefined,
    { timeout: 15_000 },
  );
  const clicked = await page.evaluate(() => {
    const toolbar = document.querySelector("astro-dev-toolbar") as
      | (HTMLElement & {
          setToolbarVisible?: (visible: boolean) => void;
          shadowRoot: ShadowRoot;
        })
      | null;
    const button = toolbar?.shadowRoot.querySelector<HTMLElement>('[data-app-id="astro-og-seo"]');

    if (!toolbar || !button) {
      return false;
    }

    toolbar.setToolbarVisible?.(true);
    button.click();

    return true;
  });

  expect(clicked).toBe(true);
}

async function waitForPreviewImage(page: Page) {
  await page.waitForFunction(
    () => {
      function visit(root: Document | ShadowRoot | Element): boolean {
        if (root.querySelector('img[alt="Open Graph image preview"]')) {
          return true;
        }

        for (const element of root.querySelectorAll("*")) {
          if (element.shadowRoot && visit(element.shadowRoot)) {
            return true;
          }
        }

        return false;
      }

      return visit(document);
    },
    undefined,
    { timeout: 15_000 },
  );
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

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await expect(page.locator('meta[property="og:title"]').getAttribute("content")).resolves.toBe(
      "Astro OG SEO Example",
    );

    await clickSeoToolbarApp(page);
    await waitForPreviewImage(page);

    const text = await readToolbarWindowText(page);
    const screenshot = await screenshotToolbarWindow(page);

    expect(text).toContain("Astro OG SEO");
    expect(text).toContain("Title");
    expect(text).toContain("Description");
    expect(text).toContain("OG image");
    expect(text).toContain("Twitter card");

    expect(screenshot.byteLength).toBeGreaterThan(1_000);
    await page.close();
  });
});
