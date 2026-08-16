import {
  listAdminCompanies,
} from "@/modules/admin/admin.service";
import { CompanyStatusActions } from "@/components/admin-company-actions";

export default async function AdminCompaniesPage() {
  const companies = await listAdminCompanies();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Org</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">QR</th>
              <th className="px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-zinc-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-zinc-500">/c/{c.slug}</div>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {c.organization.name}
                </td>
                <td className="px-4 py-3 font-medium">{c.status}</td>
                <td className="px-4 py-3 tabular-nums">{c._count.qrCodes}</td>
                <td className="px-4 py-3">
                  <CompanyStatusActions
                    companyId={c.id}
                    status={c.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
