import { DashboardShell } from "@/components/dashboard-shell";
import { requireDashboardContext } from "@/lib/dashboard-context";

export default async function DashboardDocumentsPage() {
  const { user } = await requireDashboardContext();

  return (
    <DashboardShell email={user.email} active="/dashboard/documents">
      <h1 className="text-2xl font-semibold tracking-tight">Dokümanlar</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Katalog, fiyat listesi ve sertifika yükleme bir sonraki iterasyonda
        tamamlanacak. Yükleme güvenliği (MIME, boyut, uzantı) altyapısı hazır.
      </p>
      <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
        PDF yükleme yakında · max boyut env: UPLOAD_MAX_SIZE_MB
      </div>
    </DashboardShell>
  );
}
