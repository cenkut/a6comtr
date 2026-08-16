import { describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * Baseline: env schema shape and validation rules (no live secrets).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
});

describe("env schema baseline", () => {
  it("accepts valid development config", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "postgresql://a6:pass@localhost:5432/a6",
      SESSION_SECRET: "x".repeat(32),
      NODE_ENV: "development",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing DATABASE_URL", () => {
    const result = envSchema.safeParse({
      SESSION_SECRET: "x".repeat(32),
    });
    expect(result.success).toBe(false);
  });

  it("rejects short SESSION_SECRET", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "postgresql://a6:pass@localhost:5432/a6",
      SESSION_SECRET: "too-short",
    });
    expect(result.success).toBe(false);
  });

  it("defaults OTP expiry to 10 minutes", () => {
    const result = envSchema.parse({
      DATABASE_URL: "postgresql://a6:pass@localhost:5432/a6",
      SESSION_SECRET: "x".repeat(32),
    });
    expect(result.OTP_EXPIRY_MINUTES).toBe(10);
  });
});
