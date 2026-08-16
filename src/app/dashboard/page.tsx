import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/modules/auth/session.service";
import { LogoutButton } from "@/components/logout-button";
import { listOrganizationsForUser } from "@/modules/organization/organization.service";
import { listCompaniesForOrganization } from "@/modules/company/company.service";
import { userNeedsOnboarding } from "@/modules/onboarding/onboarding.service";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  if (await userNeedsOnboarding(session.user.id)) {
    redirect("/onboarding");
  }

  const organizations = await listOrganizationsForUser(session.user.id);
  const primaryOrg = organizations[0];
  const companies = primaryOrg
    ? await listCompaniesForOrganization(session.user.id, primaryOrg.id)
    : [];
  const primaryCompany = companies[0];

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold">
            A6
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-zinc-600 sm:inline">
              {session.user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-600">
          Organizasyon ve şirket özeti. Detay düzenleme bir sonraki adımda
          genişletilecek.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Organizasyon
            </h2>
            {primaryOrg ? (
              <div className="mt-3">
                <p className="text-lg font-semibold text-zinc-900">
                  {primaryOrg.name}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Rol: {primaryOrg.role} · {primaryOrg.companyCount} şirket ·{" "}
                  {primaryOrg.memberCount} kullanıcı
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-600">Organizasyon yok.</p>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Şirket
            </h2>
            {primaryCompany ? (
              <div className="mt-3">
                <p className="text-lg font-semibold text-zinc-900">
                  {primaryCompany.name}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Durum: {primaryCompany.status} · /c/{primaryCompany.slug}
                </p>
                {primaryCompany.primaryPhone ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    Tel: {primaryCompany.primaryPhone}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-600">
                Henüz şirket yok.{" "}
                <Link href="/onboarding" className="underline">
                  Oluştur
                </Link>
              </p>
            )}
          </section>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Şirketim", href: "/dashboard/company" },
            { label: "QR Kod", href: "/dashboard/qr" },
            { label: "Analitik", href: "/dashboard/analytics" },
            { label: "Adresler", href: "/dashboard/locations" },
            { label: "Sosyal Medya", href: "/dashboard/social" },
            { label: "Dokümanlar", href: "/dashboard/documents" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500"
            >
              <div className="font-medium text-zinc-900">{item.label}</div>
              <p className="mt-1">Yakında</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
