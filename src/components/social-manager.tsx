"use client";

import { FormEvent, useState } from "react";
import type { SocialLinkDto } from "@/modules/company/social.service";

const PLATFORMS = [
  "INSTAGRAM",
  "LINKEDIN",
  "FACEBOOK",
  "X",
  "YOUTUBE",
  "TIKTOK",
  "OTHER",
] as const;

export function SocialManager({
  companyId,
  initial,
}: {
  companyId: string;
  initial: SocialLinkDto[];
}) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    platform: "INSTAGRAM",
    label: "",
    url: "",
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/companies/${companyId}/social`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as {
      error?: string;
      socialLink?: SocialLinkDto;
    };
    if (!res.ok || !data.socialLink) {
      setError(data.error ?? "Eklenemedi.");
      return;
    }
    setItems((prev) => [...prev, data.socialLink!]);
    setForm({ platform: "INSTAGRAM", label: "", url: "" });
  }

  async function toggleVisible(item: SocialLinkDto) {
    const res = await fetch(`/api/social/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !item.isVisible }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { socialLink: SocialLinkDto };
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? data.socialLink : x)),
    );
  }

  async function onDelete(id: string) {
    const res = await fetch(`/api/social/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
            Henüz sosyal medya bağlantısı yok.
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-900">
                  {item.platform}
                  {item.label ? ` · ${item.label}` : ""}
                </p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block truncate text-sm text-zinc-600 underline"
                >
                  {item.url}
                </a>
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
        <h2 className="sm:col-span-2 text-sm font-semibold">Yeni Bağlantı</h2>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Platform</span>
          <select
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Etiket (opsiyonel)</span>
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>
        <label className="sm:col-span-2 block text-sm">
          <span className="mb-1 block font-medium">URL</span>
          <input
            required
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2"
            placeholder="https://instagram.com/..."
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
