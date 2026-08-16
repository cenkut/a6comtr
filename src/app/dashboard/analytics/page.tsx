import { DashboardShell } from "@/components/dashboard-shell";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getCompanyMetrics } from "@/modules/analytics/analytics.service";

export default async function DashboardAnalyticsPage() {
  const { user, company } = await requireDashboardContext();
  const metrics = await getCompanyMetrics(user.id, company.id);

  const rows = [
    { label: "QR Scan", m: metrics.qrScan },
    { label: "Profile View", m: metrics.profileView },
    { label: "Phone Click", m: metrics.phoneClick },
    { label: "WhatsApp Click", m: metrics.whatsappClick },
    { label: "Website Click", m: metrics.websiteClick },
    { label: "Directions Click", m: metrics.directionsClick },
    { label: "vCard Download", m: metrics.vcardDownload },
    { label: "Action Clicks (all)", m: metrics.actionClicks },
  ];

  return (
    <DashboardShell email={user.email} active="/dashboard/analytics">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analitik</h1>
        <p className="mt-1 text-sm text-zinc-600">
          QR taramaları ve profil etkileşimleri (gizlilik odaklı, IP saklanmaz).
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Metrik</th>
              <th className="px-4 py-3 font-medium">Today</th>
              <th className="px-4 py-3 font-medium">Last 7 Days</th>
              <th className="px-4 py-3 font-medium">Last 30 Days</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {row.label}
                </td>
                <td className="px-4 py-3 tabular-nums">{row.m.today}</td>
                <td className="px-4 py-3 tabular-nums">{row.m.last7Days}</td>
                <td className="px-4 py-3 tabular-nums">{row.m.last30Days}</td>
                <td className="px-4 py-3 tabular-nums font-semibold">
                  {row.m.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
