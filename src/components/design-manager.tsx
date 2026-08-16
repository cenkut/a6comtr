"use client";

import { useState } from "react";
import type { SectionDto, ThemeDto } from "@/modules/design/design.service";
import { PRESET_THEMES } from "@/modules/design/design.constants";

const SECTION_LABELS: Record<string, string> = {
  HERO: "Hero",
  QUICK_ACTIONS: "Hızlı Aksiyonlar",
  ABOUT: "Hakkında",
  CONTACT: "İletişim",
  LOCATIONS: "Adresler",
  COMPANY_INFO: "Şirket Bilgileri",
  CUSTOM_FIELDS: "Özel Alanlar",
  SOCIAL: "Sosyal Medya",
  DOCUMENTS: "Dokümanlar",
};

export function DesignManager({
  companyId,
  initialTheme,
  initialSections,
}: {
  companyId: string;
  initialTheme: ThemeDto;
  initialSections: SectionDto[];
}) {
  const [theme, setTheme] = useState(initialTheme);
  const [sections, setSections] = useState(
    [...initialSections].sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(nextTheme = theme, nextSections = sections) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/design`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: nextTheme, sections: nextSections }),
      });
      const data = (await res.json()) as {
        error?: string;
        theme?: ThemeDto;
        sections?: SectionDto[];
      };
      if (!res.ok) {
        setError(data.error ?? "Kaydedilemedi.");
        return;
      }
      if (data.theme) setTheme(data.theme);
      if (data.sections) {
        setSections(
          [...data.sections].sort((a, b) => a.sortOrder - b.sortOrder),
        );
      }
      setMessage("Tasarım kaydedildi.");
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index]!;
    next[index] = next[target]!;
    next[target] = tmp;
    const renumbered = next.map((s, i) => ({ ...s, sortOrder: i }));
    setSections(renumbered);
  }

  function applyPreset(id: string) {
    const preset = PRESET_THEMES.find((p) => p.id === id);
    if (!preset) return;
    const next: ThemeDto = {
      primaryColor: preset.primaryColor,
      backgroundColor: preset.backgroundColor,
      textColor: preset.textColor,
      buttonStyle: preset.buttonStyle,
      logoShape: preset.logoShape,
      showCover: preset.showCover,
    };
    setTheme(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Hazır temalar
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_THEMES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Renkler
          </h2>
          <ColorField
            label="Birincil"
            value={theme.primaryColor}
            onChange={(v) => setTheme({ ...theme, primaryColor: v })}
          />
          <ColorField
            label="Arka plan"
            value={theme.backgroundColor}
            onChange={(v) => setTheme({ ...theme, backgroundColor: v })}
          />
          <ColorField
            label="Metin"
            value={theme.textColor}
            onChange={(v) => setTheme({ ...theme, textColor: v })}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Buton stili</span>
            <select
              value={theme.buttonStyle}
              onChange={(e) =>
                setTheme({
                  ...theme,
                  buttonStyle: e.target.value as ThemeDto["buttonStyle"],
                })
              }
              className="w-full rounded-xl border border-zinc-200 px-3 py-2"
            >
              <option value="SOLID">Dolu</option>
              <option value="OUTLINE">Çerçeve</option>
              <option value="SOFT">Yumuşak</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Logo şekli</span>
            <select
              value={theme.logoShape}
              onChange={(e) =>
                setTheme({
                  ...theme,
                  logoShape: e.target.value as ThemeDto["logoShape"],
                })
              }
              className="w-full rounded-xl border border-zinc-200 px-3 py-2"
            >
              <option value="SQUARE">Kare</option>
              <option value="ROUNDED">Yuvarlatılmış</option>
              <option value="CIRCLE">Daire</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={theme.showCover}
              onChange={(e) =>
                setTheme({ ...theme, showCover: e.target.checked })
              }
            />
            Kapak görseli göster
          </label>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Bölümler
          </h2>
          <ul className="mt-3 space-y-2">
            {sections.map((section, index) => (
              <li
                key={section.key}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-100 px-3 py-2 text-sm"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(e) => {
                      const next = sections.map((s) =>
                        s.key === section.key
                          ? { ...s, enabled: e.target.checked }
                          : s,
                      );
                      setSections(next);
                    }}
                  />
                  {SECTION_LABELS[section.key] ?? section.key}
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    className="rounded border px-2 py-0.5 text-xs"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    className="rounded border px-2 py-0.5 text-xs"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-700">{message}</p>
        ) : null}

        <button
          type="button"
          disabled={loading}
          onClick={() => save()}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Kaydediliyor…" : "Tasarımı Kaydet"}
        </button>
      </div>

      <section
        className="rounded-2xl border border-zinc-200 p-6"
        style={{
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
        }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wide opacity-60">
          Önizleme
        </h2>
        <div className="mt-6 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center text-lg font-semibold text-white"
            style={{
              backgroundColor: theme.primaryColor,
              borderRadius:
                theme.logoShape === "CIRCLE"
                  ? "9999px"
                  : theme.logoShape === "ROUNDED"
                    ? "16px"
                    : "4px",
            }}
          >
            A6
          </div>
          <p className="mt-3 text-lg font-semibold">Şirket Adı</p>
          <p className="mt-1 text-sm opacity-70">Kısa açıklama örneği</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {["Ara", "WhatsApp"].map((label) => (
              <div
                key={label}
                className="flex h-10 items-center justify-center rounded-full text-sm font-medium"
                style={
                  theme.buttonStyle === "OUTLINE"
                    ? {
                        border: `1.5px solid ${theme.primaryColor}`,
                        color: theme.primaryColor,
                      }
                    : theme.buttonStyle === "SOFT"
                      ? {
                          backgroundColor: `${theme.primaryColor}22`,
                          color: theme.primaryColor,
                        }
                      : {
                          backgroundColor: theme.primaryColor,
                          color: "#fff",
                        }
                }
              >
                {label}
              </div>
            ))}
          </div>
          <ul className="mt-6 space-y-1 text-left text-xs opacity-70">
            {sections
              .filter((s) => s.enabled)
              .map((s) => (
                <li key={s.key}>• {SECTION_LABELS[s.key] ?? s.key}</li>
              ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-zinc-200"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-xs"
        />
      </div>
    </label>
  );
}
