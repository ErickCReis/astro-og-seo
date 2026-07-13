import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AstroIntegrationLogger } from "astro";
import type { ResolvedAstroOgSeoOptions } from "../seo/types";
import { readImageMarkers } from "./marker";
import { getOutputPath } from "./paths";
import { writeOgImage } from "./render";

async function collectHtmlFiles(dir: string) {
  const entries = await readdir(dir, { recursive: true });
  return entries.filter((entry) => entry.endsWith(".html")).map((entry) => join(dir, entry));
}

async function inBatches<T>(items: T[], size: number, task: (item: T) => Promise<void>) {
  for (let index = 0; index < items.length; index += size) {
    await Promise.all(items.slice(index, index + size).map(task));
  }
}

export async function generateBuildImages(
  dir: string,
  config: ResolvedAstroOgSeoOptions,
  logger: AstroIntegrationLogger,
) {
  if (config.image === false) return 0;
  const files = await collectHtmlFiles(dir);
  const jobs: Array<{
    file: string;
    source: string;
    pathname: string;
    html: string;
    stylesheet: string;
  }> = [];
  const destinations = new Map<string, string>();

  for (const file of files) {
    const html = await readFile(file, "utf8");
    for (const marker of readImageMarkers(html)) {
      const destination = getOutputPath(marker.payload.pathname, config);
      const previous = destinations.get(destination);
      if (previous) {
        throw new Error(
          `astro-og-seo: duplicate generated image destination for ${marker.payload.pathname} (${previous} and ${file})`,
        );
      }
      destinations.set(destination, file);
      jobs.push({ file, source: marker.source, ...marker.payload });
    }
  }

  await inBatches(jobs, 2, async (job) => {
    try {
      await writeOgImage(job.html, job.pathname, {
        ...config,
        image: config.image && { ...config.image, stylesheet: job.stylesheet },
      });
    } catch (error) {
      throw new Error(`astro-og-seo: failed to render image for ${job.pathname}`, { cause: error });
    }
  });

  const jobsByFile = Map.groupBy(jobs, (job) => job.file);
  await Promise.all(
    [...jobsByFile].map(async ([file, fileJobs]) => {
      let html = await readFile(file, "utf8");
      for (const job of fileJobs) html = html.replace(job.source, "");
      await writeFile(file, html);
    }),
  );

  logger.info(`generated ${jobs.length} Open Graph image${jobs.length === 1 ? "" : "s"}`);
  return jobs.length;
}
