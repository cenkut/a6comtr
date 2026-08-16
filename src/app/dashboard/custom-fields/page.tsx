import { DashboardShell } from "@/components/dashboard-shell";
import { CustomFieldsManager } from "@/components/custom-fields-manager";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { listCustomFields } from "@/modules/company/custom-field.service";

export default async function DashboardCustomFieldsPage() {
  const { user, company } = await requireDashboardContext();
  const customFields = await listCustomFields(user.id, company.id);

  return (
    <DashboardShell email={user.email} active="/dashboard/custom-fields">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Özel Alanlar</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Standart kartvizit alanları dışında kurumsal bilgiler.
        </p>
      </div>
      <CustomFieldsManager companyId={company.id} initial={customFields} />
    </DashboardShell>
  );
}
