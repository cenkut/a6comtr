import { DashboardShell } from "@/components/dashboard-shell";
import { LocationsManager } from "@/components/locations-manager";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { listLocations } from "@/modules/company/location.service";

export default async function DashboardLocationsPage() {
  const { user, company } = await requireDashboardContext();
  const locations = await listLocations(user.id, company.id);

  return (
    <DashboardShell email={user.email} active="/dashboard/locations">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Adresler</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Merkez, şube, depo ve diğer lokasyonlar.
        </p>
      </div>
      <LocationsManager companyId={company.id} initial={locations} />
    </DashboardShell>
  );
}
