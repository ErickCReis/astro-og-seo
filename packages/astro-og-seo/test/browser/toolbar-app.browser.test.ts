import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser/context";
import toolbarApp from "../../src/toolbar-app";

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("toolbar app browser rendering", () => {
  test("renders the toolbar window, SEO fields, and preview image", async () => {
    document.title = "Browser Page";
    document.head.innerHTML = `
      <meta name="description" content="Browser description">
      <link rel="canonical" href="https://example.test/browser/">
      <meta property="og:title" content="Browser OG title">
      <meta property="og:description" content="Browser OG description">
      <meta property="og:url" content="https://example.test/browser/">
      <meta property="og:image" content="https://example.test/_og/browser/index.png">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:image" content="https://example.test/_og/browser/index.png">
      <template data-astro-og-seo-image="${btoa(JSON.stringify({ pathname: "/browser/", html: '<div class="card">Browser</div>', stylesheet: ".card{}" }))}"></template>
    `;
    const host = document.body.appendChild(document.createElement("div"));
    const canvas = host.attachShadow({ mode: "open" });
    const imageBlob = new Blob(["image"], { type: "image/png" });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(imageBlob, { status: 200 })),
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("data:image/png;base64,aW1hZ2U=");

    await (toolbarApp.init as unknown as (canvas: ShadowRoot, app: unknown) => Promise<void>)(
      canvas,
      {
        onToggled(callback: ({ state }: { state: boolean }) => void) {
          callback({ state: true });
        },
      },
    );

    await vi.waitFor(() => {
      expect(canvas.textContent).toContain("SEO inspector");
      expect(canvas.textContent).toContain("Open Graph title is set");
    });

    const window = canvas.querySelector("astro-dev-toolbar-window");

    expect(window).toBeTruthy();

    const inspector = canvas.querySelector<HTMLElement>(".inspector")!;
    expect(inspector.scrollWidth).toBeLessThanOrEqual(inspector.clientWidth);

    await vi.waitFor(() => {
      expect(
        page.getByAltText("Generated Open Graph preview", { exact: true }).element(),
      ).toBeTruthy();
    });

    await page.screenshot({ path: "toolbar-app-page.png", save: true });
  });
});
