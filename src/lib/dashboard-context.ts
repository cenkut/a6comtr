import { redirect } from "next/navigation";
import { getCurrentSession } from "@/modules/auth/session.service";
import { listOrganizationsForUser } from "@/modules/organization/organization.service";
import { listCompaniesForOrganization } from "@/modules/company/company.service";
import { userNeedsOnboarding } from "@/modules/onboarding/onboarding.service";
import type { CompanyAdminDto } from "@/modules/company/company.service";
import type { SessionUser } from "@/modules/auth/session.service";

export async function requireDashboardContext(): Promise<{
  user: SessionUser;
  organizationId: string;
  company: CompanyAdminDto;
}> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  if (await userNeedsOnboarding(session.user.id)) {
    redirect("/onboarding");
  }

  const orgs = await listOrganizationsForUser(session.user.id);
  const org = orgs[0];
  if (!org) redirect("/onboarding");

  const companies = await listCompaniesForOrganization(
    session.user.id,
    org.id,
  );
  const company = companies[0];
  if (!company) redirect("/onboarding");

  return {
    user: session.user,
    organizationId: org.id,
    company,
  };
}
