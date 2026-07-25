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
    const messages = result.map((item) => item.message).join(" ");

    expect(messages).toContain("Keep exactly one Title entry; found 2.");
    expect(messages).toContain("Use an absolute canonical URL starting with http:// or https://.");
    expect(messages).toContain('twitter:card is "summary_large_image", but no og:image is set.');
    expect(messages).toContain("Set a lang attribute on <html>");
  });
  test("gives actionable guidance for missing metadata and indexing choices", () => {
    const result = auditSeoSnapshot({
      lang: "en-US",
      fields: {
        description: ["A useful description"],
        canonical: ["https://example.test/"],
        "og:title": ["Title"],
        "og:description": ["Description"],
        "og:url": ["https://example.test/"],
        "og:type": ["website"],
        "twitter:card": ["summary"],
        robots: ["noindex,follow"],
      },
    });
    const messages = result.map((item) => item.message).join(" ");

    expect(messages).toContain(
      "Add one unique <title>; it names the page in search results and browser tabs.",
    );
    expect(messages).toContain(
      "No og:image is set. Add a social image if this page should have a custom preview when shared.",
    );
    expect(messages).toContain(
      "This page sends noindex to search engines. Remove noindex from robots if the page should appear in search results.",
    );
  });
  test("explains length, alternate-language, and article-date fixes", () => {
    const result = auditSeoSnapshot({
      lang: "en-US",
      fields: {
        title: ["A".repeat(61)],
        description: ["D".repeat(161)],
        canonical: ["https://example.test/"],
        "og:title": ["Title"],
        "og:description": ["Description"],
        "og:url": ["https://example.test/"],
        "og:type": ["article"],
        "twitter:card": ["summary"],
        hreflang: ["en", "en", "x-default", "x-default"],
        "article:published_time": ["not-a-date"],
        "article:modified_time": ["also-not-a-date"],
      },
    });
    const messages = result.map((item) => item.message).join(" ");

    expect(messages).toContain("Shorten the title from 61 characters to 60 or fewer");
    expect(messages).toContain("Shorten the description from 161 characters to 160 or fewer");
    expect(messages).toContain("Remove duplicate hreflang entries; each locale should appear once");
    expect(messages).toContain('Keep exactly one hreflang="x-default" entry');
    expect(messages).toContain("Replace article:published_time with a valid date");
    expect(messages).toContain("Replace article:modified_time with a valid date");
  });
});
