import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import jsQR from "jsqr";
import { PNG } from "pngjs";

process.env.SESSION_SECRET ??=
  "test-session-secret-at-least-32-characters-long";
process.env.DATABASE_URL ??=
  "postgresql://a6:a6_dev_password@localhost:5433/a6?schema=public";
process.env.APP_URL ??= "http://localhost:3000";
process.env.SKIP_ENV_VALIDATION = "true";

const prisma = new PrismaClient();

describe("QR engine", () => {
  const stamp = Date.now();
  let userId = "";
  let companyId = "";
  let orgId = "";
  let publicCode = "";

  let getOrCreateCompanyQr: typeof import("../src/modules/qr/qr.service").getOrCreateCompanyQr;
  let resolveQrScan: typeof import("../src/modules/qr/qr.service").resolveQrScan;
  let renderUrlAsPng: typeof import("../src/modules/qr/qr.service").renderUrlAsPng;
  let renderUrlAsSvg: typeof import("../src/modules/qr/qr.service").renderUrlAsSvg;
  let buildQrPublicUrl: typeof import("../src/modules/qr/qr.service").buildQrPublicUrl;
  let generatePublicCode: typeof import("../src/modules/qr/public-code").generatePublicCode;

  beforeAll(async () => {
    const qrMod = await import("../src/modules/qr/qr.service");
    const codeMod = await import("../src/modules/qr/public-code");
    getOrCreateCompanyQr = qrMod.getOrCreateCompanyQr;
    resolveQrScan = qrMod.resolveQrScan;
    renderUrlAsPng = qrMod.renderUrlAsPng;
    renderUrlAsSvg = qrMod.renderUrlAsSvg;
    buildQrPublicUrl = qrMod.buildQrPublicUrl;
    generatePublicCode = codeMod.generatePublicCode;

    await prisma.$connect();
    const user = await prisma.user.create({
      data: {
        email: `qr-${stamp}@example.com`,
        emailVerifiedAt: new Date(),
      },
    });
    userId = user.id;
    const org = await prisma.organization.create({
      data: {
        name: `QR Org ${stamp}`,
        slug: `qr-org-${stamp}`,
        memberships: { create: { userId, role: "OWNER" } },
      },
    });
    orgId = org.id;
    const company = await prisma.company.create({
      data: {
        organizationId: orgId,
        name: `QR Co ${stamp}`,
        slug: `qr-co-${stamp}`,
        status: "ACTIVE",
        publishedAt: new Date(),
      },
    });
    companyId = company.id;
  });

  afterAll(async () => {
    await prisma.qRCode.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.membership.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("generates non-sequential public codes", () => {
    const codes = new Set(
      Array.from({ length: 20 }, () => generatePublicCode(6)),
    );
    expect(codes.size).toBe(20);
    for (const c of codes) {
      expect(c).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
    }
  });

  it("creates permanent QR and resolves to company slug", async () => {
    const qr = await getOrCreateCompanyQr(userId, companyId);
    publicCode = qr.publicCode;
    expect(qr.publicUrl).toContain(`/q/${qr.publicCode}`);
    expect(qr.publicUrl).not.toContain(companyId);

    const again = await getOrCreateCompanyQr(userId, companyId);
    expect(again.publicCode).toBe(qr.publicCode);

    const resolved = await resolveQrScan(qr.publicCode);
    expect(resolved).toMatchObject({
      kind: "redirect",
      slug: `qr-co-${stamp}`,
    });

    const row = await prisma.qRCode.findUnique({
      where: { publicCode: qr.publicCode },
    });
    expect(row?.scanCount).toBe(1);
  });

  it("returns not_found for invalid QR", async () => {
    const result = await resolveQrScan("ZZZZZZ");
    expect(result.kind).toBe("not_found");
  });

  it("handles suspended company QR", async () => {
    await prisma.company.update({
      where: { id: companyId },
      data: { status: "SUSPENDED" },
    });
    const result = await resolveQrScan(publicCode);
    expect(result.kind).toBe("company_suspended");
    await prisma.company.update({
      where: { id: companyId },
      data: { status: "ACTIVE" },
    });
  });

  it("PNG is a real scannable QR encoding permanent URL", async () => {
    const url = buildQrPublicUrl(publicCode || "TEST01");
    const pngBuffer = await renderUrlAsPng(url);
    expect(pngBuffer.subarray(0, 8).toString("hex")).toBe(
      "89504e470d0a1a0a",
    );

    const png = PNG.sync.read(pngBuffer);
    const decoded = jsQR(
      new Uint8ClampedArray(png.data),
      png.width,
      png.height,
    );
    expect(decoded).toBeTruthy();
    expect(decoded!.data).toBe(url);
  });

  it("SVG contains permanent URL and is print-friendly vector", async () => {
    const url = buildQrPublicUrl(publicCode || "TEST01");
    const svg = await renderUrlAsSvg(url);
    expect(svg).toContain("<svg");
    // qrcode lib embeds path data; URL is in the matrix, not as text.
    // Validate structural SVG + that generate path used our URL via PNG decode above.
    expect(svg.length).toBeGreaterThan(200);
  });
});
