import type { PublicCompanyProfile } from "@/modules/company/public-profile.service";
import {
  formatDirectionsUrl,
  formatMailtoUrl,
  formatTelUrl,
  formatWhatsAppUrl,
} from "@/modules/company/public-profile.service";
import type { ProfileSectionKey } from "@prisma/client";
import { AnalyticsBeacon } from "@/components/analytics-beacon";

export function PublicCompanyCard({
  profile,
}: {
  profile: PublicCompanyProfile;
}) {
  const { theme } = profile;
  const enabled = new Set(
    profile.sections.filter((s) => s.enabled).map((s) => s.key),
  );
  const ordered = [...profile.sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => s.key);

  const directionsTarget = profile.locations[0];
  const directionsUrl = directionsTarget
    ? formatDirectionsUrl(directionsTarget)
    : null;

  const actions: {
    label: string;
    href: string;
    external?: boolean;
    event: string;
  }[] = [];
  if (profile.primaryPhone) {
    actions.push({
      label: "Ara",
      href: formatTelUrl(profile.primaryPhone),
      event: "PHONE_CLICK",
    });
  }
  if (profile.whatsappPhone) {
    actions.push({
      label: "WhatsApp",
      href: formatWhatsAppUrl(profile.whatsappPhone),
      external: true,
      event: "WHATSAPP_CLICK",
    });
  }
  if (profile.primaryEmail) {
    actions.push({
      label: "E-posta",
      href: formatMailtoUrl(profile.primaryEmail),
      event: "EMAIL_CLICK",
    });
  }
  if (profile.website) {
    actions.push({
      label: "Web Sitesi",
      href: profile.website,
      external: true,
      event: "WEBSITE_CLICK",
    });
  }
  if (directionsUrl) {
    actions.push({
      label: "Yol Tarifi",
      href: directionsUrl,
      external: true,
      event: "DIRECTIONS_CLICK",
    });
  }
  actions.push({
    label: "Rehbere Kaydet",
    href: `/api/public/c/${profile.slug}/vcard`,
    event: "VCARD_DOWNLOAD",
  });

  const hasCompanyInfo =
    profile.taxNumber ||
    profile.mersisNumber ||
    profile.taxOffice ||
    profile.tradeRegistryNumber ||
    profile.legalName;

  const logoRadius =
    theme.logoShape === "CIRCLE"
      ? "9999px"
      : theme.logoShape === "ROUNDED"
        ? "16px"
        : "4px";

  function buttonStyle(): React.CSSProperties {
    if (theme.buttonStyle === "OUTLINE") {
      return {
        border: `1.5px solid ${theme.primaryColor}`,
        color: theme.primaryColor,
        backgroundColor: "transparent",
      };
    }
    if (theme.buttonStyle === "SOFT") {
      return {
        backgroundColor: `${theme.primaryColor}22`,
        color: theme.primaryColor,
      };
    }
    return {
      backgroundColor: theme.primaryColor,
      color: "#ffffff",
    };
  }

  const sectionNodes: Partial<Record<ProfileSectionKey, React.ReactNode>> = {
    HERO: (
      <div className="flex flex-col items-center text-center" key="HERO">
        {profile.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.logoUrl}
            alt={`${profile.name} logo`}
            className="h-20 w-20 border-4 border-white object-cover shadow-sm"
            style={{ borderRadius: logoRadius }}
          />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center border-4 border-white text-2xl font-semibold text-white shadow-sm"
            style={{
              borderRadius: logoRadius,
              backgroundColor: theme.primaryColor,
            }}
          >
            {profile.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {profile.name}
        </h1>
        {profile.shortDescription ? (
          <p className="mt-2 text-sm leading-relaxed opacity-80">
            {profile.shortDescription}
          </p>
        ) : null}
        {profile.sector ? (
          <p className="mt-1 text-xs font-medium uppercase tracking-wide opacity-50">
            {profile.sector}
          </p>
        ) : null}
      </div>
    ),
    QUICK_ACTIONS:
      actions.length > 0 ? (
        <div className="grid grid-cols-2 gap-2" key="QUICK_ACTIONS">
          {actions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              data-a6-event={action.event}
              {...(action.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="inline-flex h-11 items-center justify-center rounded-full px-3 text-sm font-medium transition"
              style={buttonStyle()}
            >
              {action.label}
            </a>
          ))}
        </div>
      ) : null,
    ABOUT: profile.about ? (
      <Section title="Hakkında" key="ABOUT">
        <p className="whitespace-pre-wrap text-sm leading-relaxed opacity-90">
          {profile.about}
        </p>
      </Section>
    ) : null,
    CONTACT:
      profile.primaryPhone ||
      profile.whatsappPhone ||
      profile.primaryEmail ||
      profile.website ? (
        <Section title="İletişim" key="CONTACT">
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
      ) : null,
    LOCATIONS:
      profile.locations.length > 0 ? (
        <Section title="Adresler" key="LOCATIONS">
          <ul className="space-y-4">
            {profile.locations.map((loc) => (
              <li key={loc.id} className="text-sm">
                <p className="font-medium">{loc.name}</p>
                {loc.addressLine ? (
                  <p className="mt-1 opacity-80">
                    {loc.addressLine}
                    {loc.district ? `, ${loc.district}` : ""}
                    {loc.city ? ` / ${loc.city}` : ""}
                  </p>
                ) : null}
                {loc.contactPersonName ? (
                  <p className="mt-1 opacity-80">
                    {loc.contactPersonName}
                    {loc.contactPersonPhone
                      ? ` · ${loc.contactPersonPhone}`
                      : ""}
                  </p>
                ) : null}
                {loc.workingHours ? (
                  <p className="mt-1 opacity-60">{loc.workingHours}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null,
    COMPANY_INFO: hasCompanyInfo ? (
      <Section title="Şirket Bilgileri" key="COMPANY_INFO">
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
            <Row label="Ticaret Sicil" value={profile.tradeRegistryNumber} />
          ) : null}
        </dl>
      </Section>
    ) : null,
    CUSTOM_FIELDS:
      profile.customFields.length > 0 ? (
        <Section title="Ek Bilgiler" key="CUSTOM_FIELDS">
          <dl className="space-y-2 text-sm">
            {profile.customFields.map((f) => (
              <Row key={f.id} label={f.label} value={f.value} />
            ))}
          </dl>
        </Section>
      ) : null,
    SOCIAL:
      profile.socialLinks.length > 0 ? (
        <Section title="Sosyal Medya" key="SOCIAL">
          <ul className="flex flex-wrap gap-2">
            {profile.socialLinks.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-full border px-3 py-1.5 text-xs font-medium"
                  style={{ borderColor: `${theme.primaryColor}44` }}
                >
                  {s.label || s.platform}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      ) : null,
    DOCUMENTS: null,
  };

  return (
    <div
      className="mx-auto min-h-full w-full max-w-md"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <AnalyticsBeacon slug={profile.slug} />
      {theme.showCover ? (
        profile.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.coverUrl}
            alt=""
            className="h-28 w-full object-cover"
          />
        ) : (
          <div
            className="h-16"
            style={{
              background: `linear-gradient(180deg, ${theme.primaryColor}22, transparent)`,
            }}
          />
        )
      ) : (
        <div className="h-6" />
      )}

      <div className="space-y-6 px-5 pb-10">
        {ordered.map((key) => {
          if (!enabled.has(key)) return null;
          return sectionNodes[key] ?? null;
        })}
        <p className="pt-4 text-center text-xs opacity-40">
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
    <section className="border-t border-black/5 pt-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider opacity-50">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-32 shrink-0 opacity-60">{label}</dt>
      <dd className="break-all font-medium">{value}</dd>
    </div>
  );
}
