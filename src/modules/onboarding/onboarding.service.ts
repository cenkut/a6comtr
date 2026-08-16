import { db } from "@/lib/db";
import { createOrganization } from "@/modules/organization/organization.service";
import { createCompany } from "@/modules/company/company.service";
import type { CompanyAdminDto } from "@/modules/company/company.service";

/**
 * First-login onboarding: create organization (OWNER) + first company in one step.
 */
export async function completeOnboarding(input: {
  userId: string;
  companyName: string;
  legalName?: string | null;
  sector?: string | null;
  primaryPhone?: string | null;
  website?: string | null;
}): Promise<{
  organization: { id: string; name: string; slug: string };
  company: CompanyAdminDto;
}> {
  const existing = await db.membership.count({
    where: { userId: input.userId },
  });

  // If user already has an org, still allow company under a new org named after company.
  // Simpler V1: always create a new organization for this onboarding action.
  void existing;

  const organization = await createOrganization({
    userId: input.userId,
    name: input.companyName,
  });

  const company = await createCompany({
    userId: input.userId,
    organizationId: organization.id,
    name: input.companyName,
    legalName: input.legalName,
    sector: input.sector,
    primaryPhone: input.primaryPhone,
    website: input.website,
  });

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    company,
  };
}

export async function userNeedsOnboarding(userId: string): Promise<boolean> {
  const count = await db.membership.count({ where: { userId } });
  return count === 0;
}
