import { defineConfig } from "vitest/config";
import path from "path";
import { config } from "dotenv";

config({ path: ".env.test" });

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/src/__tests__/**/*.test.ts", "tests/**/*.test.ts", "tests/**/*.spec.ts"],
    exclude: ["node_modules", "dist", "client"],
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["server/engine/**", "server/services/**"],
    },
  },
});
