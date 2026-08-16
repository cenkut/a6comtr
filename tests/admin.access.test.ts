import { describe, expect, it } from "vitest";
import { isPlatformAdminUser } from "../src/modules/admin/admin.service";

describe("platform admin access", () => {
  it("allows flag-based admin", () => {
    expect(
      isPlatformAdminUser({
        email: "user@example.com",
        isPlatformAdmin: true,
      }),
    ).toBe(true);
  });

  it("denies regular user without allowlist match", () => {
    // PLATFORM_ADMIN_EMAILS may be empty in test env
    expect(
      isPlatformAdminUser({
        email: "nobody@example.com",
        isPlatformAdmin: false,
      }),
    ).toBe(false);
  });
});
