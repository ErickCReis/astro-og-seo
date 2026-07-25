import type { APIRoute } from "astro";
import { getImageMimeType } from "./paths";
import { getServerOgImage } from "./server";

function getFormat(pathname: string) {
  if (pathname.endsWith(".jpeg")) return "jpeg" as const;
  if (pathname.endsWith(".webp")) return "webp" as const;
  if (pathname.endsWith(".png")) return "png" as const;
  return undefined;
}

export const GET: APIRoute = ({ url }) => {
  const image = getServerOgImage(url.pathname);
  const format = getFormat(url.pathname);

  if (!image || !format) return new Response("Not found", { status: 404 });

  return new Response(image, {
    headers: {
      "cache-control": "public, max-age=0, must-revalidate",
      "content-type": getImageMimeType(format),
    },
  });
};
