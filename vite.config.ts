import { defineConfig } from "vite-plus";
import { createTestProjects } from "./packages/astro-og-seo/vite.config.ts";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  test: {
    projects: createTestProjects({ buildE2e: true }),
  },
  run: {
    cache: true,
  },
});
