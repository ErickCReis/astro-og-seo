import { describe, expect, test, vi } from "vite-plus/test";
import { astroOgSeo } from "../../src/integration";
import { PREVIEW_ENDPOINT } from "../../src/preview";

describe("astroOgSeo integration hooks", () => {
  test("registers toolbar, virtual module, preview middleware, and types", async () => {
    const integration = astroOgSeo({ siteName: "Site", image: { stylesheet: "./src/og.css" } });
    const addDevToolbarApp = vi.fn();
    const updateConfig = vi.fn();
    const injectTypes = vi.fn();
    const use = vi.fn();
    const config = { outDir: new URL("file:///tmp/dist/"), site: new URL("https://example.test") };
    await integration.hooks["astro:config:setup"]?.({
      addDevToolbarApp,
      config,
      updateConfig,
    } as never);
    await integration.hooks["astro:config:done"]?.({
      buildOutput: "static",
      injectTypes,
      logger: { warn: vi.fn() },
    } as never);
    await integration.hooks["astro:server:setup"]?.({
      logger: { error: vi.fn() },
      server: { middlewares: { use } },
    } as never);
    expect(addDevToolbarApp).toHaveBeenCalledWith(
      expect.objectContaining({ id: "astro-og-seo", name: "SEO Inspector" }),
    );
    expect(updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        vite: expect.objectContaining({
          plugins: [expect.objectContaining({ name: "astro-og-seo:virtual-module" })],
        }),
      }),
    );
    expect(injectTypes).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "astro-og-seo.d.ts" }),
    );
    expect(use).toHaveBeenCalledWith(PREVIEW_ENDPOINT, expect.any(Function));
  });
  test("does not register a disabled toolbar", async () => {
    const integration = astroOgSeo({ siteName: "Site", toolbar: { enabled: false } });
    const addDevToolbarApp = vi.fn();
    await integration.hooks["astro:config:setup"]?.({
      addDevToolbarApp,
      config: { outDir: new URL("file:///tmp/dist/"), site: new URL("https://example.test") },
      updateConfig: vi.fn(),
    } as never);
    expect(addDevToolbarApp).not.toHaveBeenCalled();
  });
});
