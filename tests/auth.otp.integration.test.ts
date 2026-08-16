import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

process.env.SESSION_SECRET ??=
  "test-session-secret-at-least-32-characters-long";
process.env.DATABASE_URL ??=
  "postgresql://a6:a6_dev_password@localhost:5433/a6?schema=public";
process.env.SKIP_ENV_VALIDATION = "true";
process.env.OTP_RESEND_COOLDOWN_SECONDS = "0";
process.env.OTP_RATE_LIMIT_PER_HOUR = "100";
process.env.OTP_EXPIRY_MINUTES = "10";
process.env.OTP_MAX_ATTEMPTS = "5";
process.env.MAIL_PROVIDER = "console";

const prisma = new PrismaClient();

describe("auth otp service integration", () => {
  const email = `auth-int-${Date.now()}@example.com`;
  let requestOtp: typeof import("../src/modules/auth/otp.service").requestOtp;
  let verifyOtp: typeof import("../src/modules/auth/otp.service").verifyOtp;
  let hashOtpCode: typeof import("../src/lib/crypto").hashOtpCode;
  let setMailProviderForTests: typeof import("../src/modules/mail/mail.service").setMailProviderForTests;

  let lastCode: string | null = null;

  beforeAll(async () => {
    // Dynamic import after env is set so modules read correct config.
    const otpMod = await import("../src/modules/auth/otp.service");
    const cryptoMod = await import("../src/lib/crypto");
    const mailMod = await import("../src/modules/mail/mail.service");
    requestOtp = otpMod.requestOtp;
    verifyOtp = otpMod.verifyOtp;
    hashOtpCode = cryptoMod.hashOtpCode;
    setMailProviderForTests = mailMod.setMailProviderForTests;

    setMailProviderForTests({
      async send(message) {
        const match = message.text.match(/\b(\d{6})\b/);
        lastCode = match?.[1] ?? null;
      },
    });

    await prisma.$connect();
  });

  afterAll(async () => {
    setMailProviderForTests(null);
    await prisma.otpChallenge.deleteMany({
      where: { email: { contains: "auth-int-" } },
    });
    await prisma.session.deleteMany({
      where: { user: { email: { contains: "auth-int-" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "auth-int-" } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    lastCode = null;
    await prisma.otpChallenge.deleteMany({ where: { email } });
  });

  it("generates and verifies OTP successfully", async () => {
    await requestOtp({ email });
    expect(lastCode).toMatch(/^\d{6}$/);

    const result = await verifyOtp({ email, code: lastCode! });
    expect(result.email).toBe(email);

    // Challenge must be consumed.
    const active = await prisma.otpChallenge.findFirst({
      where: { email, consumedAt: null },
    });
    expect(active).toBeNull();
  });

  it("blocks OTP reuse", async () => {
    await requestOtp({ email });
    const code = lastCode!;
    await verifyOtp({ email, code });

    await expect(verifyOtp({ email, code })).rejects.toMatchObject({
      code: "OTP_INVALID",
    });
  });

  it("rejects wrong code and counts attempts", async () => {
    await requestOtp({ email });
    await expect(
      verifyOtp({ email, code: "000000" }),
    ).rejects.toMatchObject({ code: "OTP_INVALID" });

    const row = await prisma.otpChallenge.findFirst({
      where: { email, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    expect(row?.attempts).toBe(1);
  });

  it("blocks after max attempts", async () => {
    await requestOtp({ email });
    // Force attempts near limit
    await prisma.otpChallenge.updateMany({
      where: { email, consumedAt: null },
      data: { attempts: 4 },
    });

    await expect(
      verifyOtp({ email, code: "000000" }),
    ).rejects.toMatchObject({ code: "OTP_MAX_ATTEMPTS" });
  });

  it("rejects expired OTP", async () => {
    await requestOtp({ email });
    await prisma.otpChallenge.updateMany({
      where: { email, consumedAt: null },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(
      verifyOtp({ email, code: lastCode! }),
    ).rejects.toMatchObject({ code: "OTP_EXPIRED" });
  });

  it("never stores plaintext OTP", async () => {
    await requestOtp({ email });
    const row = await prisma.otpChallenge.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
    expect(row).toBeTruthy();
    expect(row!.codeHash).not.toBe(lastCode);
    expect(row!.codeHash).toBe(hashOtpCode(email, lastCode!));
  });
});
