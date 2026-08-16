"use client";

import { FormEvent, useState } from "react";
import type { CustomFieldDto } from "@/modules/company/custom-field.service";

const TYPES = ["TEXT", "PHONE", "EMAIL", "URL", "NUMBER", "DATE"] as const;

export function CustomFieldsManager({
  companyId,
  initial,
}: {
  companyId: string;
  initial: CustomFieldDto[];
}) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "",
    value: "",
    type: "TEXT",
    section: "general",
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/companies/${companyId}/custom-fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as {
      error?: string;
      customField?: CustomFieldDto;
    };
    if (!res.ok || !data.customField) {
      setError(data.error ?? "Eklenemedi.");
      return;
    }
    setItems((prev) => [...prev, data.customField!]);
    setForm({ label: "", value: "", type: "TEXT", section: "general" });
  }

  async function toggleVisible(item: CustomFieldDto) {
    const res = await fetch(`/api/custom-fields/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !item.isVisible }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { customField: CustomFieldDto };
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? data.customField : x)),
    );
  }

  async function onDelete(id: string) {
    const res = await fetch(`/api/custom-fields/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
            Henüz özel alan yok. Örn: Yetkili Bayi Kodu, Teknik Destek.
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {item.type}
                </p>
                <p className="font-medium text-zinc-900">{item.label}</p>
                <p className="text-sm text-zinc-600">{item.value}</p>
              </div>
              <div className="flex gap-2 text-xs">
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
            </li>
          ))
        )}
      </ul>

      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-sm font-semibold">Yeni Özel Alan</h2>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Etiket</span>
          <input
            required
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
            placeholder="Yetkili Bayi Kodu"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Tip</span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2 block text-sm">
          <span className="mb-1 block font-medium">Değer</span>
          <input
            required
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
            placeholder="12345"
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
            Ekle
          </button>
        </div>
      </form>
    </div>
  );
}
