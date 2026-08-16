import type { PublicCompanyProfile } from "@/modules/company/public-profile.service";
import {
  formatDirectionsUrl,
  formatMailtoUrl,
  formatTelUrl,
  formatWhatsAppUrl,
} from "@/modules/company/public-profile.service";

export function PublicCompanyCard({
  profile,
}: {
  profile: PublicCompanyProfile;
}) {
  const directionsTarget = profile.locations[0];
  const directionsUrl = directionsTarget
    ? formatDirectionsUrl(directionsTarget)
    : null;

  const actions: { label: string; href: string; external?: boolean }[] = [];
  if (profile.primaryPhone) {
    actions.push({ label: "Ara", href: formatTelUrl(profile.primaryPhone) });
  }
  if (profile.whatsappPhone) {
    actions.push({
      label: "WhatsApp",
      href: formatWhatsAppUrl(profile.whatsappPhone),
      external: true,
    });
  }
  if (profile.primaryEmail) {
    actions.push({
      label: "E-posta",
      href: formatMailtoUrl(profile.primaryEmail),
    });
  }
  if (profile.website) {
    actions.push({
      label: "Web Sitesi",
      href: profile.website,
      external: true,
    });
  }
  if (directionsUrl) {
    actions.push({
      label: "Yol Tarifi",
      href: directionsUrl,
      external: true,
    });
  }
  actions.push({
    label: "Rehbere Kaydet",
    href: `/api/public/c/${profile.slug}/vcard`,
  });

  const hasCompanyInfo =
    profile.taxNumber ||
    profile.mersisNumber ||
    profile.taxOffice ||
    profile.tradeRegistryNumber ||
    profile.legalName;

  return (
    <div className="mx-auto min-h-full w-full max-w-md bg-white text-zinc-900">
      {profile.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.coverUrl}
          alt=""
          className="h-28 w-full object-cover"
        />
      ) : (
        <div className="h-16 bg-gradient-to-b from-zinc-100 to-white" />
      )}

      <div className="px-5 pb-10">
        <div className="-mt-8 flex flex-col items-center text-center">
          {profile.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logoUrl}
              alt={`${profile.name} logo`}
              className="h-20 w-20 rounded-2xl border-4 border-white bg-white object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-zinc-900 text-2xl font-semibold text-white shadow-sm">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {profile.name}
          </h1>
          {profile.shortDescription ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              {profile.shortDescription}
            </p>
          ) : null}
          {profile.sector ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
              {profile.sector}
            </p>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                {...(action.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-3 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                {action.label}
              </a>
            ))}
          </div>
        ) : null}

        {profile.about ? (
          <Section title="Hakkında">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {profile.about}
            </p>
          </Section>
        ) : null}

        {(profile.primaryPhone ||
          profile.whatsappPhone ||
          profile.primaryEmail ||
          profile.website) && (
          <Section title="İletişim">
            <dl className="space-y-2 text-sm">
              {profile.primaryPhone ? (
                <Row label="Telefon" value={profile.primaryPhone} />
              ) : null}
              {profile.whatsappPhone ? (
                <Row label="WhatsApp" value={profile.whatsappPhone} />
              ) : null}
              {profile.primaryEmail ? (
                <Row label="E-posta" value={profile.primaryEmail} />
              ) : null}
              {profile.website ? (
                <Row label="Web" value={profile.website} />
              ) : null}
            </dl>
          </Section>
        )}

        {profile.locations.length > 0 ? (
          <Section title="Adresler">
            <ul className="space-y-4">
              {profile.locations.map((loc) => (
                <li key={loc.id} className="text-sm">
                  <p className="font-medium text-zinc-900">{loc.name}</p>
                  {loc.addressLine ? (
                    <p className="mt-1 text-zinc-600">
                      {loc.addressLine}
                      {loc.district ? `, ${loc.district}` : ""}
                      {loc.city ? ` / ${loc.city}` : ""}
                    </p>
                  ) : null}
                  {loc.contactPersonName ? (
                    <p className="mt-1 text-zinc-600">
                      {loc.contactPersonName}
                      {loc.contactPersonPhone
                        ? ` · ${loc.contactPersonPhone}`
                        : ""}
                    </p>
                  ) : null}
                  {loc.workingHours ? (
                    <p className="mt-1 text-zinc-500">{loc.workingHours}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {hasCompanyInfo ? (
          <Section title="Şirket Bilgileri">
            <dl className="space-y-2 text-sm">
              {profile.legalName ? (
                <Row label="Ticari Ünvan" value={profile.legalName} />
              ) : null}
              {profile.taxOffice ? (
                <Row label="Vergi Dairesi" value={profile.taxOffice} />
              ) : null}
              {profile.taxNumber ? (
                <Row label="VKN" value={profile.taxNumber} />
              ) : null}
              {profile.mersisNumber ? (
                <Row label="MERSİS" value={profile.mersisNumber} />
              ) : null}
              {profile.tradeRegistryNumber ? (
                <Row
                  label="Ticaret Sicil"
                  value={profile.tradeRegistryNumber}
                />
              ) : null}
            </dl>
          </Section>
        ) : null}

        {profile.customFields.length > 0 ? (
          <Section title="Ek Bilgiler">
            <dl className="space-y-2 text-sm">
              {profile.customFields.map((f) => (
                <Row key={f.id} label={f.label} value={f.value} />
              ))}
            </dl>
          </Section>
        ) : null}

        {profile.socialLinks.length > 0 ? (
          <Section title="Sosyal Medya">
            <ul className="flex flex-wrap gap-2">
              {profile.socialLinks.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                  >
                    {s.label || s.platform}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <p className="mt-10 text-center text-xs text-zinc-400">
          Powered by A6 · a6.com.tr
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 border-t border-zinc-100 pt-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-32 shrink-0 text-zinc-500">{label}</dt>
      <dd className="break-all font-medium text-zinc-900">{value}</dd>
    </div>
  );
}
