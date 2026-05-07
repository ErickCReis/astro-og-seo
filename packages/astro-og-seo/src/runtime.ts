import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { render } from "takumi-js";
import type { ResolvedAstroOgSeoOptions } from "./types";

function getPathSegments(pathname: string) {
  return pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)));
}

export function getOgImagePathname(pathname: string, config: ResolvedAstroOgSeoOptions): string {
  const outputDir = config.outputDir.replace(/^\/+|\/+$/g, "");
  const segments = getPathSegments(pathname);
  const parts = [outputDir, ...segments, `index.${config.image.format}`].filter(Boolean);

  return `/${parts.join("/")}`;
}

function getOutputPath(pathname: string, config: ResolvedAstroOgSeoOptions) {
  const relativePathname = getOgImagePathname(pathname, config).replace(/^\/+/, "");
  return join(config.outDir, relativePathname);
}

function createImageHtml(html: string, config: ResolvedAstroOgSeoOptions) {
  const { width, height } = config.image;

  return `
    <div style="width: ${width}px; height: ${height}px; display: flex; overflow: hidden;">
      ${html}
    </div>
  `;
}

export function renderOgImage(html: string, config: ResolvedAstroOgSeoOptions) {
  return render(createImageHtml(html, config), {
    width: config.image.width,
    height: config.image.height,
    format: config.image.format,
    stylesheets: [config.stylesheet],
    loadDefaultFonts: true,
  });
}

export async function writeOgImage(
  html: string,
  pathname: string,
  config: ResolvedAstroOgSeoOptions,
) {
  const outputPath = getOutputPath(pathname, config);
  const image = await renderOgImage(html, config);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, image);
}
