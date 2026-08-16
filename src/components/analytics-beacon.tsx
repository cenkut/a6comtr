"use client";

import { useEffect } from "react";

/**
 * Records PROFILE_VIEW once on public card mount.
 * Click tracking is attached via data attributes on action links.
 */
export function AnalyticsBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    void fetch(`/api/public/c/${slug}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "PROFILE_VIEW" }),
      keepalive: true,
    }).catch(() => undefined);
  }, [slug]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = (event.target as HTMLElement | null)?.closest(
        "[data-a6-event]",
      ) as HTMLElement | null;
      if (!target) return;
      const type = target.getAttribute("data-a6-event");
      if (!type) return;
      void fetch(`/api/public/c/${slug}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
        keepalive: true,
      }).catch(() => undefined);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [slug]);

  return null;
}
