"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? "Kod gönderilemedi.");
        return;
      }

      const params = new URLSearchParams({ email: email.trim() });
      router.push(`/verify?${params.toString()}`);
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="text-2xl font-semibold tracking-tight">
          A6
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-900">
          Şirketinizin dijital kartvizitini oluşturun.
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Şirket e-posta adresinize tek kullanımlık giriş kodu göndereceğiz.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-800">
              Şirket e-posta adresiniz
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sirket@ornek.com"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none ring-zinc-900 placeholder:text-zinc-400 focus:ring-2"
            />
          </label>

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
            className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Gönderiliyor…" : "Devam Et"}
          </button>
        </form>
      </div>
    </div>
  );
}
