import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

process.env.SESSION_SECRET ??=
  "test-session-secret-at-least-32-characters-long";
process.env.DATABASE_URL ??=
  "postgresql://a6:a6_dev_password@localhost:5433/a6?schema=public";
process.env.SKIP_ENV_VALIDATION = "true";

const prisma = new PrismaClient();

describe("analytics", () => {
  const stamp = Date.now();
  let userId = "";
  let companyId = "";
  let orgId = "";

  let trackEvent: typeof import("../src/modules/analytics/analytics.service").trackEvent;
  let getCompanyMetrics: typeof import("../src/modules/analytics/analytics.service").getCompanyMetrics;

  beforeAll(async () => {
    const mod = await import("../src/modules/analytics/analytics.service");
    trackEvent = mod.trackEvent;
    getCompanyMetrics = mod.getCompanyMetrics;

    await prisma.$connect();
    const user = await prisma.user.create({
      data: {
        email: `analytics-${stamp}@example.com`,
        emailVerifiedAt: new Date(),
      },
    });
    userId = user.id;
    const org = await prisma.organization.create({
      data: {
        name: `Analytics Org ${stamp}`,
        slug: `analytics-org-${stamp}`,
        memberships: { create: { userId, role: "OWNER" } },
      },
    });
    orgId = org.id;
    const company = await prisma.company.create({
      data: {
        organizationId: orgId,
        name: `Analytics Co ${stamp}`,
        slug: `analytics-co-${stamp}`,
        status: "ACTIVE",
      },
    });
    companyId = company.id;
  });

  afterAll(async () => {
    await prisma.analyticsEvent.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.membership.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("tracks events and aggregates metrics", async () => {
    await trackEvent({ companyId, type: "QR_SCAN" });
    await trackEvent({ companyId, type: "QR_SCAN" });
    await trackEvent({ companyId, type: "PROFILE_VIEW" });
    await trackEvent({ companyId, type: "PHONE_CLICK" });
    await trackEvent({ companyId, type: "WHATSAPP_CLICK" });

    const metrics = await getCompanyMetrics(userId, companyId);
    expect(metrics.qrScan.total).toBe(2);
    expect(metrics.profileView.total).toBe(1);
    expect(metrics.phoneClick.total).toBe(1);
    expect(metrics.whatsappClick.total).toBe(1);
    expect(metrics.actionClicks.total).toBe(2);
  });
});
