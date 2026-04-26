import solid from "vite-plugin-solid";
import { tailwindPlugin } from "@bosh-code/tsdown-plugin-tailwindcss";

import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts", "src/toolbar-app.tsx"],
    copy: ["src/components"],
    plugins: [solid(), tailwindPlugin()],
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
  fmt: {},
});
