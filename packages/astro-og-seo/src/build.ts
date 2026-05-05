import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { writeOgImage } from "./runtime";
import type { ResolvedAstroOgSeoOptions } from "./types";

export const IMAGE_TEMPLATE_PATTERN =
  /<template data-astro-og-seo-image data-pathname="([^"]*)"(?: data-stylesheet(?:="([^"]*)")?)?>([\s\S]*?)<\/template>/g;

export type ExtractedImageTemplate = {
  pathname: string;
  stylesheet: string;
  html: string;
};

export async function collectHtmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(path)));
    } else if (entry.isFile() && path.endsWith(".html")) {
      files.push(path);
    }
  }

  return files;
}

export function extractImageTemplates(html: string): ExtractedImageTemplate[] {
  return [...html.matchAll(IMAGE_TEMPLATE_PATTERN)].map((match) => {
    const [, pathname = "/", encodedStylesheet = "", imageHtml = ""] = match;

    return {
      pathname,
      stylesheet: Buffer.from(encodedStylesheet, "base64").toString("utf8"),
      html: imageHtml,
    };
  });
}

export function removeImageTemplates(html: string) {
  return html.replace(IMAGE_TEMPLATE_PATTERN, "");
}

export async function generateOgImagesFromHtmlDir(
  dir: string,
  resolvedOptions: Omit<ResolvedAstroOgSeoOptions, "stylesheet">,
  writeImage = writeOgImage,
) {
  const htmlFiles = await collectHtmlFiles(dir);
  let generatedCount = 0;

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const templates = extractImageTemplates(html);

    if (templates.length === 0) {
      continue;
    }

    for (const template of templates) {
      await writeImage(template.html, template.pathname, {
        ...resolvedOptions,
        stylesheet: template.stylesheet,
      });
      generatedCount += 1;
    }

    await writeFile(file, removeImageTemplates(html));
  }

  return generatedCount;
}
