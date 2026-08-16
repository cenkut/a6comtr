type Props = { params: Promise<{ kind: string }> };

const COPY: Record<string, { title: string; body: string }> = {
  "not-found": {
    title: "QR bulunamadı",
    body: "Bu QR kod sistemde kayıtlı değil veya geçersiz.",
  },
  disabled: {
    title: "QR pasif",
    body: "Bu QR kod şu anda devre dışı.",
  },
  draft: {
    title: "Şirket kartı henüz yayınlanmamış",
    body: "Bu QR ile ilişkili kart henüz herkese açık değil.",
  },
  suspended: {
    title: "Şirket kartı geçici olarak pasif",
    body: "Bu dijital kartvizit şu anda erişime kapalı.",
  },
};

export default async function QrStatusPage({ params }: Props) {
  const { kind } = await params;
  const copy = COPY[kind] ?? COPY["not-found"]!;

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold tracking-wide text-zinc-400">A6</p>
      <h1 className="mt-4 text-xl font-semibold text-zinc-900">{copy.title}</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-600">{copy.body}</p>
    </div>
  );
}
