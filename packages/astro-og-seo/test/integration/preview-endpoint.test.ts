import { describe, expect, test } from "vite-plus/test";
import { handlePreviewRequest } from "../../src/preview";
import { assertImage, expectImageToMatchSnapshot } from "../helpers/image";
import { createResolvedConfig } from "../helpers/config";
import { createRequest, createResponse } from "../helpers/node-http";

async function callPreview(
  method: string,
  body: string,
  options = createResolvedConfig({ image: { width: 600, height: 315 } }),
  headers: Record<string, string> = {},
) {
  const request = createRequest(method, body) as never;
  Object.assign((request as { headers: Record<string, string> }).headers, {
    "content-type": "application/json",
    host: "example.test",
    ...headers,
  });
  const { response, endPromise } = createResponse();
  await handlePreviewRequest(request, response as never, options);
  return endPromise;
}

describe("preview endpoint", () => {
  test("rejects non-POST methods", async () => {
    expect((await callPreview("GET", "")).statusCode).toBe(405);
  });
  test("rejects unsupported content types", async () => {
    expect(
      (await callPreview("POST", "{}", createResolvedConfig(), { "content-type": "text/plain" }))
        .statusCode,
    ).toBe(415);
  });
  test("rejects cross-origin requests", async () => {
    expect(
      (await callPreview("POST", "{}", createResolvedConfig(), { origin: "https://other.test" }))
        .statusCode,
    ).toBe(403);
  });
  test("rejects missing HTML", async () => {
    expect((await callPreview("POST", "{}")).statusCode).toBe(400);
  });
  test("reports malformed JSON as a client error", async () => {
    expect((await callPreview("POST", "{")).statusCode).toBe(400);
  });
  test("renders image previews", async () => {
    const response = await callPreview(
      "POST",
      JSON.stringify({ html: '<div class="card">Preview</div>' }),
    );
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    await assertImage(response.body, { format: "png", width: 600, height: 315 });
    await expectImageToMatchSnapshot(response.body, "preview-endpoint-png");
  });
});
