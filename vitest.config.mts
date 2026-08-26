import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "packages/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": root,
      "@noirly-dev/split-core/money": fileURLToPath(
        new URL("./packages/split-core/src/money/index.ts", import.meta.url),
      ),
      "@noirly-dev/split-core/splits": fileURLToPath(
        new URL("./packages/split-core/src/splits/index.ts", import.meta.url),
      ),
      "@noirly-dev/split-core/balances/net": fileURLToPath(
        new URL("./packages/split-core/src/balances/net.ts", import.meta.url),
      ),
      "@noirly-dev/split-core/balances/simplify": fileURLToPath(
        new URL(
          "./packages/split-core/src/balances/simplify.ts",
          import.meta.url,
        ),
      ),
      "@noirly-dev/split-core/recurrence": fileURLToPath(
        new URL("./packages/split-core/src/recurrence/next.ts", import.meta.url),
      ),
      "@noirly-dev/split-core/payments": fileURLToPath(
        new URL("./packages/split-core/src/payments/links.ts", import.meta.url),
      ),
      "@noirly-dev/split-core/models": fileURLToPath(
        new URL("./packages/split-core/src/models/types.ts", import.meta.url),
      ),
    },
  },
});
