import { createRequire } from "node:module";
import solid from "vite-plugin-solid";

import { playwright } from "vite-plus/test/browser-playwright";

const require = createRequire(import.meta.url);
const nodeAliases = {
  "@takumi-rs/core": require.resolve("@takumi-rs/core"),
  "decode-named-character-reference": require.resolve("decode-named-character-reference"),
} as unknown;

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
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["test/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
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
        plugins: [solid()],
        resolve: {
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
        extends: true,
        test: {
          name: "e2e",
          environment: "node",
          include: ["test/e2e/**/*.test.ts"],
          hookTimeout: 120_000,
          testTimeout: 120_000,
        },
      },
    ],
  },
  fmt: {},
};

export default config;
