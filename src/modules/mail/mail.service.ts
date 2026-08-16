import { env } from "@/lib/env";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export interface MailProvider {
  send(message: MailMessage): Promise<void>;
}

class ConsoleMailProvider implements MailProvider {
  async send(message: MailMessage): Promise<void> {
    // Development / test: never fail, log clearly for local OTP testing.
    console.info(
      [
        "",
        "========== A6 MAIL (console) ==========",
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        "-----",
        message.text,
        "=======================================",
        "",
      ].join("\n"),
    );
  }
}

class SmtpMailProvider implements MailProvider {
  async send(message: MailMessage): Promise<void> {
    // Minimal SMTP via nodemailer will be wired in production phase.
    // For now, require host config and fall back to clear error.
    if (!env.SMTP_HOST) {
      throw new Error("SMTP_HOST is required when MAIL_PROVIDER=smtp");
    }

    // Lazy dynamic import keeps FAZ 1 deps light until SMTP is configured.
    // Production deploy (FAZ 11) will install/configure a real transporter.
    console.warn(
      "[mail] SMTP provider selected but transporter not fully configured yet.",
      {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        to: message.to,
        subject: message.subject,
      },
    );

    // Still log body in non-production so smoke tests work during transition.
    if (env.NODE_ENV !== "production") {
      await new ConsoleMailProvider().send(message);
      return;
    }

    throw new Error(
      "SMTP transporter not implemented — set MAIL_PROVIDER=console or complete SMTP wiring",
    );
  }
}

let provider: MailProvider | null = null;

export function getMailProvider(): MailProvider {
  if (!provider) {
    provider = env.MAIL_PROVIDER === "smtp"
      ? new SmtpMailProvider()
      : new ConsoleMailProvider();
  }
  return provider;
}

/** Test helper to inject a mock provider. */
export function setMailProviderForTests(next: MailProvider | null): void {
  provider = next;
}

export async function sendOtpEmail(
  email: string,
  code: string,
): Promise<void> {
  const minutes = env.OTP_EXPIRY_MINUTES;
  await getMailProvider().send({
    to: email,
    subject: `${code} — A6 giriş kodunuz`,
    text: [
      "A6 giriş doğrulama kodunuz:",
      "",
      code,
      "",
      `Bu kod ${minutes} dakika geçerlidir.`,
      "Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.",
      "",
      "— A6",
    ].join("\n"),
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h1 style="font-size:20px;margin:0 0 12px">A6 giriş kodu</h1>
        <p style="color:#52525b;margin:0 0 16px">E-posta adresinize gönderilen 6 haneli kod:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0 0 16px">${code}</p>
        <p style="color:#71717a;font-size:14px;margin:0">Bu kod ${minutes} dakika geçerlidir. Bu isteği siz yapmadıysanız yok sayın.</p>
      </div>
    `,
  });
}
