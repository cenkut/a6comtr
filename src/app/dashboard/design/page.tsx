import { DashboardShell } from "@/components/dashboard-shell";
import { DesignManager } from "@/components/design-manager";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getDesign } from "@/modules/design/design.service";

export default async function DashboardDesignPage() {
  const { user, company } = await requireDashboardContext();
  const design = await getDesign(user.id, company.id);

  return (
    <DashboardShell email={user.email} active="/dashboard/design">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Kart Tasarımı</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Renkler, logo şekli, bölüm görünürlüğü ve sıralama.
        </p>
      </div>
      <DesignManager
        companyId={company.id}
        initialTheme={design.theme}
        initialSections={design.sections}
      />
    </DashboardShell>
  );
}
