import { listAdminQrCodes } from "@/modules/admin/admin.service";

export default async function AdminQrPage() {
  const codes = await listAdminQrCodes();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">QR Codes</h1>
      <ul className="mt-6 space-y-2">
        {codes.map((q) => (
          <li
            key={q.id}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
          >
            <span className="font-mono font-semibold tracking-wider">
              {q.publicCode}
            </span>
            <span className="ml-2 text-zinc-600">
              → {q.company.name} ({q.company.status}) · scans {q.scanCount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
