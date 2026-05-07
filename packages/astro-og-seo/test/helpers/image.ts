import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import sharp from "sharp";
import { expect } from "vite-plus/test";
import { exists } from "./paths";

type AssertImageOptions = {
  format: "png" | "jpeg" | "webp";
  width: number;
  height: number;
  minBytes?: number;
};

type ImageSnapshotOptions = {
  maxDiffRatio?: number;
};

const snapshotDir = new URL("../snapshots/images/", import.meta.url);
const artifactDir = new URL("../.artifacts/image-diffs/", import.meta.url);
const defaultMaxDiffRatio = 0.01;

async function normalizePng(buffer: Buffer) {
  return sharp(buffer).png().toBuffer();
}

export async function assertImage(buffer: Buffer, options: AssertImageOptions) {
  expect(buffer.byteLength).toBeGreaterThanOrEqual(options.minBytes ?? 100);

  const metadata = await sharp(buffer).metadata();

  expect(metadata.format).toBe(options.format);
  expect(metadata.width).toBe(options.width);
  expect(metadata.height).toBe(options.height);
}

export async function expectImageToMatchSnapshot(
  buffer: Buffer,
  name: string,
  options: ImageSnapshotOptions = {},
) {
  const actualBuffer = await normalizePng(buffer);
  const snapshotPath = join(snapshotDir.pathname, `${name}.png`);

  await mkdir(dirname(snapshotPath), { recursive: true });

  if (process.env.UPDATE_IMAGE_SNAPSHOTS === "1" || !(await exists(snapshotPath))) {
    await writeFile(snapshotPath, actualBuffer);
    expect(actualBuffer.byteLength).toBeGreaterThan(100);
    return;
  }

  const expectedBuffer = await readFile(snapshotPath);
  const actual = PNG.sync.read(actualBuffer);
  const expected = PNG.sync.read(expectedBuffer);

  expect(actual.width).toBe(expected.width);
  expect(actual.height).toBe(expected.height);

  const diff = new PNG({ width: actual.width, height: actual.height });
  const mismatchedPixels = pixelmatch(
    actual.data,
    expected.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold: 0.1 },
  );
  const diffRatio = mismatchedPixels / (actual.width * actual.height);
  const maxDiffRatio = options.maxDiffRatio ?? defaultMaxDiffRatio;

  if (diffRatio > maxDiffRatio) {
    const artifactBase = join(artifactDir.pathname, name);
    await mkdir(dirname(artifactBase), { recursive: true });
    await writeFile(`${artifactBase}.actual.png`, actualBuffer);
    await writeFile(`${artifactBase}.expected.png`, expectedBuffer);
    await writeFile(`${artifactBase}.diff.png`, PNG.sync.write(diff));
  }

  expect(diffRatio).toBeLessThanOrEqual(maxDiffRatio);
}
