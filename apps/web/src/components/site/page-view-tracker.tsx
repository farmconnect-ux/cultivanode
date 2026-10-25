"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Counts a page view (path only: no cookies, IPs or user IDs; see track_page_view() in the database).
 * Skipped when the browser sends Do Not Track or Global Privacy Control.
 * A plain request to the public RPC endpoint, sent when the browser is idle: the full Supabase client
 * (about 250 KB) is not loaded on public pages just for this.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    const send = () => {
      try {
        const { url, key } = supabaseEnv();
        fetch(`${url}/rest/v1/rpc/track_page_view`, {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
          body: JSON.stringify({ p_path: pathname }),
        }).catch(() => undefined);
      } catch {
        // Not configured (local preview): nothing to count.
      }
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(send);
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(send, 1500);
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
}
