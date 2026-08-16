"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyAdminDto } from "@/modules/company/company.service";

export function CompanyForm({ company }: { company: CompanyAdminDto }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: company.name,
    legalName: company.legalName ?? "",
    shortDescription: company.shortDescription ?? "",
    about: company.about ?? "",
    sector: company.sector ?? "",
    foundedYear: company.foundedYear?.toString() ?? "",
    website: company.website ?? "",
    primaryEmail: company.primaryEmail ?? "",
    primaryPhone: company.primaryPhone ?? "",
    whatsappPhone: company.whatsappPhone ?? "",
    taxOffice: company.taxOffice ?? "",
    taxNumber: company.taxNumber ?? "",
    mersisNumber: company.mersisNumber ?? "",
    tradeRegistryNumber: company.tradeRegistryNumber ?? "",
    taxNumberVisible: company.taxNumberVisible,
    mersisVisible: company.mersisVisible,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          legalName: form.legalName || null,
          shortDescription: form.shortDescription || null,
          about: form.about || null,
          sector: form.sector || null,
          foundedYear: form.foundedYear ? Number(form.foundedYear) : null,
          website: form.website || null,
          primaryEmail: form.primaryEmail || null,
          primaryPhone: form.primaryPhone || null,
          whatsappPhone: form.whatsappPhone || null,
          taxOffice: form.taxOffice || null,
          taxNumber: form.taxNumber || null,
          mersisNumber: form.mersisNumber || null,
          tradeRegistryNumber: form.tradeRegistryNumber || null,
          taxNumberVisible: form.taxNumberVisible,
          mersisVisible: form.mersisVisible,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kaydedilemedi.");
        return;
      }
      setSuccess("Kaydedildi.");
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  async function onPublish() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${company.id}/publish`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Yayınlanamadı.");
        return;
      }
      setSuccess("Şirket kartı yayınlandı.");
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Temel Bilgiler
        </h2>
        <Field label="Şirket / Marka Adı" value={form.name} onChange={(v) => set("name", v)} required />
        <Field label="Ticari Ünvan" value={form.legalName} onChange={(v) => set("legalName", v)} />
        <Field label="Sektör" value={form.sector} onChange={(v) => set("sector", v)} />
        <Field label="Kuruluş Yılı" value={form.foundedYear} onChange={(v) => set("foundedYear", v)} />
        <div className="sm:col-span-2">
          <Field
            label="Kısa Açıklama"
            value={form.shortDescription}
            onChange={(v) => set("shortDescription", v)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-800">Hakkında</span>
            <textarea
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none ring-zinc-900 focus:ring-2"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          İletişim
        </h2>
        <Field label="Telefon" value={form.primaryPhone} onChange={(v) => set("primaryPhone", v)} />
        <Field label="WhatsApp" value={form.whatsappPhone} onChange={(v) => set("whatsappPhone", v)} />
        <Field label="E-posta" value={form.primaryEmail} onChange={(v) => set("primaryEmail", v)} />
        <Field label="Web Sitesi" value={form.website} onChange={(v) => set("website", v)} />
      </section>

      <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Kurumsal Bilgiler
        </h2>
        <Field label="Vergi Dairesi" value={form.taxOffice} onChange={(v) => set("taxOffice", v)} />
        <Field label="VKN" value={form.taxNumber} onChange={(v) => set("taxNumber", v)} />
        <Field label="MERSİS" value={form.mersisNumber} onChange={(v) => set("mersisNumber", v)} />
        <Field
          label="Ticaret Sicil No"
          value={form.tradeRegistryNumber}
          onChange={(v) => set("tradeRegistryNumber", v)}
        />
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={form.taxNumberVisible}
            onChange={(e) => set("taxNumberVisible", e.target.checked)}
          />
          VKN public profilde görünsün
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={form.mersisVisible}
            onChange={(e) => set("mersisVisible", e.target.checked)}
          />
          MERSİS public profilde görünsün
        </label>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {loading ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {company.status !== "ACTIVE" ? (
          <button
            type="button"
            onClick={onPublish}
            disabled={loading}
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-60"
          >
            Yayınla
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-800">{label}</span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none ring-zinc-900 focus:ring-2"
      />
    </label>
  );
}
