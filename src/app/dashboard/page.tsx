import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/modules/auth/session.service";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

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
          Giriş başarılı. Şirket ve organizasyon kurulumu bir sonraki adımda
          eklenecek.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Şirketim",
            "QR Kod",
            "Analitik",
            "Adresler",
            "Sosyal Medya",
            "Dokümanlar",
          ].map((label) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500"
            >
              <div className="font-medium text-zinc-900">{label}</div>
              <p className="mt-1">Yakında</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
