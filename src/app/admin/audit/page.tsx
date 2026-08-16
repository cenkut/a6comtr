import { listAuditLogs } from "@/modules/audit/audit.service";

export default async function AdminAuditPage() {
  const logs = await listAuditLogs(100);
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
      <ul className="mt-6 space-y-2">
        {logs.map((log) => (
          <li
            key={log.id}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
          >
            <div className="flex justify-between gap-3">
              <span className="font-medium">{log.action}</span>
              <span className="text-xs text-zinc-400">
                {new Date(log.createdAt).toLocaleString("tr-TR")}
              </span>
            </div>
            <p className="mt-1 text-zinc-600">
              {log.actor?.email ?? "system"}
              {log.organization ? ` · ${log.organization.name}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
