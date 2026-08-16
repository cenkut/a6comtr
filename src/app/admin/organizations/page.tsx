import { listAdminOrganizations } from "@/modules/admin/admin.service";

export default async function AdminOrganizationsPage() {
  const orgs = await listAdminOrganizations();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
      <ul className="mt-6 space-y-3">
        {orgs.map((o) => (
          <li
            key={o.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm"
          >
            <p className="font-medium">{o.name}</p>
            <p className="text-zinc-500">
              /{o.slug} · {o._count.companies} şirket · {o._count.memberships}{" "}
              kullanıcı
              {o.subscription
                ? ` · ${o.subscription.packageCode} (${o.subscription.status})`
                : " · no subscription"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
