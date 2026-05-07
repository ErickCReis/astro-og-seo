import { describe, expect, test } from "vite-plus/test";
import { getOgImagePathname } from "../../src/runtime";
import { createResolvedConfig } from "../helpers/config";

const config = createResolvedConfig;

describe("getOgImagePathname", () => {
  test("creates a root image pathname", () => {
    expect(getOgImagePathname("/", config())).toBe("/_og/index.png");
  });

  test("creates nested image pathnames", () => {
    expect(getOgImagePathname("/blog/post/", config())).toBe("/_og/blog/post/index.png");
  });

  test("normalizes output directory slashes", () => {
    expect(getOgImagePathname("/", { ...config(), outputDir: "/social/" })).toBe(
      "/social/index.png",
    );
  });

  test("allows an empty output directory without double slashes", () => {
    expect(getOgImagePathname("/", { ...config(), outputDir: "" })).toBe("/index.png");
    expect(getOgImagePathname("/blog/", { ...config(), outputDir: "///" })).toBe("/blog/index.png");
  });

  test("encodes path segments consistently", () => {
    expect(getOgImagePathname("/docs/hello world/caf%C3%A9/", config())).toBe(
      "/_og/docs/hello%20world/caf%C3%A9/index.png",
    );
  });

  test("trims empty path segments", () => {
    expect(getOgImagePathname("///docs///post///", config())).toBe("/_og/docs/post/index.png");
  });

  test("uses the configured image format", () => {
    expect(getOgImagePathname("/post", config({ format: "jpeg" }))).toBe("/_og/post/index.jpeg");
    expect(getOgImagePathname("/post", config({ format: "webp" }))).toBe("/_og/post/index.webp");
  });

  test("handles an empty pathname", () => {
    expect(getOgImagePathname("", config())).toBe("/_og/index.png");
  });

  test("handles pathnames without leading slash", () => {
    expect(getOgImagePathname("about", config())).toBe("/_og/about/index.png");
  });
});
