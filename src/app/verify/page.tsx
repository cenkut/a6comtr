"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useMemo,
  useRef,
  useState,
} from "react";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = useMemo(
    () => searchParams.get("email")?.trim() ?? "",
    [searchParams],
  );

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");

  function updateDigit(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function onPaste(raw: string) {
    const only = raw.replace(/\D/g, "").slice(0, 6);
    if (!only) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < only.length; i += 1) next[i] = only[i]!;
    setDigits(next);
    const focusAt = Math.min(only.length, 5);
    inputsRef.current[focusAt]?.focus();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResendInfo(null);

    if (!email) {
      setError("E-posta adresi eksik. Lütfen giriş sayfasından tekrar deneyin.");
      return;
    }
    if (code.length !== 6) {
      setError("6 haneli kodu girin.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };

      if (!res.ok) {
        setError(data.error ?? "Doğrulama başarısız.");
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

  async function onResend() {
    if (!email) return;
    setError(null);
    setResendInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kod yeniden gönderilemedi.");
        return;
      }
      setResendInfo("Yeni kod e-posta adresinize gönderildi.");
      setDigits(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
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
          E-posta adresinize gönderdiğimiz 6 haneli kodu girin.
        </h1>
        {email ? (
          <p className="mt-2 text-sm text-zinc-600">
            Kod gönderildi: <span className="font-medium">{email}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-red-600">
            E-posta bulunamadı.{" "}
            <Link href="/login" className="underline">
              Giriş sayfasına dön
            </Link>
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div className="flex justify-between gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(e) => updateDigit(index, e.target.value)}
                onKeyDown={(e) => onKeyDown(index, e.key)}
                onPaste={(e) => {
                  e.preventDefault();
                  onPaste(e.clipboardData.getData("text"));
                }}
                className="h-14 w-12 rounded-xl border border-zinc-200 text-center text-xl font-semibold text-zinc-900 outline-none ring-zinc-900 focus:ring-2 sm:h-16 sm:w-14"
                aria-label={`Kod hanesi ${index + 1}`}
              />
            ))}
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}
          {resendInfo ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {resendInfo}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Doğrulanıyor…" : "Giriş Yap"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
              E-postayı değiştir
            </Link>
            <button
              type="button"
              onClick={onResend}
              disabled={loading || !email}
              className="font-medium text-zinc-900 hover:underline disabled:opacity-50"
            >
              Kodu yeniden gönder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center text-sm text-zinc-500">
          Yükleniyor…
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
