import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/modules/auth/session.service";
import {
  isPlatformAdminUser,
  requirePlatformAdmin,
} from "@/modules/admin/admin.service";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  try {
    await requirePlatformAdmin(session.user);
  } catch {
    redirect("/dashboard");
  }

  // Type narrowing for unused check
  void isPlatformAdminUser;

  const nav = [
    { href: "/admin", label: "Özet" },
    { href: "/admin/organizations", label: "Organizations" },
    { href: "/admin/companies", label: "Companies" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/qr", label: "QR Codes" },
    { href: "/admin/subscriptions", label: "Subscriptions" },
    { href: "/admin/audit", label: "Audit Logs" },
  ];

  return (
    <div className="min-h-full bg-zinc-100">
      <header className="border-b border-zinc-200 bg-zinc-900 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold">
              A6 Admin
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-zinc-400 hover:text-white"
            >
              ← Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-300 sm:inline">
              {session.user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <nav className="lg:w-48">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
