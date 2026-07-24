import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { getVpBin } from "../helpers/playwright";

const execFileAsync = promisify(execFile);

export default async function buildPackage() {
  await execFileAsync(getVpBin(), ["pack"], {
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
  });
}
