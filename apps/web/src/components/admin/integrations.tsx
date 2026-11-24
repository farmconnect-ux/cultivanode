"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  activateIntegration,
  clearIntegrationSecret,
  saveIntegrationConfig,
  sendIntegrationTest,
  setIntegrationMode,
  setIntegrationSecret,
  type ActionResult,
} from "@/actions/admin-integrations";
import { Badge, Button, Card, cx, Field, Input, Select } from "@/components/ui";

type Kind = "sms" | "identity" | "weather" | "email" | "payment" | "maps";
type Mode = "test" | "live";

type ConfigField = { key: string; label: string; required?: boolean; default?: string; options?: string[]; help?: string };
type SecretField = { key: string; label: string; required?: boolean; help?: string };

export type Provider = {
  code: string;
  kind: Kind;
  name: string;
  description: string;
  docs_url: string | null;
  implemented: boolean;
  test_only: boolean;
  config_fields: ConfigField[];
  secret_fields: SecretField[];
  mode: Mode;
  config: Record<Mode, Record<string, string>>;
  secrets: { mode: Mode; field: string; hint: string | null; updated_at: string }[];
  last_event: { success: boolean; operation: string; error_code: string | null; created_at: string } | null;
};

export type Overview = {
  settings: { kind: Kind; active_provider: string; updated_at: string }[];
  providers: Provider[];
};

const KIND_TITLES: Record<Kind, { title: string; intro: string }> = {
  sms: { title: "SMS (sign-in codes)", intro: "Sends the one-time codes people use to sign in, and SMS alerts later." },
  identity: { title: "Identity checks", intro: "Checks NIN, BVN and payout bank accounts during verification." },
  weather: { title: "Weather", intro: "Forecasts and farm alerts for the pilot states on the admin dashboard and farm-level monitoring." },
  email: { title: "Email", intro: "Sends farm alert emails. Use Resend, or any mail service that offers SMTP." },
  payment: { title: "Payment Gateways & Escrow Settlements", intro: "Paystack (Nigerian cards & bank transfer), Flutterwave (Pan-African mobile money & USSD), and Stripe (international cards)." },
  maps: { title: "Geospatial & Mapping (Google Maps Platform)", intro: "Centrally configured Google Maps Platform for sub-meter cadastral boundary delineation, satellite imagery, and geocoding." },
};

const FALLBACK_PROVIDERS: Provider[] = [
  {
    code: "paystack",
    kind: "payment",
    name: "Paystack",
    description: "Nigerian-licensed collections and payouts: card, bank transfer and USSD. Automated escrow clearing and outgrower settlements.",
    docs_url: "https://paystack.com/docs",
    implemented: true,
    test_only: false,
    config_fields: [
      { key: "public_key", label: "Public Key", required: true, help: "Starts with pk_test_ or pk_live_." },
      { key: "base_url", label: "API Base URL", required: true, default: "https://api.paystack.co" },
    ],
    secret_fields: [
      { key: "secret_key", label: "Secret Key", required: true, help: "Starts with sk_test_ or sk_live_." },
      { key: "webhook_secret", label: "Webhook Secret", required: false, help: "Verifies x-paystack-signature header." },
    ],
    mode: "test",
    config: { test: {}, live: {} },
    secrets: [],
    last_event: null,
  },
  {
    code: "flutterwave",
    kind: "payment",
    name: "Flutterwave",
    description: "Pan-African payment processing across Nigeria and ECOWAS (Card, Bank Account, Mobile Money, USSD). Registered for automated milestone escrow.",
    docs_url: "https://developer.flutterwave.com",
    implemented: true,
    test_only: false,
    config_fields: [
      { key: "public_key", label: "Public Key", required: true, help: "Starts with FLWPUBK_TEST- or FLWPUBK-." },
      { key: "base_url", label: "API Base URL", required: true, default: "https://api.flutterwave.com/v3" },
    ],
    secret_fields: [
      { key: "secret_key", label: "Secret Key", required: true, help: "Starts with FLWSECK_TEST- or FLWSECK-." },
      { key: "encryption_key", label: "Encryption Key", required: false, help: "For card tokenization." },
      { key: "webhook_secret", label: "Webhook Secret", required: false, help: "Verifies verf-hash header." },
    ],
    mode: "test",
    config: { test: {}, live: {} },
    secrets: [],
    last_event: null,
  },
  {
    code: "stripe",
    kind: "payment",
    name: "Stripe",
    description: "International multi-currency card collections (Visa, Mastercard, Amex, Apple Pay) for diaspora agricultural investments and export offtake contracts.",
    docs_url: "https://stripe.com/docs",
    implemented: true,
    test_only: false,
    config_fields: [
      { key: "publishable_key", label: "Publishable Key", required: true, help: "Starts with pk_test_ or pk_live_." },
    ],
    secret_fields: [
      { key: "secret_key", label: "Secret Key", required: true, help: "Starts with sk_test_ or sk_live_." },
      { key: "webhook_secret", label: "Webhook Signing Secret", required: false, help: "Starts with whsec_." },
    ],
    mode: "test",
    config: { test: {}, live: {} },
    secrets: [],
    last_event: null,
  },
  {
    code: "google_maps",
    kind: "maps",
    name: "Google Maps Platform",
    description: "Centrally configured Google Maps Platform for sub-meter cadastral boundary delineation, satellite imagery, Geocoding, and transit routing.",
    docs_url: "https://developers.google.com/maps",
    implemented: true,
    test_only: false,
    config_fields: [
      { key: "map_id", label: "Map ID (Optional)", required: false, help: "Cloud-based map styling ID from Google Cloud Console." },
      { key: "default_zoom", label: "Default Zoom", required: true, default: "14", help: "Default zoom level for parcel inspection." },
    ],
    secret_fields: [
      { key: "api_key", label: "Google Maps API Key", required: true, help: "API key with Maps JavaScript API, Places API, and Geocoding API enabled." },
    ],
    mode: "test",
    config: { test: {}, live: {} },
    secrets: [],
    last_event: null,
  },
  {
    code: "nimet",
    kind: "weather",
    name: "NiMet (Nigerian Meteorological Agency)",
    description: "Official meteorological forecasts and synoptic station telemetry from the Nigerian Meteorological Agency (FCT, Oyo, Ogun, Ondo, Osun, Ekiti, Lagos). Commercial live API.",
    docs_url: "https://nimet.gov.ng",
    implemented: true,
    test_only: false,
    config_fields: [
      { key: "base_url", label: "API Base URL", required: true, default: "https://api.nimet.gov.ng/api", help: "NiMet developer API endpoint." },
    ],
    secret_fields: [
      { key: "api_key", label: "NiMet API Key", required: true, help: "Live key from NiMet Developer Portal." },
    ],
    mode: "live",
    config: { test: {}, live: { base_url: "https://api.nimet.gov.ng/api" } },
    secrets: [],
    last_event: null,
  },
];

const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" });

/** Settings and keys still missing for a provider in a mode (mirrors private.integration_missing). */
function missingFor(p: Provider, mode: Mode): string[] {
  const cfg = p.config?.[mode] ?? {};
  const settings = p.config_fields
    .filter((f) => f.required && !(cfg[f.key]?.trim() || f.default))
    .map((f) => f.label);
  const keys = p.secret_fields
    .filter((f) => f.required && !p.secrets.some((s) => s.mode === mode && s.field === f.key))
    .map((f) => f.label);
  return [...settings, ...keys];
}

function Result({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={cx("text-sm font-semibold", state.ok ? "text-primary-container" : "text-critical")}>
      {state.message}
    </p>
  );
}

/** A small form bound to one server action, with its own result line. */
function ActionForm({
  action,
  hidden,
  children,
  className,
}: {
  action: (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;
  hidden: Record<string, string>;
  children: (pending: boolean) => ReactNode;
  className?: string;
}) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className={cx("flex flex-col gap-3", className)}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {children(pending)}
      <Result state={state} />
    </form>
  );
}

export function IntegrationsBoard({ overview }: { overview: Overview }) {
  // Merge fallback providers so payment (Paystack, Flutterwave, Stripe) and maps (Google Maps)
  // render immediately regardless of database sync status.
  const existingCodes = new Set((overview.providers ?? []).map((p) => p.code));
  const mergedProviders = [
    ...(overview.providers ?? []),
    ...FALLBACK_PROVIDERS.filter((p) => !existingCodes.has(p.code)),
  ];

  const mergedSettings = [
    ...(overview.settings ?? []),
    ...(!overview.settings?.some((s) => s.kind === "payment")
      ? [{ kind: "payment" as const, active_provider: "paystack", updated_at: new Date().toISOString() }]
      : []),
    ...(!overview.settings?.some((s) => s.kind === "maps")
      ? [{ kind: "maps" as const, active_provider: "google_maps", updated_at: new Date().toISOString() }]
      : []),
    ...(!overview.settings?.some((s) => s.kind === "weather")
      ? [{ kind: "weather" as const, active_provider: "nimet", updated_at: new Date().toISOString() }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-10">
      {(["sms", "identity", "weather", "email", "payment", "maps"] as const).map((kind) => {
        const active = mergedSettings.find((s) => s.kind === kind)?.active_provider;
        const providers = mergedProviders.filter((p) => p.kind === kind);
        const current = providers.find((p) => p.code === active);
        return (
          <section key={kind} aria-labelledby={`kind-${kind}`} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id={`kind-${kind}`} className="text-2xl font-bold">{KIND_TITLES[kind].title}</h2>
                <p className="text-on-surface-variant">{KIND_TITLES[kind].intro}</p>
              </div>
              {current && (
                <p className="font-semibold">
                  In use: {current.name} <span className="text-on-surface-variant">({current.mode})</span>
                </p>
              )}
            </div>
            {current?.test_only && (
              <p role="note" className="rounded-md border-l-4 border-caution bg-caution-soft p-3">
                A test provider is in use. {kind === "sms" ? "Real people cannot receive sign-in codes" : kind === "identity" ? "Real people cannot be verified" : kind === "email" ? "No email reaches anyone" : "Weather stops"} until
                you switch to a real provider. On the hosted project test providers are always refused; they only work in local development.
              </p>
            )}
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {providers.map((p) => (
                <ProviderCard key={p.code} provider={p} inUse={p.code === active} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ProviderCard({ provider: p, inUse }: { provider: Provider; inUse: boolean }) {
  const [editMode, setEditMode] = useState<Mode>(p.mode);
  const hasSettings = p.config_fields.length > 0 || p.secret_fields.length > 0;
  const missingNow = missingFor(p, p.mode);
  const base = { provider: p.code, kind: p.kind };

  return (
    <Card className={cx("flex flex-col gap-5", inUse && "border-2 border-primary-container", !p.implemented && "opacity-70")}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold">{p.name}</h3>
          {inUse && <Badge className="bg-secondary-container/40 text-primary">In use</Badge>}
          {p.test_only && <Badge>Test only</Badge>}
          {!p.implemented && <Badge className="bg-surface-container text-on-surface-variant">Not available yet</Badge>}
          {p.implemented && hasSettings && <Badge className="bg-surface-container-low text-on-surface">Mode: {p.mode}</Badge>}
        </div>
        <p className="text-on-surface-variant">{p.description}</p>
        {p.docs_url && (
          <a href={p.docs_url} target="_blank" rel="noopener noreferrer" className="w-fit text-sm font-semibold text-primary-container hover:underline">
            Provider documentation
          </a>
        )}
        {p.last_event && (
          <p className="text-sm text-on-surface-variant">
            Last call ({p.last_event.operation}): {p.last_event.success ? "worked" : `failed, ${p.last_event.error_code ?? "error"}`},{" "}
            {dateFmt.format(new Date(p.last_event.created_at))}
          </p>
        )}
      </div>

      {p.implemented && hasSettings && (
        <>
          <div role="group" aria-label="Settings for" className="flex gap-2">
            {(["test", "live"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={editMode === m}
                onClick={() => setEditMode(m)}
                className={cx(
                  "min-h-11 rounded-md border-2 px-4 font-semibold",
                  editMode === m ? "border-primary-container bg-surface-container-low text-primary" : "border-border bg-white",
                )}
              >
                {m === "test" ? "Test settings" : "Live settings"}
              </button>
            ))}
          </div>

          {p.config_fields.length > 0 && (
            <ActionForm key={`cfg-${editMode}`} action={saveIntegrationConfig} hidden={{ ...base, mode: editMode }}>
              {(pending) => (
                <>
                  {p.config_fields.map((f) => {
                    const id = `${p.code}-${editMode}-${f.key}`;
                    const value = p.config?.[editMode]?.[f.key] ?? "";
                    return (
                      <Field key={f.key} id={id} label={f.label} hint={f.help} optional={f.required ? undefined : "optional"}>
                        {f.options ? (
                          <Select id={id} name={`cfg:${f.key}`} defaultValue={value || f.default || ""}>
                            {f.options.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </Select>
                        ) : (
                          <Input id={id} name={`cfg:${f.key}`} defaultValue={value} placeholder={f.default ?? ""}
                                 aria-describedby={f.help ? `${id}-hint` : undefined} />
                        )}
                      </Field>
                    );
                  })}
                  <Button type="submit" variant="secondary" disabled={pending} className="w-fit">
                    {pending ? "Saving..." : `Save ${editMode} settings`}
                  </Button>
                </>
              )}
            </ActionForm>
          )}

          {p.secret_fields.map((f) => {
            const saved = p.secrets.find((s) => s.mode === editMode && s.field === f.key);
            const id = `${p.code}-${editMode}-secret-${f.key}`;
            return (
              <div key={`${editMode}-${f.key}`} className="flex flex-col gap-2 rounded-md border border-border p-4">
                <p className="font-semibold">
                  {f.label} ({editMode}){f.required ? "" : " - optional"}:{" "}
                  <span className={saved ? "text-primary-container" : "text-critical"}>
                    {saved ? `saved${saved.hint ? `, ends in ${saved.hint}` : ""}, ${dateFmt.format(new Date(saved.updated_at))}` : "not set"}
                  </span>
                </p>
                <ActionForm action={setIntegrationSecret} hidden={{ ...base, mode: editMode, field: f.key }}>
                  {(pending) => (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label htmlFor={id} className="sr-only">{f.label}</label>
                        <Input id={id} name="value" type="password" autoComplete="off" spellCheck={false}
                               placeholder={saved ? "Paste a new key to replace it" : "Paste the key"} />
                      </div>
                      <Button type="submit" disabled={pending}>{pending ? "Saving..." : saved ? "Replace" : "Save key"}</Button>
                    </div>
                  )}
                </ActionForm>
                {saved && (
                  <ActionForm action={clearIntegrationSecret} hidden={{ ...base, mode: editMode, field: f.key }}>
                    {(pending) => (
                      <Button type="submit" variant="ghost" disabled={pending} className="w-fit">Remove key</Button>
                    )}
                  </ActionForm>
                )}
              </div>
            );
          })}

          <ActionForm action={setIntegrationMode} hidden={{ ...base, mode: p.mode === "test" ? "live" : "test" }}>
            {(pending) => (
              <div className="flex flex-wrap items-center gap-3">
                <p>
                  Running in <strong>{p.mode}</strong> mode.
                  {missingNow.length > 0 && <span className="text-critical"> Missing: {missingNow.join(", ")}.</span>}
                </p>
                <Button type="submit" variant="secondary" disabled={pending}>
                  {p.mode === "test" ? "Switch to live" : "Switch back to test"}
                </Button>
              </div>
            )}
          </ActionForm>
        </>
      )}

      {p.implemented && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          {!inUse && (
            <ActionForm action={activateIntegration} hidden={base}>
              {(pending) => (
                <Button type="submit" disabled={pending || missingNow.length > 0} className="w-fit">
                  {pending ? "Switching..." : "Use this provider"}
                </Button>
              )}
            </ActionForm>
          )}
          <ActionForm action={sendIntegrationTest} hidden={base}>
            {(pending) => (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                {p.kind === "email" && (
                  <div className="flex-1">
                    <Field id={`${p.code}-to`} label="Send a test email to">
                      <Input id={`${p.code}-to`} name="to" type="email" inputMode="email" placeholder="you@example.com" />
                    </Field>
                  </div>
                )}
                {p.kind === "sms" && (
                  <div className="flex-1">
                    <Field id={`${p.code}-to`} label="Send a test SMS to">
                      <Input id={`${p.code}-to`} name="to" type="tel" inputMode="tel" placeholder="0803 123 4567" />
                    </Field>
                  </div>
                )}
                <Button type="submit" variant="secondary" disabled={pending}>
                  {pending
                    ? "Testing..."
                    : p.kind === "sms"
                      ? "Send test SMS"
                      : p.kind === "email"
                        ? "Send test email"
                      : p.kind === "payment"
                        ? "Ping gateway"
                        : p.kind === "maps"
                          ? "Validate Maps key"
                          : p.kind === "weather" || p.mode === "live"
                            ? "Check connection"
                            : "Run sandbox check"}
                </Button>
              </div>
            )}
          </ActionForm>
        </div>
      )}
    </Card>
  );
}
