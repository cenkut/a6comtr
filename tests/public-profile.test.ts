import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

process.env.SESSION_SECRET ??=
  "test-session-secret-at-least-32-characters-long";
process.env.DATABASE_URL ??=
  "postgresql://a6:a6_dev_password@localhost:5433/a6?schema=public";
process.env.SKIP_ENV_VALIDATION = "true";

const prisma = new PrismaClient();

describe("public profile visibility + vcard", () => {
  const stamp = Date.now();
  const slug = `public-co-${stamp}`;
  let companyId = "";
  let orgId = "";
  let userId = "";

  let getPublicProfileBySlug: typeof import("../src/modules/company/public-profile.service").getPublicProfileBySlug;
  let buildVCard: typeof import("../src/modules/company/public-profile.service").buildVCard;

  beforeAll(async () => {
    const mod = await import("../src/modules/company/public-profile.service");
    getPublicProfileBySlug = mod.getPublicProfileBySlug;
    buildVCard = mod.buildVCard;

    await prisma.$connect();
    const user = await prisma.user.create({
      data: {
        email: `public-${stamp}@example.com`,
        emailVerifiedAt: new Date(),
      },
    });
    userId = user.id;
    const org = await prisma.organization.create({
      data: {
        name: `Public Org ${stamp}`,
        slug: `public-org-${stamp}`,
        memberships: {
          create: { userId, role: "OWNER" },
        },
      },
    });
    orgId = org.id;

    const company = await prisma.company.create({
      data: {
        organizationId: orgId,
        name: `Public Co ${stamp}`,
        slug,
        shortDescription: "Test şirket",
        primaryPhone: "+90 555 111 2233",
        whatsappPhone: "+90 555 111 2233",
        website: "https://example.com",
        taxNumber: "SECRET_VKN_999",
        taxNumberVisible: false,
        mersisNumber: "SECRET_MERSIS",
        mersisVisible: false,
        status: "ACTIVE",
        publishedAt: new Date(),
        locations: {
          create: {
            type: "HEADQUARTERS",
            name: "Merkez",
            addressLine: "Test Cad. 1",
            city: "İstanbul",
            isVisible: true,
          },
        },
        customFields: {
          create: [
            {
              label: "Visible Field",
              value: "visible-value",
              isVisible: true,
            },
            {
              label: "Hidden Field",
              value: "hidden-secret",
              isVisible: false,
            },
          ],
        },
        socialLinks: {
          create: {
            platform: "INSTAGRAM",
            url: "https://instagram.com/example",
            isVisible: true,
          },
        },
      },
    });
    companyId = company.id;

    // Create a hidden location separately
    await prisma.companyLocation.create({
      data: {
        companyId,
        type: "WAREHOUSE",
        name: "Gizli Depo",
        addressLine: "Gizli Adres",
        isVisible: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.customField.deleteMany({ where: { companyId } });
    await prisma.socialLink.deleteMany({ where: { companyId } });
    await prisma.companyLocation.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.membership.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("returns only visible fields on public profile", async () => {
    const result = await getPublicProfileBySlug(slug);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;

    const { profile } = result;
    expect(profile.primaryPhone).toBe("+90 555 111 2233");
    expect(profile.taxNumber).toBeNull();
    expect(profile.mersisNumber).toBeNull();
    expect(profile.locations.map((l) => l.name)).toEqual(["Merkez"]);
    expect(profile.locations.map((l) => l.name)).not.toContain("Gizli Depo");
    expect(profile.customFields.map((f) => f.label)).toEqual(["Visible Field"]);
    expect(JSON.stringify(profile)).not.toContain("SECRET_VKN_999");
    expect(JSON.stringify(profile)).not.toContain("hidden-secret");
    expect(JSON.stringify(profile)).not.toContain("Gizli Adres");
  });

  it("builds vcard with public contact only", async () => {
    const result = await getPublicProfileBySlug(slug);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    const vcard = buildVCard(result.profile);
    expect(vcard).toContain("BEGIN:VCARD");
    expect(vcard).toContain("+90 555 111 2233");
    expect(vcard).not.toContain("SECRET_VKN");
  });

  it("marks draft companies as unpublished", async () => {
    await prisma.company.update({
      where: { id: companyId },
      data: { status: "DRAFT" },
    });
    const result = await getPublicProfileBySlug(slug);
    expect(result.kind).toBe("draft");
    await prisma.company.update({
      where: { id: companyId },
      data: { status: "ACTIVE" },
    });
  });
});
