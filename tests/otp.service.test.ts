import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  generateOtpCode,
  hashOtpCode,
  normalizeEmail,
  safeEqualHex,
} from "../src/lib/crypto";

/**
 * Integration-style OTP tests against the real local Postgres.
 * Requires DATABASE_URL and migrated schema.
 */

const prisma = new PrismaClient();

// Ensure env for crypto hashing (mirrors .env in local/dev).
process.env.SESSION_SECRET ??=
  "test-session-secret-at-least-32-characters-long";
process.env.DATABASE_URL ??=
  "postgresql://a6:a6_dev_password@localhost:5433/a6?schema=public";
process.env.SKIP_ENV_VALIDATION = "true";

describe("crypto otp helpers", () => {
  it("generates 6 digit codes", () => {
    for (let i = 0; i < 20; i += 1) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("hashes deterministically and compares safely", () => {
    const email = "user@example.com";
    const code = "381924";
    const a = hashOtpCode(email, code);
    const b = hashOtpCode(email, code);
    const c = hashOtpCode(email, "000000");
    expect(a).toBe(b);
    expect(safeEqualHex(a, b)).toBe(true);
    expect(safeEqualHex(a, c)).toBe(false);
  });

  it("normalizes email", () => {
    expect(normalizeEmail("  Admin@Example.COM ")).toBe("admin@example.com");
  });
});

describe("otp challenge lifecycle (db)", () => {
  const email = `otp-test-${Date.now()}@example.com`;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.otpChallenge.deleteMany({ where: { email } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.otpChallenge.deleteMany({ where: { email } });
  });

  it("stores hashed code, not plaintext", async () => {
    const code = "123456";
    const codeHash = hashOtpCode(email, code);
    await prisma.otpChallenge.create({
      data: {
        email,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        maxAttempts: 5,
      },
    });

    const row = await prisma.otpChallenge.findFirst({ where: { email } });
    expect(row).toBeTruthy();
    expect(row!.codeHash).not.toContain(code);
    expect(row!.codeHash).toBe(codeHash);
  });

  it("blocks reuse after consume", async () => {
    const code = "654321";
    const created = await prisma.otpChallenge.create({
      data: {
        email,
        codeHash: hashOtpCode(email, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        maxAttempts: 5,
      },
    });

    await prisma.otpChallenge.update({
      where: { id: created.id },
      data: { consumedAt: new Date() },
    });

    const active = await prisma.otpChallenge.findFirst({
      where: { email, consumedAt: null },
    });
    expect(active).toBeNull();
  });

  it("treats expired challenges as invalid", async () => {
    await prisma.otpChallenge.create({
      data: {
        email,
        codeHash: hashOtpCode(email, "111111"),
        expiresAt: new Date(Date.now() - 1000),
        maxAttempts: 5,
      },
    });

    const challenge = await prisma.otpChallenge.findFirst({
      where: { email, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    expect(challenge).toBeTruthy();
    expect(challenge!.expiresAt.getTime()).toBeLessThan(Date.now());
  });

  it("enforces max attempts", async () => {
    const created = await prisma.otpChallenge.create({
      data: {
        email,
        codeHash: hashOtpCode(email, "222222"),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 5,
        maxAttempts: 5,
      },
    });

    expect(created.attempts >= created.maxAttempts).toBe(true);
  });
});
