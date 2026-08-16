import QRCodeLib from "qrcode";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { requireCompanyAccess } from "@/modules/authz/access";
import { generatePublicCode } from "@/modules/qr/public-code";

export type QRCodeDto = {
  id: string;
  companyId: string;
  publicCode: string;
  status: "ACTIVE" | "DISABLED";
  scanCount: number;
  lastScannedAt: Date | null;
  publicUrl: string;
  createdAt: Date;
};

export function buildQrPublicUrl(publicCode: string): string {
  return `${env.APP_URL.replace(/\/$/, "")}/q/${publicCode}`;
}

export async function getOrCreateCompanyQr(
  userId: string,
  companyId: string,
): Promise<QRCodeDto> {
  await requireCompanyAccess(userId, companyId, "VIEWER");

  const existing = await db.qRCode.findFirst({
    where: { companyId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return toDto(existing);

  await requireCompanyAccess(userId, companyId, "EDITOR");
  const publicCode = await uniquePublicCode();
  const created = await db.qRCode.create({
    data: {
      companyId,
      publicCode,
      status: "ACTIVE",
    },
  });
  return toDto(created);
}

export async function listCompanyQrs(
  userId: string,
  companyId: string,
): Promise<QRCodeDto[]> {
  await requireCompanyAccess(userId, companyId, "VIEWER");
  const rows = await db.qRCode.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toDto);
}

export type QrResolveResult =
  | {
      kind: "redirect";
      slug: string;
      qrCodeId: string;
      companyId: string;
    }
  | { kind: "not_found" }
  | { kind: "disabled" }
  | { kind: "company_draft" }
  | { kind: "company_suspended" }
  | { kind: "company_archived" };

/**
 * Resolve permanent QR code → company slug redirect target.
 * Increments scan counters when redirecting.
 */
export async function resolveQrScan(
  publicCode: string,
): Promise<QrResolveResult> {
  const code = publicCode.trim().toUpperCase();
  const qr = await db.qRCode.findUnique({
    where: { publicCode: code },
    include: {
      company: {
        select: {
          id: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  if (!qr) return { kind: "not_found" };
  if (qr.status !== "ACTIVE") return { kind: "disabled" };

  if (qr.company.status === "DRAFT") return { kind: "company_draft" };
  if (qr.company.status === "SUSPENDED") return { kind: "company_suspended" };
  if (qr.company.status === "ARCHIVED") return { kind: "company_archived" };
  if (qr.company.status !== "ACTIVE") return { kind: "not_found" };

  await db.qRCode.update({
    where: { id: qr.id },
    data: {
      scanCount: { increment: 1 },
      lastScannedAt: new Date(),
    },
  });

  // Analytics event (best-effort; do not fail redirect)
  const { trackEvent } = await import("@/modules/analytics/analytics.service");
  void trackEvent({
    companyId: qr.companyId,
    qrCodeId: qr.id,
    type: "QR_SCAN",
  }).catch(() => undefined);

  return {
    kind: "redirect",
    slug: qr.company.slug,
    qrCodeId: qr.id,
    companyId: qr.companyId,
  };
}

export async function renderQrPng(
  userId: string,
  companyId: string,
): Promise<Buffer> {
  const qr = await getOrCreateCompanyQr(userId, companyId);
  const url = buildQrPublicUrl(qr.publicCode);
  return QRCodeLib.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 2,
    width: 1024,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

export async function renderQrSvg(
  userId: string,
  companyId: string,
): Promise<string> {
  const qr = await getOrCreateCompanyQr(userId, companyId);
  const url = buildQrPublicUrl(qr.publicCode);
  return QRCodeLib.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

/** Low-level render for tests without auth. */
export async function renderUrlAsPng(url: string): Promise<Buffer> {
  return QRCodeLib.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 2,
    width: 512,
  });
}

export async function renderUrlAsSvg(url: string): Promise<string> {
  return QRCodeLib.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
  });
}

async function uniquePublicCode(): Promise<string> {
  for (let i = 0; i < 12; i += 1) {
    const code = generatePublicCode(6);
    const exists = await db.qRCode.findUnique({
      where: { publicCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new AppError(
    "QR_CODE_GEN_FAILED",
    "QR kodu oluşturulamadı. Tekrar deneyin.",
    500,
    false,
  );
}

function toDto(row: {
  id: string;
  companyId: string;
  publicCode: string;
  status: "ACTIVE" | "DISABLED";
  scanCount: number;
  lastScannedAt: Date | null;
  createdAt: Date;
}): QRCodeDto {
  return {
    id: row.id,
    companyId: row.companyId,
    publicCode: row.publicCode,
    status: row.status,
    scanCount: row.scanCount,
    lastScannedAt: row.lastScannedAt,
    publicUrl: buildQrPublicUrl(row.publicCode),
    createdAt: row.createdAt,
  };
}
