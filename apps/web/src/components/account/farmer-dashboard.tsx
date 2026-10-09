"use client";

import React from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { BookingSummary } from "@/lib/account/bookings";
import type { Account } from "@/lib/account/session";
import { FarmerCommunityDashboard } from "@/components/farmer-community/FarmerCommunityDashboard";

type Farm = {
  id: string;
  name: string;
  state: string | null;
  lga: string | null;
  area_ha: number | null;
};

export function FarmerDashboard({
  lang,
  account,
  t,
  farms,
  bookings,
  initialTab = "dashboard",
}: {
  lang?: Locale;
  account: Account;
  t?: Dictionary;
  farms?: Farm[];
  bookings?: BookingSummary[];
  initialTab?: string;
}) {
  const userName = account.profile.full_name || "Producer Admin";
  const userEmail = account.email || undefined;

  return (
    <div className="w-full">
      <FarmerCommunityDashboard
        initialTab={initialTab}
        userName={userName}
        userEmail={userEmail}
      />
    </div>
  );
}

export default FarmerDashboard;
