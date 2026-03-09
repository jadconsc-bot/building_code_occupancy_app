import { defineConfig } from "vitest/config";
import path from "path";

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
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/src/__tests__/**/*.test.ts"],
    globals: true,
    testTimeout: 30000, // 30 seconds for LLM-based tests
    env: {
      NODE_ENV: 'test',
      MOCK_TSA_SERVICE: 'true',
      DISABLE_RATE_LIMITING: 'true',
      VERIFY_CERTIFICATES: 'true',
    },
  },
});
