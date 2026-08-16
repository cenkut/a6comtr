"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
    >
      {loading ? "Çıkış…" : "Çıkış Yap"}
    </button>
  );
}
