import { DashboardShell } from "@/components/dashboard-shell";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getOrCreateCompanyQr } from "@/modules/qr/qr.service";
import { QrPanel } from "@/components/qr-panel";

export default async function DashboardQrPage() {
  const { user, company } = await requireDashboardContext();
  const qr = await getOrCreateCompanyQr(user.id, company.id);

  return (
    <DashboardShell email={user.email} active="/dashboard/qr">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">QR Kod</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Kalıcı QR. Şirket bilgileri değişse bile bu kod çalışmaya devam eder.
        </p>
      </div>
      <QrPanel qr={qr} companyId={company.id} companySlug={company.slug} />
    </DashboardShell>
  );
}
