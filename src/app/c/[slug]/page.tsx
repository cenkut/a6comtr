import type { Metadata } from "next";
import { PublicCompanyCard } from "@/components/public-company-card";
import { getPublicProfileBySlug } from "@/modules/company/public-profile.service";
import { env } from "@/lib/env";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicProfileBySlug(slug);

  if (result.kind !== "ok") {
    return {
      title: "Şirket kartı bulunamadı",
      robots: { index: false, follow: false },
    };
  }

  const { profile } = result;
  const title = `${profile.name} | A6 Dijital Kartvizit`;
  const description =
    profile.shortDescription ||
    `${profile.name} dijital şirket kartviziti — A6`;

  return {
    title,
    description,
    alternates: {
      canonical: `${env.APP_URL}/c/${profile.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${env.APP_URL}/c/${profile.slug}`,
      type: "website",
      images: profile.logoUrl ? [{ url: profile.logoUrl }] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PublicCompanyPage({ params }: Props) {
  const { slug } = await params;
  const result = await getPublicProfileBySlug(slug);

  if (result.kind === "not_found" || result.kind === "archived") {
    return (
      <StatusScreen
        title="Şirket kartı bulunamadı"
        body="Bu bağlantıya ait bir dijital kartvizit yok."
      />
    );
  }

  if (result.kind === "draft") {
    return (
      <StatusScreen
        title="Şirket kartı henüz yayınlanmamış"
        body="Bu şirket kartı henüz herkese açık değil."
      />
    );
  }

  if (result.kind === "suspended") {
    return (
      <StatusScreen
        title="Şirket kartı geçici olarak pasif"
        body="Bu dijital kartvizit şu anda erişime kapalı."
      />
    );
  }

  return <PublicCompanyCard profile={result.profile} />;
}

function StatusScreen({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold tracking-wide text-zinc-400">A6</p>
      <h1 className="mt-4 text-xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-600">{body}</p>
    </div>
  );
}
