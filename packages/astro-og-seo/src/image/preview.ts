import type { IncomingMessage, ServerResponse } from "node:http";
import type { AstroIntegrationLogger } from "astro";
import type { ResolvedAstroOgSeoOptions } from "../seo/types";
import { getImageMimeType } from "./paths";
import { renderOgImage } from "./render";

export const PREVIEW_ENDPOINT = "/__astro-og-seo/preview";
const maxBodyBytes = 1024 * 1024;

function sendText(response: ServerResponse, statusCode: number, message: string) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(message);
}

async function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = "";
    let bytes = 0;
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > maxBodyBytes) {
        reject(Object.assign(new Error("Request too large"), { statusCode: 413 }));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function hasValidOrigin(request: IncomingMessage) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

export async function handlePreviewRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedAstroOgSeoOptions | null,
  logger?: AstroIntegrationLogger,
) {
  if (request.method !== "POST") return sendText(response, 405, "Method not allowed");
  if (!hasValidOrigin(request)) return sendText(response, 403, "Cross-origin preview denied");
  if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
    return sendText(response, 415, "Expected application/json");
  }
  if (!config || config.image === false)
    return sendText(response, 409, "Image previews are disabled");

  try {
    const payload = JSON.parse(await readRequestBody(request)) as {
      html?: unknown;
      stylesheet?: unknown;
    };
    if (typeof payload.html !== "string" || !payload.html.trim()) {
      return sendText(response, 400, "Missing OG image HTML");
    }
    if (payload.stylesheet !== undefined && typeof payload.stylesheet !== "string") {
      return sendText(response, 400, "Invalid OG image stylesheet");
    }
    const image = await renderOgImage(payload.html, {
      ...config,
      image: { ...config.image, stylesheet: payload.stylesheet ?? config.image.stylesheet },
    });
    response.statusCode = 200;
    response.setHeader("content-type", getImageMimeType(config.image.format));
    response.setHeader("cache-control", "no-store");
    response.end(image);
  } catch (error) {
    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number(error.statusCode)
        : error instanceof SyntaxError
          ? 400
          : 500;
    if (statusCode === 500) logger?.error(error instanceof Error ? error.message : String(error));
    sendText(
      response,
      statusCode,
      statusCode === 500 ? "Unable to render OG image" : "Invalid preview request",
    );
  }
}
