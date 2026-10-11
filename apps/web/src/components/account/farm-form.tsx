"use client";

import { useRef, useState } from "react";
import { NIGERIAN_STATES } from "@cultivanode/shared/places";
import { addFarm } from "@/actions/account";
import { Button, Field, Input, Select } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { ActionForm } from "./action-form";

type T = Pick<Dictionary, "acct" | "onboarding">;

/** Name, size and a GPS point (from the phone, or typed). Boundaries and plots come with the farm tools. */
export function FarmForm({ lang, t, forProfile, defaultState }: { lang: Locale; t: T; forProfile?: string; defaultState?: string | null }) {
  const f = t.acct.farms;
  const lat = useRef<HTMLInputElement>(null);
  const lng = useRef<HTMLInputElement>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const prefix = forProfile ? `farm-${forProfile.slice(0, 8)}` : "farm";

  function locate() {
    if (!("geolocation" in navigator)) return setGeoError(true);
    setLocating(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (lat.current) lat.current.value = pos.coords.latitude.toFixed(6);
        if (lng.current) lng.current.value = pos.coords.longitude.toFixed(6);
        setLocating(false);
      },
      () => {
        setGeoError(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 },
    );
  }

  return (
    <ActionForm action={addFarm} hidden={{ lang, ...(forProfile ? { for_profile: forProfile } : {}) }}
                messages={[f, t.acct]} success={t.acct.saved}>
      {(pending) => (
        <>
          <Field id={`${prefix}-name`} label={f.name}>
            <Input id={`${prefix}-name`} name="name" placeholder={f.namePlaceholder} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${prefix}-state`} label={t.onboarding.state}>
              <Select id={`${prefix}-state`} name="state" defaultValue={defaultState ?? ""}>
                <option value="">{t.onboarding.statePlaceholder}</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field id={`${prefix}-lga`} label={t.onboarding.lga} optional={t.onboarding.consentOptional}>
              <Input id={`${prefix}-lga`} name="lga" />
            </Field>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <Field id={`${prefix}-size`} label={f.size} optional={t.onboarding.consentOptional}>
              <Input id={`${prefix}-size`} name="size" inputMode="decimal" />
            </Field>
            <Field id={`${prefix}-unit`} label={f.unit}>
              <Select id={`${prefix}-unit`} name="unit" defaultValue="hectares">
                <option value="hectares">{f.hectares}</option>
                <option value="acres">{f.acres}</option>
              </Select>
            </Field>
          </div>
          <fieldset className="flex flex-col gap-3 rounded-md border-2 border-border p-4">
            <legend className="px-1 font-semibold">{f.location}</legend>
            <p className="text-sm text-on-surface-variant">{f.locationHint}</p>
            <Button variant="secondary" onClick={locate} disabled={locating} className="self-start">
              {locating ? f.locating : f.useMyLocation}
            </Button>
            {geoError && <p role="alert" className="text-sm font-medium text-critical">{f.locationFailed}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${prefix}-lat`} label={f.latitude}>
                <Input ref={lat} id={`${prefix}-lat`} name="latitude" inputMode="decimal" placeholder="7.3775" required />
              </Field>
              <Field id={`${prefix}-lng`} label={f.longitude}>
                <Input ref={lng} id={`${prefix}-lng`} name="longitude" inputMode="decimal" placeholder="3.8967" required />
              </Field>
            </div>
          </fieldset>
          <Button type="submit" disabled={pending} className="self-start">{pending ? f.saving : f.save}</Button>
        </>
      )}
    </ActionForm>
  );
}
