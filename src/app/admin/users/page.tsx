import { listAdminUsers } from "@/modules/admin/admin.service";

export default async function AdminUsersPage() {
  const users = await listAdminUsers();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <ul className="mt-6 space-y-2">
        {users.map((u) => (
          <li
            key={u.id}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
          >
            <span className="font-medium">{u.email}</span>
            {u.isPlatformAdmin ? (
              <span className="ml-2 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white">
                ADMIN
              </span>
            ) : null}
            <span className="ml-2 text-zinc-500">
              {u._count.memberships} org · {u._count.sessions} session
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
