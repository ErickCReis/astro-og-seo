import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { TestProjectConfiguration } from "vite-plus";
import solid from "vite-plugin-solid";

import { playwright } from "vite-plus/test/browser-playwright";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL(".", import.meta.url));
const nodeAliases = {
  "@takumi-rs/core": require.resolve("@takumi-rs/core"),
  "decode-named-character-reference": require.resolve("decode-named-character-reference"),
};

const projectBase = {
  root,
  resolve: {
    alias: nodeAliases,
    conditions: ["node", "import", "default"],
  },
  ssr: {
    noExternal: ["takumi-js", "@takumi-rs/core", "decode-named-character-reference"],
  },
};

export function createTestProjects({ buildE2e = false } = {}): TestProjectConfiguration[] {
  return [
    {
      ...projectBase,
      test: {
        name: "unit",
        environment: "node",
        include: ["test/unit/**/*.test.ts"],
      },
    },
    {
      ...projectBase,
      test: {
        name: "integration",
        environment: "node",
        include: ["test/integration/**/*.test.ts"],
        setupFiles: ["test/integration/setup.ts"],
        hookTimeout: 120_000,
        testTimeout: 120_000,
      },
    },
    {
      ...projectBase,
      plugins: [solid()],
      resolve: {
        alias: nodeAliases,
        conditions: ["browser", "import", "default"],
      },
      test: {
        name: "browser",
        include: ["test/browser/**/*.browser.test.ts"],
        browser: {
          enabled: true,
          provider: playwright(),
          headless: true,
          screenshotDirectory: "test/__screenshots__",
          instances: [{ browser: "chromium" }],
        },
      },
    },
    {
      ...projectBase,
      test: {
        name: "e2e",
        environment: "node",
        include: ["test/e2e/**/*.test.ts"],
        ...(buildE2e ? { globalSetup: ["test/e2e/setup.ts"] } : {}),
        hookTimeout: 120_000,
        testTimeout: 120_000,
      },
    },
  ];
}

export const testProjects = createTestProjects();

const config: Record<string, unknown> = {
  plugins: [solid()],
  resolve: {
    alias: nodeAliases,
    conditions: ["node", "import", "default"],
  },
  ssr: {
    noExternal: ["takumi-js", "@takumi-rs/core", "decode-named-character-reference"],
  },
  pack: {
    entry: ["src/index.ts", "src/toolbar-app.tsx"],
    copy: ["src/components"],
    plugins: [solid()],
    dts: {
      tsgo: true,
    },
    exports: {
      exclude: ["toolbar-app"],
      customExports: {
        "./OgSeo.astro": "./dist/components/OgSeo.astro",
      },
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  run: {
    tasks: {
      "test:e2e": {
        command: ["vp pack", "vp test run --project e2e"],
        cache: false,
      },
    },
  },
  test: {
    projects: testProjects,
  },
  fmt: {},
};

export default config;
