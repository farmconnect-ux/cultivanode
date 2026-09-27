// Builds and checks the onboarding request. No React Native imports, so it is unit-tested in Node.
// The database function complete_onboarding() checks everything again; these checks only give quick,
// friendly errors on the phone.
import { APP_LANGUAGES, NIGERIAN_STATES, PROVIDER_TYPES, type AppLanguage, type AppRole, type ProviderType } from '@cultivanode/shared';

export type OnboardingForm = {
  fullName: string;
  accountType: 'individual' | 'business';
  businessName: string;
  cacNumber: string;
  state: string;
  lga: string;
  language: string;
  roles: AppRole[];
  providerType: string;
  consents: { terms_of_use: boolean; privacy_policy: boolean; data_processing: boolean; marketing_messages: boolean };
};

export type OnboardingError = 'errorName' | 'errorBusiness' | 'errorRoles' | 'errorProviderType' | 'errorConsent';

export type OnboardingArgs = {
  p_full_name: string;
  p_account_type: 'individual' | 'business';
  p_business_name: string;
  p_cac_number: string;
  p_state: string;
  p_lga: string;
  p_language: AppLanguage;
  p_roles: { role: AppRole; provider_type?: ProviderType }[];
  p_consents: OnboardingForm['consents'];
  p_document_version: string;
  p_channel: 'mobile';
};

/** Errors for step 1 (about you). */
export function checkAboutYou(f: OnboardingForm): OnboardingError | null {
  if (f.fullName.trim().length < 2) return 'errorName';
  if (f.accountType === 'business' && f.businessName.trim().length < 2) return 'errorBusiness';
  return null;
}

/** Errors for step 2 (roles). */
export function checkRoles(f: OnboardingForm): OnboardingError | null {
  if (f.roles.length === 0) return 'errorRoles';
  if (f.roles.includes('service_provider') && !(PROVIDER_TYPES as readonly string[]).includes(f.providerType)) {
    return 'errorProviderType';
  }
  return null;
}

/** Errors for step 3 (agreement). */
export function checkConsents(f: OnboardingForm): OnboardingError | null {
  return f.consents.terms_of_use && f.consents.privacy_policy ? null : 'errorConsent';
}

export function firstError(f: OnboardingForm): OnboardingError | null {
  return checkAboutYou(f) ?? checkRoles(f) ?? checkConsents(f);
}

/** The arguments for complete_onboarding(), cleaned and limited like the website's server action. */
export function onboardingArgs(f: OnboardingForm, documentVersion: string): OnboardingArgs {
  const business = f.accountType === 'business';
  const state = (NIGERIAN_STATES as readonly string[]).includes(f.state) ? f.state : '';
  const language = (APP_LANGUAGES as readonly string[]).includes(f.language) ? (f.language as AppLanguage) : 'en';
  const roles = [...new Set(f.roles)];
  return {
    p_full_name: f.fullName.trim().slice(0, 120),
    p_account_type: business ? 'business' : 'individual',
    p_business_name: business ? f.businessName.trim().slice(0, 160) : '',
    p_cac_number: business ? f.cacNumber.trim().slice(0, 40) : '',
    p_state: state,
    p_lga: state ? f.lga.trim().slice(0, 60) : '',
    p_language: language,
    p_roles: roles.map((role) =>
      role === 'service_provider' ? { role, provider_type: f.providerType as ProviderType } : { role },
    ),
    p_consents: { ...f.consents },
    p_document_version: documentVersion,
    p_channel: 'mobile',
  };
}
