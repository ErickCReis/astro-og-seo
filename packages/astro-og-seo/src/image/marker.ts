const markerPattern = /<template data-astro-og-seo-image="([A-Za-z0-9+/=]+)"><\/template>/g;

export type ImageMarkerPayload = {
  pathname: string;
  html: string;
  stylesheet: string;
};

export function encodeImageMarker(payload: ImageMarkerPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function decodeImageMarker(value: string): ImageMarkerPayload {
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    throw new Error("astro-og-seo: invalid generated image marker");
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as ImageMarkerPayload).pathname !== "string" ||
    typeof (payload as ImageMarkerPayload).html !== "string" ||
    !(payload as ImageMarkerPayload).html.trim() ||
    typeof (payload as ImageMarkerPayload).stylesheet !== "string"
  ) {
    throw new Error("astro-og-seo: invalid generated image marker payload");
  }
  return payload as ImageMarkerPayload;
}

export function readImageMarkers(html: string) {
  return [...html.matchAll(markerPattern)].map((match) => ({
    source: match[0],
    payload: decodeImageMarker(match[1] ?? ""),
  }));
}
