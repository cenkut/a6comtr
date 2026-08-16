import type { MembershipRole } from "@prisma/client";

/** Higher number = more privilege. */
const ROLE_RANK: Record<MembershipRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function roleAtLeast(
  actual: MembershipRole,
  required: MembershipRole,
): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export function canManageMembers(role: MembershipRole): boolean {
  return roleAtLeast(role, "ADMIN");
}

export function canEditCompany(role: MembershipRole): boolean {
  return roleAtLeast(role, "EDITOR");
}

export function canPublishCompany(role: MembershipRole): boolean {
  return roleAtLeast(role, "ADMIN");
}

export function canDeleteCompany(role: MembershipRole): boolean {
  return roleAtLeast(role, "OWNER");
}
