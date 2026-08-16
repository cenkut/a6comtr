import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/company", label: "Şirketim" },
  { href: "/dashboard/locations", label: "Adresler" },
  { href: "/dashboard/social", label: "Sosyal Medya" },
  { href: "/dashboard/custom-fields", label: "Özel Alanlar" },
  { href: "/dashboard/documents", label: "Dokümanlar" },
  { href: "/dashboard/design", label: "Kart Tasarımı" },
  { href: "/dashboard/qr", label: "QR Kod" },
  { href: "/dashboard/analytics", label: "Analitik" },
  { href: "/dashboard/team", label: "Kullanıcılar" },
] as const;

export function DashboardShell({
  email,
  active,
  children,
}: {
  email: string;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="text-lg font-semibold">
            A6
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-600 sm:inline">{email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <nav className="lg:w-52 lg:shrink-0">
          <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV.map((item) => {
              const isActive = active === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-zinc-900 font-medium text-white"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
