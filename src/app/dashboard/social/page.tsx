import { DashboardShell } from "@/components/dashboard-shell";
import { SocialManager } from "@/components/social-manager";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { listSocialLinks } from "@/modules/company/social.service";

export default async function DashboardSocialPage() {
  const { user, company } = await requireDashboardContext();
  const socialLinks = await listSocialLinks(user.id, company.id);

  return (
    <DashboardShell email={user.email} active="/dashboard/social">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sosyal Medya</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Instagram, LinkedIn ve diğer platform bağlantıları.
        </p>
      </div>
      <SocialManager companyId={company.id} initial={socialLinks} />
    </DashboardShell>
  );
}
