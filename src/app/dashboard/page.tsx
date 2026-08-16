import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireDashboardContext } from "@/lib/dashboard-context";

export default async function DashboardPage() {
  const { user, company } = await requireDashboardContext();

  return (
    <DashboardShell email={user.email} active="/dashboard">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Dashboard
      </h1>
      <p className="mt-2 text-zinc-600">
        Şirket durumunuz ve hızlı bağlantılar.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Hızlı işlemler
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="underline" href="/dashboard/company">
                Şirket bilgilerini düzenle
              </Link>
            </li>
            <li>
              <Link className="underline" href="/dashboard/locations">
                Adres ekle
              </Link>
            </li>
            <li>
              <Link className="underline" href="/dashboard/social">
                Sosyal medya ekle
              </Link>
            </li>
            <li>
              <Link className="underline" href="/dashboard/custom-fields">
                Özel alan ekle
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </DashboardShell>
  );
}
