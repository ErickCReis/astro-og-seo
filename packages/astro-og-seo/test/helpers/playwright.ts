import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";

export function getVpBin() {
  return process.env.VP_BIN ?? process.env.VP ?? "vp";
}

export async function waitForUrl(url: string, timeoutMs = 60_000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`Timed out waiting for ${url}`);
}

export async function stopProcess(process: ChildProcess | undefined) {
  if (!process || process.exitCode !== null) {
    return;
  }

  process.kill("SIGTERM");
  await Promise.race([once(process, "exit"), new Promise((resolve) => setTimeout(resolve, 5_000))]);

  if (process.exitCode === null) {
    process.kill("SIGKILL");
  }
}

export function startExampleDevServer(port: number) {
  return spawn(
    getVpBin(),
    ["exec", "astro", "dev", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: new URL("../../../../apps/example/", import.meta.url),
      env: {
        ...process.env,
        ASTRO_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}
