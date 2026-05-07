import sharp from "sharp";
import { vi } from "vite-plus/test";

function getFill(html: string) {
  if (html.includes("Preview")) {
    return "#7c3aed";
  }

  if (html.includes("Build")) {
    return "#be123c";
  }

  if (html.includes("Fixture")) {
    return "#1d4ed8";
  }

  if (html.includes("OG Image")) {
    return "#0f766e";
  }

  return "#334155";
}

vi.mock("takumi-js", () => ({
  async render(
    html: string,
    options: {
      width: number;
      height: number;
      format: "png" | "jpeg" | "webp";
    },
  ) {
    const svg = `
      <svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${getFill(html)}"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="Arial" font-weight="700">OG</text>
      </svg>
    `;

    return sharp(Buffer.from(svg))[options.format]().toBuffer();
  },
}));
