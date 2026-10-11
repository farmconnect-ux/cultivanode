"use client";

import Link from "next/link";
import { useState } from "react";
import { FarmForm } from "@/components/account/farm-form";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import type { FarmerLive } from "../live";

export function Farms({ live, t }: { live: FarmerLive; t: Dictionary }) {
  const { lang, farms } = live;
  const [adding, setAdding] = useState(farms.length === 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your farms</h1>
          <p className="mt-1 text-sm text-gray-600">Only farms on this account. Hire and crop pages use these pins.</p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white"
        >
          {adding ? "Close" : "Add a farm"}
        </button>
      </div>

      {adding && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <FarmForm lang={lang as Locale} t={t} defaultState={farms[0]?.state} />
        </div>
      )}

      {farms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          No farms yet. Add one with a name and a GPS point. You can type the coordinates if the phone cannot find you.
        </p>
      ) : (
        <ul className="grid gap-3">
          {farms.map((farm) => (
            <li key={farm.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{farm.name}</h2>
                  <p className="text-sm text-gray-500">
                    {[farm.lga, farm.state].filter(Boolean).join(", ") || "State not set"}
                    {farm.area_ha ? ` · ${Number(farm.area_ha).toFixed(1)} ha` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm font-semibold">
                  <Link href={`/${lang}/account/farms/${farm.id}`} className="text-primary underline">Plots</Link>
                  <Link href={`/${lang}/account/find?farm=${farm.id}`} className="text-primary underline">Hire nearby</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
