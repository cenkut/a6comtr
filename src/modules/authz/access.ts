import type { Company, Membership, MembershipRole, Organization } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { roleAtLeast } from "@/modules/authz/roles";

export type MembershipWithOrg = Membership & {
  organization: Organization;
};

/**
 * Require membership in organization. Returns 404 (not 403) when the org
 * does not exist OR the user is not a member — reduces tenant enumeration.
 */
export async function requireOrganizationAccess(
  userId: string,
  organizationId: string,
  minRole: MembershipRole = "VIEWER",
): Promise<MembershipWithOrg> {
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    include: { organization: true },
  });

  if (!membership) {
    throw new AppError("NOT_FOUND", "Kayıt bulunamadı.", 404);
  }

  if (!roleAtLeast(membership.role, minRole)) {
    throw new AppError(
      "FORBIDDEN",
      "Bu işlem için yetkiniz yok.",
      403,
    );
  }

  return membership;
}

/**
 * Require access to a company via its organization membership.
 * Cross-tenant access always yields 404 with no company payload.
 */
export async function requireCompanyAccess(
  userId: string,
  companyId: string,
  minRole: MembershipRole = "VIEWER",
): Promise<{
  company: Company;
  membership: MembershipWithOrg;
}> {
  const company = await db.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new AppError("NOT_FOUND", "Kayıt bulunamadı.", 404);
  }

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: company.organizationId,
      },
    },
    include: { organization: true },
  });

  if (!membership) {
    // Do not reveal that the company exists in another tenant.
    throw new AppError("NOT_FOUND", "Kayıt bulunamadı.", 404);
  }

  if (!roleAtLeast(membership.role, minRole)) {
    throw new AppError(
      "FORBIDDEN",
      "Bu işlem için yetkiniz yok.",
      403,
    );
  }

  return { company, membership };
}
