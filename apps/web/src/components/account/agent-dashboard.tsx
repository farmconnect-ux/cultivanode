"use client";

import React from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Account } from "@/lib/account/session";
import { AgentCommunityDashboard, type AgentFarmer } from "@/components/agent-community/AgentCommunityDashboard";

export function AgentDashboard({
  lang,
  account,
  t,
  farmers = [],
}: {
  lang: Locale;
  account: Account;
  t: Dictionary;
  farmers: AgentFarmer[];
}) {
  return (
    <div className="w-full">
      <AgentCommunityDashboard
        lang={lang}
        account={account}
        t={t}
        farmers={farmers}
      />
    </div>
  );
}

export default AgentDashboard;
