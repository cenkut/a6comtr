import { requestOtp, verifyOtp } from "@/modules/auth/otp.service";
import {
  clearSessionCookie,
  getSessionTokenFromCookies,
  loginWithVerifiedEmail,
  revokeSessionByToken,
  setSessionCookie,
  type SessionUser,
} from "@/modules/auth/session.service";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { isAppError } from "@/lib/errors";

export async function handleRequestOtp(input: {
  email: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  return requestOtp(input);
}

export async function handleVerifyOtp(input: {
  email: string;
  code: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ user: SessionUser }> {
  try {
    const { email } = await verifyOtp({
      email: input.email,
      code: input.code,
    });

    const { user, token, expiresAt } = await loginWithVerifiedEmail(email, {
      ip: input.ip,
      userAgent: input.userAgent,
    });

    await setSessionCookie(token, expiresAt);

    void writeAuditLog({
      action: "LOGIN_SUCCESS",
      actorUserId: user.id,
      metadata: { email: user.email },
    }).catch(() => undefined);

    return { user };
  } catch (error) {
    void writeAuditLog({
      action: "LOGIN_FAILED",
      metadata: {
        email: input.email.toLowerCase(),
        code: isAppError(error) ? error.code : "UNKNOWN",
      },
    }).catch(() => undefined);
    throw error;
  }
}

export async function handleLogout(): Promise<void> {
  const token = await getSessionTokenFromCookies();
  await revokeSessionByToken(token);
  await clearSessionCookie();
}
