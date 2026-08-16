import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  generateOtpCode,
  hashOtpCode,
  normalizeEmail,
  safeEqualHex,
} from "@/lib/crypto";
import { AppError } from "@/lib/errors";
import { sendOtpEmail } from "@/modules/mail/mail.service";

export type RequestOtpInput = {
  email: string;
  ip?: string | null;
  userAgent?: string | null;
};

export type VerifyOtpInput = {
  email: string;
  code: string;
};

/**
 * Request a new OTP for the given e-mail.
 * Always returns a generic success shape to reduce account enumeration signal
 * timing differences are acceptable for V1; message is uniform.
 */
export async function requestOtp(input: RequestOtpInput): Promise<{
  ok: true;
  expiresInSeconds: number;
  cooldownSeconds: number;
}> {
  const email = normalizeEmail(input.email);
  validateEmailFormat(email);

  await enforceRequestRateLimits(email, input.ip ?? null);

  // Invalidate outstanding challenges for this e-mail.
  await db.otpChallenge.updateMany({
    where: {
      email,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      consumedAt: new Date(),
    },
  });

  const code = generateOtpCode();
  const codeHash = hashOtpCode(email, code);
  const expiresAt = new Date(
    Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000,
  );

  await db.otpChallenge.create({
    data: {
      email,
      codeHash,
      expiresAt,
      maxAttempts: env.OTP_MAX_ATTEMPTS,
      requestIp: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });

  await sendOtpEmail(email, code);

  return {
    ok: true,
    expiresInSeconds: env.OTP_EXPIRY_MINUTES * 60,
    cooldownSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
  };
}

/**
 * Verify OTP. On success returns the e-mail (normalized) and consumes the challenge.
 * Caller is responsible for creating/updating User + Session.
 */
export async function verifyOtp(input: VerifyOtpInput): Promise<{
  email: string;
}> {
  const email = normalizeEmail(input.email);
  const code = input.code.trim();

  validateEmailFormat(email);
  if (!/^\d{6}$/.test(code)) {
    throw new AppError(
      "OTP_INVALID",
      "Doğrulama kodu geçersiz.",
      400,
    );
  }

  const challenge = await db.otpChallenge.findFirst({
    where: {
      email,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    throw new AppError(
      "OTP_INVALID",
      "Doğrulama kodu geçersiz.",
      400,
    );
  }

  if (challenge.expiresAt.getTime() <= Date.now()) {
    await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });
    throw new AppError(
      "OTP_EXPIRED",
      "Doğrulama kodunun süresi dolmuş. Yeni kod isteyin.",
      400,
    );
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });
    throw new AppError(
      "OTP_MAX_ATTEMPTS",
      "Çok fazla hatalı deneme. Yeni kod isteyin.",
      429,
    );
  }

  const expected = challenge.codeHash;
  const actual = hashOtpCode(email, code);

  if (!safeEqualHex(expected, actual)) {
    const updated = await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });

    if (updated.attempts >= updated.maxAttempts) {
      await db.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw new AppError(
        "OTP_MAX_ATTEMPTS",
        "Çok fazla hatalı deneme. Yeni kod isteyin.",
        429,
      );
    }

    throw new AppError(
      "OTP_INVALID",
      "Doğrulama kodu geçersiz.",
      400,
    );
  }

  // Consume challenge (single-use).
  const consumed = await db.otpChallenge.updateMany({
    where: {
      id: challenge.id,
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  if (consumed.count !== 1) {
    // Race: already used.
    throw new AppError(
      "OTP_INVALID",
      "Doğrulama kodu geçersiz.",
      400,
    );
  }

  return { email };
}

async function enforceRequestRateLimits(
  email: string,
  ip: string | null,
): Promise<void> {
  const cooldownMs = env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const latest = await db.otpChallenge.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (latest && Date.now() - latest.createdAt.getTime() < cooldownMs) {
    const waitSec = Math.ceil(
      (cooldownMs - (Date.now() - latest.createdAt.getTime())) / 1000,
    );
    throw new AppError(
      "OTP_RATE_LIMIT",
      `Yeni kod için ${waitSec} saniye bekleyin.`,
      429,
    );
  }

  const hourlyCount = await db.otpChallenge.count({
    where: {
      email,
      createdAt: { gte: hourAgo },
    },
  });

  if (hourlyCount >= env.OTP_RATE_LIMIT_PER_HOUR) {
    throw new AppError(
      "OTP_RATE_LIMIT",
      "Çok fazla kod isteği. Lütfen daha sonra tekrar deneyin.",
      429,
    );
  }

  // Soft IP throttle (shared networks): generous limit.
  if (ip) {
    const ipHourly = await db.otpChallenge.count({
      where: {
        requestIp: ip,
        createdAt: { gte: hourAgo },
      },
    });
    if (ipHourly >= env.OTP_RATE_LIMIT_PER_HOUR * 5) {
      throw new AppError(
        "OTP_RATE_LIMIT",
        "Çok fazla kod isteği. Lütfen daha sonra tekrar deneyin.",
        429,
      );
    }
  }
}

function validateEmailFormat(email: string): void {
  // Practical validation — not full RFC.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new AppError(
      "EMAIL_INVALID",
      "Geçerli bir e-posta adresi girin.",
      400,
    );
  }
}
