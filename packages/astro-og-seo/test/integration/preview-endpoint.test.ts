import { describe, expect, test } from "vite-plus/test";
import { handlePreviewRequest } from "../../src/preview";
import type { ResolvedAstroOgSeoOptions } from "../../src/types";
import { assertImage, expectImageToMatchSnapshot } from "../helpers/image";
import { createRequest, createResponse } from "../helpers/node-http";

const resolvedOptions = {
  siteName: "Site",
  outDir: "/tmp/dist",
  outputDir: "_og",
  image: {
    width: 600,
    height: 315,
    format: "png",
  },
} satisfies Omit<ResolvedAstroOgSeoOptions, "stylesheet">;

async function callPreview(
  method: string,
  body: string,
  options: Omit<ResolvedAstroOgSeoOptions, "stylesheet"> | null = resolvedOptions,
) {
  const request = createRequest(method, body);
  const { response, endPromise } = createResponse();

  await handlePreviewRequest(request as never, response as never, options);

  return endPromise;
}

describe("preview endpoint", () => {
  test("rejects non-POST methods", async () => {
    const response = await callPreview("GET", "");

    expect(response.statusCode).toBe(405);
    expect(response.body.toString()).toBe("Method not allowed");
  });

  test("rejects missing config", async () => {
    const response = await callPreview("POST", "{}", null);

    expect(response.statusCode).toBe(500);
    expect(response.body.toString()).toBe("astro-og-seo is not configured");
  });

  test("rejects missing HTML", async () => {
    const response = await callPreview("POST", "{}");

    expect(response.statusCode).toBe(400);
    expect(response.body.toString()).toBe("Missing OG image HTML");
  });

  test("reports malformed JSON", async () => {
    const response = await callPreview("POST", "{");

    expect(response.statusCode).toBe(500);
    expect(response.body.toString()).toContain("Expected");
  });

  test("renders image previews", async () => {
    const stylesheet = Buffer.from(
      ".card{width:600px;height:315px;background:#7c3aed;color:white;display:flex;align-items:center;justify-content:center;font:700 44px Arial;}",
    ).toString("base64");
    const response = await callPreview(
      "POST",
      JSON.stringify({
        html: '<div class="card">Preview</div>',
        stylesheet,
      }),
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    await assertImage(response.body, { format: "png", width: 600, height: 315 });
    await expectImageToMatchSnapshot(response.body, "preview-endpoint-png");
  });

  test("ignores non-string stylesheets", async () => {
    const response = await callPreview(
      "POST",
      JSON.stringify({
        html: "<div>Preview</div>",
        stylesheet: 123,
      }),
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    await assertImage(response.body, { format: "png", width: 600, height: 315 });
  });
});
