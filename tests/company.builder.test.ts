import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

process.env.SESSION_SECRET ??=
  "test-session-secret-at-least-32-characters-long";
process.env.DATABASE_URL ??=
  "postgresql://a6:a6_dev_password@localhost:5433/a6?schema=public";
process.env.SKIP_ENV_VALIDATION = "true";

const prisma = new PrismaClient();

describe("company builder entities", () => {
  const stamp = Date.now();
  const email = `builder-${stamp}@example.com`;
  let userId = "";
  let companyId = "";
  let otherCompanyId = "";
  let otherUserId = "";

  let createOrganization: typeof import("../src/modules/organization/organization.service").createOrganization;
  let createCompany: typeof import("../src/modules/company/company.service").createCompany;
  let createLocation: typeof import("../src/modules/company/location.service").createLocation;
  let listLocations: typeof import("../src/modules/company/location.service").listLocations;
  let createSocialLink: typeof import("../src/modules/company/social.service").createSocialLink;
  let createCustomField: typeof import("../src/modules/company/custom-field.service").createCustomField;
  let updateCompany: typeof import("../src/modules/company/company.service").updateCompany;

  beforeAll(async () => {
    createOrganization = (
      await import("../src/modules/organization/organization.service")
    ).createOrganization;
    createCompany = (await import("../src/modules/company/company.service"))
      .createCompany;
    updateCompany = (await import("../src/modules/company/company.service"))
      .updateCompany;
    createLocation = (await import("../src/modules/company/location.service"))
      .createLocation;
    listLocations = (await import("../src/modules/company/location.service"))
      .listLocations;
    createSocialLink = (await import("../src/modules/company/social.service"))
      .createSocialLink;
    createCustomField = (
      await import("../src/modules/company/custom-field.service")
    ).createCustomField;

    await prisma.$connect();
    const user = await prisma.user.create({
      data: { email, emailVerifiedAt: new Date() },
    });
    userId = user.id;
    const org = await createOrganization({
      userId,
      name: `Builder Org ${stamp}`,
    });
    const company = await createCompany({
      userId,
      organizationId: org.id,
      name: `Builder Co ${stamp}`,
    });
    companyId = company.id;

    const otherUser = await prisma.user.create({
      data: {
        email: `builder-other-${stamp}@example.com`,
        emailVerifiedAt: new Date(),
      },
    });
    otherUserId = otherUser.id;
    const otherOrg = await createOrganization({
      userId: otherUserId,
      name: `Other Org ${stamp}`,
    });
    const otherCompany = await createCompany({
      userId: otherUserId,
      organizationId: otherOrg.id,
      name: `Other Co ${stamp}`,
    });
    otherCompanyId = otherCompany.id;
  });

  afterAll(async () => {
    await prisma.customField.deleteMany({
      where: { companyId: { in: [companyId, otherCompanyId] } },
    });
    await prisma.socialLink.deleteMany({
      where: { companyId: { in: [companyId, otherCompanyId] } },
    });
    await prisma.companyLocation.deleteMany({
      where: { companyId: { in: [companyId, otherCompanyId] } },
    });
    await prisma.company.deleteMany({
      where: { id: { in: [companyId, otherCompanyId] } },
    });
    await prisma.membership.deleteMany({
      where: { userId: { in: [userId, otherUserId] } },
    });
    await prisma.organization.deleteMany({
      where: {
        memberships: { none: {} },
      },
    });
    // Clean remaining orgs from this test by company cascade already done
    await prisma.user.deleteMany({
      where: { id: { in: [userId, otherUserId] } },
    });
    await prisma.$disconnect();
  });

  it("creates location with visibility", async () => {
    const loc = await createLocation(userId, companyId, {
      type: "WAREHOUSE",
      name: "Bursa Deposu",
      city: "Bursa",
      contactPersonName: "Ahmet Yılmaz",
      workingHours: "08:30 - 18:00",
    });
    expect(loc.name).toBe("Bursa Deposu");
    expect(loc.isVisible).toBe(true);

    const list = await listLocations(userId, companyId);
    expect(list.some((l) => l.id === loc.id)).toBe(true);
  });

  it("creates social link and custom field", async () => {
    const social = await createSocialLink(userId, companyId, {
      platform: "LINKEDIN",
      url: "https://linkedin.com/company/example",
    });
    expect(social.platform).toBe("LINKEDIN");

    const field = await createCustomField(userId, companyId, {
      label: "Yetkili Bayi Kodu",
      value: "12345",
      type: "TEXT",
    });
    expect(field.label).toBe("Yetkili Bayi Kodu");
    expect(field.isVisible).toBe(true);
  });

  it("updates company visibility flags", async () => {
    const updated = await updateCompany(userId, companyId, {
      taxNumber: "1234567890",
      taxNumberVisible: false,
    });
    expect(updated.taxNumber).toBe("1234567890");
    expect(updated.taxNumberVisible).toBe(false);
  });

  it("blocks cross-tenant location list", async () => {
    await expect(listLocations(userId, otherCompanyId)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });
});
