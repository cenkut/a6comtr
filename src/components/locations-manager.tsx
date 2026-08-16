"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { LocationDto } from "@/modules/company/location.service";

const TYPES = [
  { value: "HEADQUARTERS", label: "Merkez" },
  { value: "BRANCH", label: "Şube" },
  { value: "STORE", label: "Mağaza" },
  { value: "WAREHOUSE", label: "Depo" },
  { value: "FACTORY", label: "Fabrika" },
  { value: "SERVICE", label: "Servis" },
  { value: "OTHER", label: "Diğer" },
] as const;

export function LocationsManager({
  companyId,
  initial,
}: {
  companyId: string;
  initial: LocationDto[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "HEADQUARTERS",
    name: "",
    addressLine: "",
    city: "",
    district: "",
    phone: "",
    contactPersonName: "",
    contactPersonPhone: "",
    workingHours: "",
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/companies/${companyId}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as {
      error?: string;
      location?: LocationDto;
    };
    if (!res.ok || !data.location) {
      setError(data.error ?? "Eklenemedi.");
      return;
    }
    setItems((prev) => [...prev, data.location!]);
    setForm({
      type: "HEADQUARTERS",
      name: "",
      addressLine: "",
      city: "",
      district: "",
      phone: "",
      contactPersonName: "",
      contactPersonPhone: "",
      workingHours: "",
    });
    router.refresh();
  }

  async function toggleVisible(item: LocationDto) {
    const res = await fetch(`/api/locations/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !item.isVisible }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { location: LocationDto };
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? data.location : x)),
    );
  }

  async function onDelete(id: string) {
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
            Henüz adres yok.
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900">{item.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{item.type}</p>
                  {item.addressLine ? (
                    <p className="mt-2 text-sm text-zinc-600">
                      {item.addressLine}
                      {item.district ? `, ${item.district}` : ""}
                      {item.city ? ` / ${item.city}` : ""}
                    </p>
                  ) : null}
                  {item.contactPersonName ? (
                    <p className="mt-1 text-sm text-zinc-600">
                      Sorumlu: {item.contactPersonName}
                      {item.contactPersonPhone
                        ? ` · ${item.contactPersonPhone}`
                        : ""}
                    </p>
                  ) : null}
                  {item.workingHours ? (
                    <p className="mt-1 text-sm text-zinc-600">
                      Çalışma: {item.workingHours}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => toggleVisible(item)}
                    className="rounded-lg border px-2 py-1"
                  >
                    {item.isVisible ? "Görünür" : "Gizli"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-red-700"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-sm font-semibold text-zinc-900">
          Yeni Adres
        </h2>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Tip</span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Ad</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
            placeholder="Bursa Deposu"
          />
        </label>
        <label className="sm:col-span-2 block text-sm">
          <span className="mb-1 block font-medium">Adres</span>
          <input
            value={form.addressLine}
            onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">İlçe</span>
          <input
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Şehir</span>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Telefon</span>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Çalışma Saatleri</span>
          <input
            value={form.workingHours}
            onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
            placeholder="08:30 - 18:00"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Sorumlu</span>
          <input
            value={form.contactPersonName}
            onChange={(e) =>
              setForm({ ...form, contactPersonName: e.target.value })
            }
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Sorumlu Telefon</span>
          <input
            value={form.contactPersonPhone}
            onChange={(e) =>
              setForm({ ...form, contactPersonPhone: e.target.value })
            }
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>
        {error ? (
          <p className="sm:col-span-2 text-sm text-red-700">{error}</p>
        ) : null}
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
          >
            Adres Ekle
          </button>
        </div>
      </form>
    </div>
  );
}
