import { listSubscriptions } from "@/modules/subscription/subscription.service";

export default async function AdminSubscriptionsPage() {
  const subs = await listSubscriptions();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
      <p className="mt-1 text-sm text-zinc-600">
        V1: ödeme yok — paket ve limit altyapısı hazır.
      </p>
      <ul className="mt-6 space-y-2">
        {subs.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
          >
            <span className="font-medium">{s.organization.name}</span>
            <span className="ml-2">
              {s.packageCode} · {s.status} · max {s.maxCompanies} şirket /{" "}
              {s.maxUsers} kullanıcı
            </span>
            <span className="ml-2 text-zinc-500">
              kullanım: {s.organization._count.companies}/
              {s.organization._count.memberships}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
