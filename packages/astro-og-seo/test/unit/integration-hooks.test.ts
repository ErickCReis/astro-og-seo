import { describe, expect, test, vi } from "vite-plus/test";
import { astroOgSeo } from "../../src/integration";
import { PREVIEW_ENDPOINT } from "../../src/preview";

describe("astroOgSeo integration hooks", () => {
  test("registers toolbar app, virtual module plugin, preview middleware, and types", async () => {
    const integration = astroOgSeo({ siteName: "Site", stylesheet: "./src/og.css" });
    const addDevToolbarApp = vi.fn();
    const updateConfig = vi.fn();
    const injectTypes = vi.fn();
    const use = vi.fn();

    await integration.hooks["astro:config:setup"]?.({
      addDevToolbarApp,
      config: { outDir: new URL("file:///tmp/dist/") },
      updateConfig,
    } as never);
    await integration.hooks["astro:config:done"]?.({ injectTypes } as never);
    await integration.hooks["astro:server:setup"]?.({
      server: { middlewares: { use } },
    } as never);

    expect(integration.name).toBe("astro-og-seo");
    expect(addDevToolbarApp).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "astro-og-seo",
        name: "SEO",
      }),
    );
    expect(updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        vite: expect.objectContaining({
          plugins: [expect.objectContaining({ name: "astro-og-seo:virtual-module" })],
          resolve: expect.objectContaining({
            alias: expect.objectContaining({ "@takumi-rs/core": expect.any(String) }),
          }),
          ssr: expect.objectContaining({
            noExternal: expect.arrayContaining(["takumi-js", "@takumi-rs/core"]),
          }),
        }),
      }),
    );
    expect(injectTypes).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "astro-og-seo.d.ts",
      }),
    );
    expect(use).toHaveBeenCalledWith(PREVIEW_ENDPOINT, expect.any(Function));
  });

  test("build done no-ops before config setup", async () => {
    const integration = astroOgSeo({ siteName: "Site" });
    const logger = { info: vi.fn() };

    await integration.hooks["astro:build:done"]?.({
      dir: new URL("file:///tmp/dist/"),
      logger,
    } as never);

    expect(logger.info).not.toHaveBeenCalled();
  });
});
