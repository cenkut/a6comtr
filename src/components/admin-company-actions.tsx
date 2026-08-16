"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompanyStatusActions({
  companyId,
  status,
}: {
  companyId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/companies/${companyId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {status !== "ACTIVE" ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("ACTIVE")}
          className="rounded border px-2 py-1 text-xs"
        >
          Activate
        </button>
      ) : null}
      {status !== "SUSPENDED" ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("SUSPENDED")}
          className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-800"
        >
          Suspend
        </button>
      ) : null}
      {status !== "ARCHIVED" ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("ARCHIVED")}
          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
        >
          Archive
        </button>
      ) : null}
    </div>
  );
}
