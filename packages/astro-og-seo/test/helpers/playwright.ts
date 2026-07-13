import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

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

export async function stopProcess(child: ChildProcess | undefined) {
  if (!child || child.exitCode !== null) {
    return;
  }

  if (child.pid) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  } else {
    child.kill("SIGTERM");
  }

  await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 5_000))]);

  if (child.exitCode === null) {
    if (child.pid) {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    } else {
      child.kill("SIGKILL");
    }
  }
}

export function startExampleDevServer(port: number) {
  return spawn(
    fileURLToPath(new URL("../../../../apps/example/node_modules/.bin/astro", import.meta.url)),
    ["dev", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: new URL("../../../../apps/example/", import.meta.url),
      env: {
        ASTRO_TELEMETRY_DISABLED: "1",
        HOME: process.env.HOME,
        NODE_ENV: "development",
        PATH: process.env.PATH,
        TMPDIR: process.env.TMPDIR,
      },
      detached: true,
      stdio: "inherit",
    },
  );
}
