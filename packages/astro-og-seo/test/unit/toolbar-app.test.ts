import { describe, expect, test } from "vite-plus/test";
import { auditSeoSnapshot } from "../../src/toolbar/audit";

describe("SEO audit", () => {
  test("passes a complete page", () => {
    const result = auditSeoSnapshot({
      lang: "en",
      fields: {
        title: ["A useful title"],
        description: ["Description"],
        canonical: ["https://example.test/"],
        "og:title": ["Title"],
        "og:description": ["Description"],
        "og:url": ["https://example.test/"],
        "og:type": ["website"],
        "og:image": ["https://example.test/image.png"],
        "twitter:card": ["summary_large_image"],
        hreflang: ["en", "x-default"],
      },
    });
    expect(result.filter((item) => item.severity === "error")).toHaveLength(0);
  });
  test("reports missing, duplicate, invalid, and conflicting metadata", () => {
    const result = auditSeoSnapshot({
      lang: null,
      fields: {
        title: ["One", "Two"],
        canonical: ["relative"],
        "twitter:card": ["summary_large_image"],
        hreflang: ["x-default", "x-default"],
      },
    });
    expect(result.map((item) => item.message).join(" ")).toContain("appears 2 times");
    expect(result.map((item) => item.message).join(" ")).toContain("absolute HTTP(S)");
    expect(result.map((item) => item.message).join(" ")).toContain("requires an image");
  });
});
