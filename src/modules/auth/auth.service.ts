import { requestOtp, verifyOtp } from "@/modules/auth/otp.service";
import {
  clearSessionCookie,
  getSessionTokenFromCookies,
  loginWithVerifiedEmail,
  revokeSessionByToken,
  setSessionCookie,
  type SessionUser,
} from "@/modules/auth/session.service";

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
  const { email } = await verifyOtp({
    email: input.email,
    code: input.code,
  });

  const { user, token, expiresAt } = await loginWithVerifiedEmail(email, {
    ip: input.ip,
    userAgent: input.userAgent,
  });

  await setSessionCookie(token, expiresAt);
  return { user };
}

export async function handleLogout(): Promise<void> {
  const token = await getSessionTokenFromCookies();
  await revokeSessionByToken(token);
  await clearSessionCookie();
}
