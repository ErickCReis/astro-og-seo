import { describe, expect, test } from "vite-plus/test";
import { GET } from "../../src/image/endpoint";
import { cacheServerOgImage } from "../../src/image/server";

describe("server image endpoint", () => {
  test.each([
    ["png", "image/png"],
    ["jpeg", "image/jpeg"],
    ["webp", "image/webp"],
  ] as const)("serves cached %s images", async (format, contentType) => {
    const pathname = `/_og/ssr-${format}/index.${format}`;
    const image = Uint8Array.from([1, 2, 3]);
    cacheServerOgImage(pathname, image);

    const response = await GET({ url: new URL(`https://example.test${pathname}`) } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(contentType);
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(image);
  });

  test("returns not found when an image has not been rendered by SSR", async () => {
    const response = await GET({
      url: new URL("https://example.test/_og/missing/index.png"),
    } as never);

    expect(response.status).toBe(404);
  });
});
