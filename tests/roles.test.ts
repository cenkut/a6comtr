import { describe, expect, it } from "vitest";
import {
  canEditCompany,
  canManageMembers,
  canPublishCompany,
  roleAtLeast,
} from "../src/modules/authz/roles";

describe("membership roles", () => {
  it("ranks roles correctly", () => {
    expect(roleAtLeast("OWNER", "ADMIN")).toBe(true);
    expect(roleAtLeast("ADMIN", "EDITOR")).toBe(true);
    expect(roleAtLeast("EDITOR", "VIEWER")).toBe(true);
    expect(roleAtLeast("VIEWER", "EDITOR")).toBe(false);
    expect(roleAtLeast("EDITOR", "ADMIN")).toBe(false);
  });

  it("gates capabilities", () => {
    expect(canEditCompany("EDITOR")).toBe(true);
    expect(canEditCompany("VIEWER")).toBe(false);
    expect(canPublishCompany("ADMIN")).toBe(true);
    expect(canPublishCompany("EDITOR")).toBe(false);
    expect(canManageMembers("ADMIN")).toBe(true);
    expect(canManageMembers("EDITOR")).toBe(false);
  });
});
