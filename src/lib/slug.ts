/**
 * Create a URL-safe slug from a display name (Turkish-friendly).
 */
export function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    İ: "i",
    I: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };

  const replaced = input
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");

  return replaced
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}

export function withUniqueSuffix(base: string, suffix: string): string {
  const clean = base || "sirket";
  const maxBase = 60 - suffix.length - 1;
  return `${clean.slice(0, maxBase)}-${suffix}`;
}
