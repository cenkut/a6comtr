import { describe, expect, it } from "vitest";
import { getEntitlements } from "../src/modules/subscription/entitlements";

describe("getEntitlements", () => {
  it("applies trial defaults", () => {
    const e = getEntitlements(null, { companyCount: 0, userCount: 1 });
    expect(e.packageCode).toBe("TRIAL");
    expect(e.canCreateCompany).toBe(true);
    expect(e.canUseDocuments).toBe(false);
  });

  it("blocks company create at limit", () => {
    const e = getEntitlements(
      {
        packageCode: "BASIC",
        status: "ACTIVE",
        maxCompanies: 1,
        maxUsers: 5,
        expiresAt: null,
      },
      { companyCount: 1, userCount: 1 },
    );
    expect(e.canCreateCompany).toBe(false);
    expect(e.canInviteUser).toBe(true);
  });

  it("marks expired subscriptions inactive", () => {
    const e = getEntitlements(
      {
        packageCode: "BUSINESS",
        status: "ACTIVE",
        maxCompanies: 5,
        maxUsers: 20,
        expiresAt: new Date(Date.now() - 1000),
      },
      { companyCount: 0, userCount: 1 },
    );
    expect(e.isActive).toBe(false);
    expect(e.canCreateCompany).toBe(false);
    expect(e.status).toBe("EXPIRED");
  });
});
