import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { env } from "@/lib/env";

/** 6-digit cryptographically secure OTP (000000–999999). */
export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Opaque session token (URL-safe). */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hash OTP with email + app secret so DB leaks alone are not enough to reuse codes.
 */
export function hashOtpCode(email: string, code: string): string {
  const normalized = normalizeEmail(email);
  return createHash("sha256")
    .update(`otp:${normalized}:${code}:${env.SESSION_SECRET}`)
    .digest("hex");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256")
    .update(`session:${token}:${env.SESSION_SECRET}`)
    .digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
