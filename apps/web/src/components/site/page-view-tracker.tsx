"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Counts a page view (path only: no cookies, IPs or user IDs; see track_page_view() in the database).
 * Skipped when the browser sends Do Not Track or Global Privacy Control.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    createClient()
      .rpc("track_page_view", { p_path: pathname })
      .then(() => undefined, () => undefined);
  }, [pathname]);
  return null;
}
