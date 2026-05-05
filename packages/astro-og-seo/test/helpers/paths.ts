import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function createTempDir(name: string) {
  return mkdtemp(join(tmpdir(), `astro-og-seo-${name}-`));
}

export async function removeTempDir(dir: string) {
  await rm(dir, { force: true, recursive: true });
}

export function fixturePath(...segments: string[]) {
  return new URL(`../fixtures/${segments.join("/")}`, import.meta.url);
}
