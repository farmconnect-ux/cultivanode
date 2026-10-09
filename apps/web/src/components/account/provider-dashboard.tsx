"use client";

import React from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { BookingSummary } from "@/lib/account/bookings";
import type { Account } from "@/lib/account/session";
import { ProviderCommunityDashboard } from "@/components/provider-community/ProviderCommunityDashboard";

export function ProviderDashboard({
  lang,
  account,
  t,
  bookings,
  listingsCount = 0,
}: {
  lang: Locale;
  account: Account;
  t: Dictionary;
  bookings: BookingSummary[];
  listingsCount?: number;
}) {
  return (
    <div className="w-full">
      <ProviderCommunityDashboard
        lang={lang}
        account={account}
        t={t}
        bookings={bookings}
        listingsCount={listingsCount}
      />
    </div>
  );
}

export default ProviderDashboard;
