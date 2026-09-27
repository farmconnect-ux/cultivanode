import { brand } from '@cultivanode/shared/brand';

/** The website, for legal pages and account areas the app does not have yet. */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? `https://${brand.domain}`).replace(/\/+$/, '');

export const siteLink = (lang: string, path: string) => `${SITE_URL}/${lang}/${path.replace(/^\/+/, '')}`;
