import { PROVIDER_TYPE_LABELS, ROLE_LABELS, type AppRole, type ProviderType } from "@cultivanode/shared";
import enAccount from "@/i18n/dictionaries/en-account";

export function roleLabel(role: string, providerType?: string | null): string {
  const base = ROLE_LABELS[role as AppRole] ?? role;
  return providerType ? `${base}: ${PROVIDER_TYPE_LABELS[providerType as ProviderType] ?? providerType}` : base;
}

export function documentLabel(type: string): string {
  return enAccount.documentTypes[type as keyof typeof enAccount.documentTypes] ?? type;
}

export const TIER_LABELS = enAccount.acct.tiers;

const dt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
export const when = (iso: string | null | undefined) => (iso ? dt.format(new Date(iso)) : "-");

/** 2348031234567 -> 0803 123 4567 */
export function phoneLabel(p: string | null | undefined): string {
  if (!p || !/^234[0-9]{10}$/.test(p)) return p ?? "-";
  const l = `0${p.slice(3)}`;
  return `${l.slice(0, 4)} ${l.slice(4, 7)} ${l.slice(7)}`;
}
