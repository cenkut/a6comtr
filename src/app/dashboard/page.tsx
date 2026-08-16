import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getCompanyMetrics } from "@/modules/analytics/analytics.service";
import { getOrCreateCompanyQr } from "@/modules/qr/qr.service";

export default async function DashboardPage() {
  const { user, company } = await requireDashboardContext();
  const [metrics, qr] = await Promise.all([
    getCompanyMetrics(user.id, company.id),
    getOrCreateCompanyQr(user.id, company.id),
  ]);

  return (
    <DashboardShell email={user.email} active="/dashboard">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Dashboard
      </h1>
      <p className="mt-2 text-zinc-600">
        Şirket durumunuz, QR ve tarama özeti.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today scans" value={metrics.qrScan.today} />
        <StatCard label="7 day scans" value={metrics.qrScan.last7Days} />
        <StatCard label="30 day scans" value={metrics.qrScan.last30Days} />
        <StatCard label="Action clicks" value={metrics.actionClicks.total} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Company status
          </h2>
          <p className="mt-3 text-lg font-semibold text-zinc-900">
            {company.name}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Durum:{" "}
            <span className="font-medium text-zinc-900">{company.status}</span>
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Public:{" "}
            <Link
              href={`/c/${company.slug}`}
              className="font-medium underline"
            >
              /c/{company.slug}
            </Link>
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            QR:{" "}
            <Link href={`/q/${qr.publicCode}`} className="font-medium underline">
              /q/{qr.publicCode}
            </Link>
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            QR preview
          </h2>
          <div className="mt-3 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/companies/${company.id}/qr/png`}
              alt="QR"
              className="h-28 w-28 rounded-lg border border-zinc-100"
            />
            <div className="text-sm">
              <Link href="/dashboard/qr" className="font-medium underline">
                QR yönet
              </Link>
              <p className="mt-2 text-zinc-600">
                Toplam tarama: {qr.scanCount}
              </p>
              <Link
                href="/dashboard/analytics"
                className="mt-1 inline-block underline"
              >
                Analitiği gör
              </Link>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
        {value}
      </p>
    </div>
  );
}

