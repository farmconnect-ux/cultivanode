"use server";

import { redirect } from "next/navigation";
import { DbConstants, LEGAL_VERSION, NIGERIAN_STATES } from "@cultivanode/shared";
import { hasLocale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type OnboardingErrorKey =
  | "errorName"
  | "errorBusiness"
  | "errorRoles"
  | "errorProviderType"
  | "errorConsent"
  | "errorGeneric";

export type OnboardingState = {
  error?: OnboardingErrorKey;
  values?: Record<string, string | string[]>;
};

const ROLES = DbConstants.public.Enums.app_role as readonly string[];
const PROVIDER_TYPES = DbConstants.public.Enums.provider_type as readonly string[];
const LANGUAGES = ["en", "yo", "pcm"] as const;

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

/** Everything is checked again by complete_onboarding() in the database; this gives quick, friendly errors. */
export async function completeOnboarding(_prev: OnboardingState, form: FormData): Promise<OnboardingState> {
  const langRaw = text(form, "lang", 5);
  const lang = hasLocale(langRaw) ? langRaw : "en";
  const fullName = text(form, "full_name", 120);
  const accountType = form.get("account_type") === "business" ? "business" : "individual";
  const businessName = text(form, "business_name", 160);
  const cac = text(form, "cac_number", 40);
  const stateRaw = text(form, "state", 60);
  const state = (NIGERIAN_STATES as readonly string[]).includes(stateRaw) ? stateRaw : "";
  const lga = text(form, "lga", 60);
  const languageRaw = text(form, "language", 5);
  const language = (LANGUAGES as readonly string[]).includes(languageRaw) ? (languageRaw as (typeof LANGUAGES)[number]) : lang;
  const roles = form.getAll("roles").map(String).filter((r) => ROLES.includes(r));
  const providerType = text(form, "provider_type", 40);
  const consents = {
    terms_of_use: form.get("consent_terms") === "on",
    privacy_policy: form.get("consent_privacy") === "on",
    data_processing: form.get("consent_data") === "on",
    marketing_messages: form.get("consent_marketing") === "on",
  };

  const values = {
    full_name: fullName, account_type: accountType, business_name: businessName, cac_number: cac,
    state, lga, language, roles, provider_type: providerType,
  };
  if (fullName.length < 2) return { error: "errorName", values };
  if (accountType === "business" && businessName.length < 2) return { error: "errorBusiness", values };
  if (roles.length === 0) return { error: "errorRoles", values };
  if (roles.includes("service_provider") && !PROVIDER_TYPES.includes(providerType)) return { error: "errorProviderType", values };
  if (!consents.terms_of_use || !consents.privacy_policy) return { error: "errorConsent", values };

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_full_name: fullName,
    p_account_type: accountType,
    p_business_name: accountType === "business" ? businessName : "",
    p_cac_number: accountType === "business" ? cac : "",
    p_state: state,
    p_lga: lga,
    p_language: language,
    p_roles: roles.map((role) => (role === "service_provider" ? { role, provider_type: providerType } : { role })),
    p_consents: consents,
    p_document_version: LEGAL_VERSION,
    p_channel: "web",
  });
  if (error) {
    if (error.code === "P0001") redirect(`/${lang}/account`); // already set up
    if (error.code === "42501") redirect(`/${lang}/sign-in`);
    logger.warn("onboarding_failed", { code: error.code });
    return { error: "errorGeneric", values };
  }
  redirect(`/${lang}/account?welcome=1`);
}
