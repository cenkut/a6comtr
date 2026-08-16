"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [sector, setSector] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          legalName: legalName || null,
          sector: sector || null,
          primaryPhone: primaryPhone || null,
          website: website || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Şirket oluşturulamadı.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="text-2xl font-semibold tracking-tight">
          A6
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-900">
          Şirketinizi Oluşturun
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Temel bilgileri girin. Detayları ve QR kodu dashboard üzerinden
          tamamlayabilirsiniz.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field
            label="Şirket / Marka Adı"
            required
            value={companyName}
            onChange={setCompanyName}
            placeholder="ProAltes"
          />
          <Field
            label="Ticari Ünvan"
            value={legalName}
            onChange={setLegalName}
            placeholder="ProAltes Yazılım A.Ş."
          />
          <Field
            label="Sektör"
            value={sector}
            onChange={setSector}
            placeholder="Yazılım"
          />
          <Field
            label="Telefon"
            value={primaryPhone}
            onChange={setPrimaryPhone}
            placeholder="+90 5xx xxx xx xx"
          />
          <Field
            label="Web Sitesi"
            value={website}
            onChange={setWebsite}
            placeholder="https://ornek.com"
          />

          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60"
          >
            {loading ? "Oluşturuluyor…" : "Şirketimi Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-800">
        {label}
      </span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none ring-zinc-900 placeholder:text-zinc-400 focus:ring-2"
      />
    </label>
  );
}
