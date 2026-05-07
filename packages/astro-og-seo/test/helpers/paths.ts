import { mkdtemp, rm, stat } from "node:fs/promises";
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

export async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
