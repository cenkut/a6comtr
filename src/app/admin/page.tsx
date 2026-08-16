import {
  getAdminOverview,
} from "@/modules/admin/admin.service";

export default async function AdminHomePage() {
  const overview = await getAdminOverview();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Platform özeti</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(overview.counts).map(([key, value]) => (
          <div
            key={key}
            className="rounded-2xl border border-zinc-200 bg-white p-4"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {key}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Son audit kayıtları
        </h2>
        <ul className="mt-3 divide-y divide-zinc-100 text-sm">
          {overview.recentAudits.length === 0 ? (
            <li className="py-3 text-zinc-500">Henüz kayıt yok.</li>
          ) : (
            overview.recentAudits.map((log) => (
              <li key={log.id} className="flex justify-between gap-3 py-2">
                <span>
                  <span className="font-medium">{log.action}</span>
                  {log.actor?.email ? (
                    <span className="text-zinc-500"> · {log.actor.email}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-zinc-400">
                  {new Date(log.createdAt).toLocaleString("tr-TR")}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
