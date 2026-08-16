import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { env, isProduction } from "@/lib/env";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/lib/crypto";
import { AppError } from "@/lib/errors";
import type { User } from "@prisma/client";

export const SESSION_COOKIE_NAME = "a6_session";
const SESSION_TTL_DAYS = 30;

export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "isPlatformAdmin" | "emailVerifiedAt"
>;

export async function createSessionForUser(
  userId: string,
  meta?: { ip?: string | null; userAgent?: string | null },
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction() || env.COOKIE_SECURE === true,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction() || env.COOKIE_SECURE === true,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentSession(): Promise<{
  sessionId: string;
  user: SessionUser;
} | null> {
  const token = await getSessionTokenFromCookies();
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          isPlatformAdmin: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;

  // Touch lastSeenAt (best-effort, non-blocking for request path).
  void db.session
    .update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => undefined);

  return {
    sessionId: session.id,
    user: session.user,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getCurrentSession();
  if (!session) {
    throw new AppError(
      "UNAUTHORIZED",
      "Oturum açmanız gerekiyor.",
      401,
    );
  }
  return session.user;
}

export async function revokeSessionByToken(
  token: string | null,
): Promise<void> {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await db.session.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

/**
 * Upsert user on successful OTP verify and open a new session.
 * Old sessions are left intact (multi-device); caller can revoke if needed.
 */
export async function loginWithVerifiedEmail(
  email: string,
  meta?: { ip?: string | null; userAgent?: string | null },
): Promise<{ user: SessionUser; token: string; expiresAt: Date }> {
  const now = new Date();
  const user = await db.user.upsert({
    where: { email },
    create: {
      email,
      emailVerifiedAt: now,
      lastLoginAt: now,
    },
    update: {
      emailVerifiedAt: now,
      lastLoginAt: now,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isPlatformAdmin: true,
      emailVerifiedAt: true,
    },
  });

  const { token, expiresAt } = await createSessionForUser(user.id, meta);
  return { user, token, expiresAt };
}
