import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

process.env.SESSION_SECRET ??=
  "test-session-secret-at-least-32-characters-long";
process.env.DATABASE_URL ??=
  "postgresql://a6:a6_dev_password@localhost:5433/a6?schema=public";
process.env.SKIP_ENV_VALIDATION = "true";
process.env.MAIL_PROVIDER = "console";

const prisma = new PrismaClient();

/**
 * Critical security test (plan.md §23 / §28):
 * User A / Org A can read Company A.
 * User A must NOT read Company B of Org B (404, no data leakage).
 */
describe("organization isolation", () => {
  const stamp = Date.now();
  const emailA = `tenant-a-${stamp}@example.com`;
  const emailB = `tenant-b-${stamp}@example.com`;

  let userAId = "";
  let userBId = "";
  let orgAId = "";
  let orgBId = "";
  let companyAId = "";
  let companyBId = "";

  let getCompanyForUser: typeof import("../src/modules/company/company.service").getCompanyForUser;
  let listCompaniesForOrganization: typeof import("../src/modules/company/company.service").listCompaniesForOrganization;
  let createOrganization: typeof import("../src/modules/organization/organization.service").createOrganization;
  let createCompany: typeof import("../src/modules/company/company.service").createCompany;
  let requireCompanyAccess: typeof import("../src/modules/authz/access").requireCompanyAccess;

  beforeAll(async () => {
    const companyMod = await import("../src/modules/company/company.service");
    const orgMod = await import("../src/modules/organization/organization.service");
    const accessMod = await import("../src/modules/authz/access");
    getCompanyForUser = companyMod.getCompanyForUser;
    listCompaniesForOrganization = companyMod.listCompaniesForOrganization;
    createOrganization = orgMod.createOrganization;
    createCompany = companyMod.createCompany;
    requireCompanyAccess = accessMod.requireCompanyAccess;

    await prisma.$connect();

    const userA = await prisma.user.create({
      data: { email: emailA, emailVerifiedAt: new Date() },
    });
    const userB = await prisma.user.create({
      data: { email: emailB, emailVerifiedAt: new Date() },
    });
    userAId = userA.id;
    userBId = userB.id;

    const orgA = await createOrganization({
      userId: userAId,
      name: `Org A ${stamp}`,
    });
    const orgB = await createOrganization({
      userId: userBId,
      name: `Org B ${stamp}`,
    });
    orgAId = orgA.id;
    orgBId = orgB.id;

    const companyA = await createCompany({
      userId: userAId,
      organizationId: orgAId,
      name: `Company A ${stamp}`,
      primaryPhone: "+90 555 000 0001",
    });
    const companyB = await createCompany({
      userId: userBId,
      organizationId: orgBId,
      name: `Company B ${stamp}`,
      primaryPhone: "+90 555 000 0002",
    });
    companyAId = companyA.id;
    companyBId = companyB.id;
  });

  afterAll(async () => {
    await prisma.company.deleteMany({
      where: { id: { in: [companyAId, companyBId].filter(Boolean) } },
    });
    await prisma.membership.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId].filter(Boolean) } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [orgAId, orgBId].filter(Boolean) } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId].filter(Boolean) } },
    });
    await prisma.$disconnect();
  });

  it("User A can read Company A", async () => {
    const company = await getCompanyForUser(userAId, companyAId);
    expect(company.id).toBe(companyAId);
    expect(company.name).toContain("Company A");
    expect(company.primaryPhone).toBe("+90 555 000 0001");
  });

  it("User A cannot read Company B (404, no leakage)", async () => {
    let thrown: unknown;
    try {
      await getCompanyForUser(userAId, companyBId);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeTruthy();
    expect(thrown).toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });

    // Ensure error message does not include Company B private data.
    const message = String((thrown as { message?: string }).message ?? "");
    expect(message).not.toContain("Company B");
    expect(message).not.toContain("+90 555 000 0002");
    expect(message).not.toContain(companyBId);
    expect(message).not.toContain(orgBId);
  });

  it("User A cannot list companies of Org B", async () => {
    await expect(
      listCompaniesForOrganization(userAId, orgBId),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });

  it("requireCompanyAccess blocks cross-tenant without revealing payload", async () => {
    await expect(
      requireCompanyAccess(userAId, companyBId, "VIEWER"),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });

  it("User B can read own Company B", async () => {
    const company = await getCompanyForUser(userBId, companyBId);
    expect(company.id).toBe(companyBId);
  });
});
