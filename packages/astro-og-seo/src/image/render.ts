import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { render } from "takumi-js";
import type { ResolvedAstroOgSeoOptions } from "../seo/types";
import { getOutputPath } from "./paths";

export function renderOgImage(html: string, config: ResolvedAstroOgSeoOptions) {
  if (config.image === false) throw new Error("astro-og-seo: generated images are disabled");
  const { width, height, format, stylesheet } = config.image;
  return render(
    `<div style="width:${width}px;height:${height}px;display:flex;overflow:hidden">${html}</div>`,
    { width, height, format, stylesheets: [stylesheet], loadDefaultFonts: true },
  );
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
  return outputPath;
}
