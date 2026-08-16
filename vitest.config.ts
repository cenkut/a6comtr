import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

loadEnv({ path: path.resolve(__dirname, ".env") });

// Test-friendly auth limits (must be set before app modules load).
process.env.SKIP_ENV_VALIDATION ??= "true";
process.env.OTP_RESEND_COOLDOWN_SECONDS ??= "0";
process.env.OTP_RATE_LIMIT_PER_HOUR ??= "100";
process.env.MAIL_PROVIDER ??= "console";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    globals: false,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
