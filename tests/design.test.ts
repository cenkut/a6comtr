import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

process.env.SESSION_SECRET ??=
  "test-session-secret-at-least-32-characters-long";
process.env.DATABASE_URL ??=
  "postgresql://a6:a6_dev_password@localhost:5433/a6?schema=public";
process.env.SKIP_ENV_VALIDATION = "true";

const prisma = new PrismaClient();

describe("card design", () => {
  const stamp = Date.now();
  let userId = "";
  let companyId = "";
  let orgId = "";

  let getDesign: typeof import("../src/modules/design/design.service").getDesign;
  let updateTheme: typeof import("../src/modules/design/design.service").updateTheme;
  let updateSections: typeof import("../src/modules/design/design.service").updateSections;

  beforeAll(async () => {
    const mod = await import("../src/modules/design/design.service");
    getDesign = mod.getDesign;
    updateTheme = mod.updateTheme;
    updateSections = mod.updateSections;

    await prisma.$connect();
    const user = await prisma.user.create({
      data: {
        email: `design-${stamp}@example.com`,
        emailVerifiedAt: new Date(),
      },
    });
    userId = user.id;
    const org = await prisma.organization.create({
      data: {
        name: `Design Org ${stamp}`,
        slug: `design-org-${stamp}`,
        memberships: { create: { userId, role: "OWNER" } },
      },
    });
    orgId = org.id;
    const company = await prisma.company.create({
      data: {
        organizationId: orgId,
        name: `Design Co ${stamp}`,
        slug: `design-co-${stamp}`,
        status: "ACTIVE",
      },
    });
    companyId = company.id;
  });

  afterAll(async () => {
    await prisma.companyProfileSection.deleteMany({ where: { companyId } });
    await prisma.companyProfileTheme.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.membership.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("initializes default theme and sections", async () => {
    const design = await getDesign(userId, companyId);
    expect(design.theme.primaryColor).toBe("#18181b");
    expect(design.sections.length).toBeGreaterThanOrEqual(8);
    expect(design.sections.every((s) => s.enabled)).toBe(true);
  });

  it("updates colors and section order", async () => {
    const theme = await updateTheme(userId, companyId, {
      primaryColor: "#0e7490",
      buttonStyle: "OUTLINE",
    });
    expect(theme.primaryColor).toBe("#0e7490");
    expect(theme.buttonStyle).toBe("OUTLINE");

    const design = await getDesign(userId, companyId);
    const reordered = design.sections.map((s, i) => ({
      ...s,
      sortOrder: i,
      enabled: s.key !== "DOCUMENTS",
    }));
    // move ABOUT first
    reordered.sort((a, b) =>
      a.key === "ABOUT" ? -1 : b.key === "ABOUT" ? 1 : a.sortOrder - b.sortOrder,
    );
    const withOrder = reordered.map((s, i) => ({ ...s, sortOrder: i }));
    const sections = await updateSections(userId, companyId, withOrder);
    expect(sections.find((s) => s.key === "DOCUMENTS")?.enabled).toBe(false);
    expect(sections[0]?.key).toBe("ABOUT");
  });
});
