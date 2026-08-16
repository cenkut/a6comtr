import { DashboardShell } from "@/components/dashboard-shell";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { db } from "@/lib/db";

export default async function DashboardTeamPage() {
  const { user, organizationId } = await requireDashboardContext();
  const members = await db.membership.findMany({
    where: { organizationId },
    include: {
      user: { select: { email: true, name: true, lastLoginAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell email={user.email} active="/dashboard/team">
      <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Organizasyon üyeleri. Davet akışı V1.1 için planlandı.
      </p>
      <ul className="mt-6 space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
          >
            <span className="font-medium">{m.user.email}</span>
            <span className="ml-2 text-zinc-500">{m.role}</span>
          </li>
        ))}
      </ul>
    </DashboardShell>
  );
}
