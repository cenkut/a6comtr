import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_NAME: z.string().default("A6"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_DOMAIN: z.string().default("localhost"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters")
    .default("dev-only-session-secret-change-in-production-32"),

  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),

  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  OTP_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(10),

  MAIL_PROVIDER: z.enum(["console", "smtp"]).default("console"),
  MAIL_FROM: z.string().default("A6 <noreply@a6.com.tr>"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  UPLOAD_MAX_SIZE_MB: z.coerce.number().positive().default(10),
  UPLOAD_DIR: z.string().default("./uploads"),

  PLATFORM_ADMIN_EMAILS: z.string().default(""),

  SEED_ON_BOOT: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof envSchema>;

const buildTimeDefaults = {
  DATABASE_URL:
    "postgresql://a6:a6_dev_password@localhost:5432/a6?schema=public",
  SESSION_SECRET: "dev-only-session-secret-change-in-production-32",
} as const;

function loadEnv(): Env {
  const skipValidation =
    process.env.SKIP_ENV_VALIDATION === "true" ||
    process.env.npm_lifecycle_event === "build" ||
    process.env.NEXT_PHASE === "phase-production-build";

  const source = skipValidation
    ? { ...buildTimeDefaults, ...process.env }
    : process.env;

  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }

  if (
    parsed.data.NODE_ENV === "production" &&
    !skipValidation &&
    parsed.data.SESSION_SECRET === buildTimeDefaults.SESSION_SECRET
  ) {
    throw new Error(
      "SESSION_SECRET must be set to a strong random value in production",
    );
  }

  return parsed.data;
}

/**
 * Validated application configuration.
 * Secrets must come from environment / secret store — never hardcode.
 */
export const env = loadEnv();

export function isProduction(): boolean {
  return env.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return env.NODE_ENV === "development";
}

export function getPlatformAdminEmails(): string[] {
  return env.PLATFORM_ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
