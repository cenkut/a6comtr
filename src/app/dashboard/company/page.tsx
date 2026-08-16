import { DashboardShell } from "@/components/dashboard-shell";
import { CompanyForm } from "@/components/company-form";
import { requireDashboardContext } from "@/lib/dashboard-context";

export default async function DashboardCompanyPage() {
  const { user, company } = await requireDashboardContext();

  return (
    <DashboardShell email={user.email} active="/dashboard/company">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Şirketim</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Durum: <span className="font-medium">{company.status}</span> · Public:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
            /c/{company.slug}
          </code>
        </p>
      </div>
      <CompanyForm company={company} />
    </DashboardShell>
  );
}
