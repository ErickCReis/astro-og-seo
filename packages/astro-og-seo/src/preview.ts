import type { IncomingMessage, ServerResponse } from "node:http";
import { renderOgImage } from "./runtime";
import type { ResolvedAstroOgSeoOptions } from "./types";

export const PREVIEW_ENDPOINT = "/__astro-og-seo/preview";

export function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

export function sendText(response: ServerResponse, statusCode: number, message: string) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.end(message);
}

export async function handlePreviewRequest(
  request: IncomingMessage,
  response: ServerResponse,
  resolvedOptions: Omit<ResolvedAstroOgSeoOptions, "stylesheet"> | null,
) {
  if (request.method !== "POST") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  if (!resolvedOptions) {
    sendText(response, 500, "astro-og-seo is not configured");
    return;
  }

  try {
    const payload = JSON.parse(await readRequestBody(request)) as {
      html?: unknown;
      stylesheet?: unknown;
    };

    if (typeof payload.html !== "string") {
      sendText(response, 400, "Missing OG image HTML");
      return;
    }

    const stylesheet =
      typeof payload.stylesheet === "string"
        ? Buffer.from(payload.stylesheet, "base64").toString("utf8")
        : "";
    const config = {
      ...resolvedOptions,
      stylesheet,
    };
    const image = await renderOgImage(payload.html, config);

    response.statusCode = 200;
    response.setHeader("content-type", `image/${config.image.format}`);
    response.end(image);
  } catch (error) {
    sendText(response, 500, error instanceof Error ? error.message : "Unable to render OG image");
  }
}
