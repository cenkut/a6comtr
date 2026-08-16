import type { QRCodeDto } from "@/modules/qr/qr.service";
import Link from "next/link";

export function QrPanel({
  qr,
  companyId,
  companySlug,
}: {
  qr: QRCodeDto;
  companyId: string;
  companySlug: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          QR önizleme
        </h2>
        <div className="mt-4 flex justify-center rounded-xl bg-zinc-50 p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/companies/${companyId}/qr/png`}
            alt="Şirket QR kodu"
            className="h-56 w-56"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/api/companies/${companyId}/qr/png`}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            QR PNG indir
          </a>
          <a
            href={`/api/companies/${companyId}/qr/svg`}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
          >
            QR SVG indir
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Kalıcı bağlantılar
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-zinc-500">QR public code</dt>
            <dd className="font-mono text-lg font-semibold tracking-wider text-zinc-900">
              {qr.publicCode}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">QR URL</dt>
            <dd className="break-all font-medium text-zinc-900">
              <Link href={`/q/${qr.publicCode}`} className="underline">
                {qr.publicUrl}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Profil URL</dt>
            <dd className="break-all">
              <Link href={`/c/${companySlug}`} className="underline">
                /c/{companySlug}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Tarama</dt>
            <dd className="font-medium text-zinc-900">
              {qr.scanCount} · Son:{" "}
              {qr.lastScannedAt
                ? new Date(qr.lastScannedAt).toLocaleString("tr-TR")
                : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-zinc-500">
          QR yalnızca <code className="rounded bg-zinc-100 px-1">/q/…</code>{" "}
          adresini taşır. Telefon, adres veya VKN değişse bile basılı QR
          güncellenmez — yeni bilgiler profilde görünür.
        </p>
      </section>
    </div>
  );
}
