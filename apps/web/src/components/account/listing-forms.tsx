"use client";

import { useRef, useState } from "react";
import { deleteListing, saveListing, setListingStatus } from "@/actions/listings";
import { Button, Field, Input, Select, TextArea } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { ActionForm } from "./action-form";

type T = Pick<Dictionary, "acct" | "equipmentTypes" | "providerTypes" | "units" | "onboarding">;

export type MyListing = {
  id: string;
  kind: "equipment" | "service";
  equipment_type: string | null;
  provider_type: string | null;
  title: string;
  description: string | null;
  operator_included: boolean;
  service_radius_km: number;
  status: "draft" | "active" | "paused" | "suspended";
  suspended_reason: string | null;
  lat: number;
  lng: number;
  rates: Record<string, number>;
};

const UNITS = ["hour", "day", "hectare", "job"] as const;
const naira = (kobo?: number) => (kobo ? String(kobo / 100) : "");

/** Create or edit a listing. Kinds offered follow the approved roles (equipment for machinery owners, services for providers). */
export function ListingForm({
  lang, t, listing, equipmentAllowed, serviceTypes, canPublish,
}: {
  lang: Locale;
  t: T;
  listing?: MyListing;
  equipmentAllowed: boolean;
  serviceTypes: string[];
  canPublish: boolean;
}) {
  const l = t.acct.listings;
  const prefix = listing ? `listing-${listing.id.slice(0, 8)}` : "listing-new";
  const [kind, setKind] = useState<"equipment" | "service">(listing?.kind ?? (equipmentAllowed ? "equipment" : "service"));
  const lat = useRef<HTMLInputElement>(null);
  const lng = useRef<HTMLInputElement>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);

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

  const hidden: Record<string, string> = { lang };
  if (listing) {
    hidden.id = listing.id;
    hidden.current_status = listing.status;
    hidden.kind = listing.kind;
    if (listing.provider_type) hidden.provider_type = listing.provider_type;
  }

  return (
    <ActionForm action={saveListing} hidden={hidden} messages={[l, t.acct]} success={l.saved}>
      {(pending) => (
        <>
          {!listing && equipmentAllowed && serviceTypes.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="font-semibold">{l.what}</legend>
              <div className="flex flex-wrap gap-4">
                {(["equipment", "service"] as const).map((k) => (
                  <label key={k} className="inline-flex min-h-11 items-center gap-2">
                    <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="size-5 accent-primary-container" />
                    {k === "equipment" ? l.equipment : l.service}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {!listing && !(equipmentAllowed && serviceTypes.length > 0) && <input type="hidden" name="kind" value={kind} />}

          {kind === "equipment" ? (
            <Field id={`${prefix}-type`} label={l.equipmentType}>
              <Select id={`${prefix}-type`} name="equipment_type" defaultValue={listing?.equipment_type ?? ""} required>
                <option value="" disabled>—</option>
                {Object.entries(t.equipmentTypes).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </Select>
            </Field>
          ) : listing ? (
            <p><span className="font-semibold">{l.serviceType}:</span> {t.providerTypes[listing.provider_type as keyof T["providerTypes"]]}</p>
          ) : (
            <Field id={`${prefix}-type`} label={l.serviceType}>
              <Select id={`${prefix}-type`} name="provider_type" defaultValue={serviceTypes[0] ?? ""} required>
                {serviceTypes.map((v) => <option key={v} value={v}>{t.providerTypes[v as keyof T["providerTypes"]] ?? v}</option>)}
              </Select>
            </Field>
          )}

          <Field id={`${prefix}-title`} label={l.titleLabel}>
            <Input id={`${prefix}-title`} name="title" defaultValue={listing?.title} placeholder={l.titlePlaceholder} maxLength={120} required />
          </Field>
          <Field id={`${prefix}-desc`} label={l.description} hint={l.descriptionHint} optional={t.onboarding.consentOptional}>
            <TextArea id={`${prefix}-desc`} name="description" defaultValue={listing?.description ?? ""} maxLength={2000} aria-describedby={`${prefix}-desc-hint`} />
          </Field>
          {kind === "equipment" && (
            <label className="inline-flex min-h-11 items-center gap-3">
              <input type="checkbox" name="operator_included" defaultChecked={listing?.operator_included ?? true} className="size-5 accent-primary-container" />
              {l.operatorIncluded}
            </label>
          )}

          <fieldset className="flex flex-col gap-3 rounded-md border-2 border-border p-4">
            <legend className="px-1 font-semibold">{l.prices}</legend>
            <p className="text-sm text-on-surface-variant">{l.pricesHint}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {UNITS.map((u) => (
                <Field key={u} id={`${prefix}-rate-${u}`} label={`₦ ${t.units[u]}`}>
                  <Input id={`${prefix}-rate-${u}`} name={`rate_${u}`} inputMode="decimal" defaultValue={naira(listing?.rates[u])} />
                </Field>
              ))}
            </div>
          </fieldset>

          <Field id={`${prefix}-radius`} label={l.radius}>
            <Input id={`${prefix}-radius`} name="service_radius_km" inputMode="numeric" defaultValue={String(listing?.service_radius_km ?? 30)} required />
          </Field>

          <fieldset className="flex flex-col gap-3 rounded-md border-2 border-border p-4">
            <legend className="px-1 font-semibold">{l.location}</legend>
            <p className="text-sm text-on-surface-variant">{t.acct.farms.locationHint}</p>
            <Button variant="secondary" onClick={locate} disabled={locating} className="self-start">
              {locating ? t.acct.farms.locating : t.acct.farms.useMyLocation}
            </Button>
            {geoError && <p role="alert" className="text-sm font-medium text-critical">{t.acct.farms.locationFailed}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${prefix}-lat`} label={t.acct.farms.latitude}>
                <Input ref={lat} id={`${prefix}-lat`} name="latitude" inputMode="decimal" defaultValue={listing ? listing.lat.toFixed(6) : ""} placeholder="7.3775" required />
              </Field>
              <Field id={`${prefix}-lng`} label={t.acct.farms.longitude}>
                <Input ref={lng} id={`${prefix}-lng`} name="longitude" inputMode="decimal" defaultValue={listing ? listing.lng.toFixed(6) : ""} placeholder="3.8967" required />
              </Field>
            </div>
          </fieldset>

          {canPublish && (
            <label className="inline-flex min-h-11 items-center gap-3 font-semibold">
              <input type="checkbox" name="publish" defaultChecked={listing ? listing.status === "active" : true} className="size-5 accent-primary-container" />
              {l.publishNow}
            </label>
          )}
          <Button type="submit" disabled={pending} className="self-start">{pending ? l.saving : l.save}</Button>
        </>
      )}
    </ActionForm>
  );
}

/** Publish / pause and delete buttons for one listing. */
export function ListingControls({ lang, t, listing, canPublish }: { lang: Locale; t: T; listing: MyListing; canPublish: boolean }) {
  const l = t.acct.listings;
  if (listing.status === "suspended") return null;
  return (
    <div className="flex flex-wrap items-start gap-3">
      {listing.status === "active" ? (
        <ActionForm action={setListingStatus} hidden={{ lang, id: listing.id, to: "paused" }} messages={[l, t.acct]}>
          {(pending) => <Button type="submit" variant="secondary" disabled={pending}>{l.pause}</Button>}
        </ActionForm>
      ) : canPublish ? (
        <ActionForm action={setListingStatus} hidden={{ lang, id: listing.id, to: "active" }} messages={[l, t.acct]}>
          {(pending) => <Button type="submit" disabled={pending}>{l.publish}</Button>}
        </ActionForm>
      ) : null}
      <ActionForm action={deleteListing} hidden={{ lang, id: listing.id }} messages={[l, t.acct]}>
        {(pending) => (
          <Button type="submit" variant="ghost" disabled={pending}
                  onClick={(e) => { if (!confirm(l.confirmRemove)) e.preventDefault(); }}>
            {l.remove}
          </Button>
        )}
      </ActionForm>
    </div>
  );
}
