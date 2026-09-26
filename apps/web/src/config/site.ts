// Public contact details come from environment variables so they can change without a code edit.
// Anything left blank is simply not shown on the site.

function digits(value: string | undefined): string | undefined {
  const d = value?.replace(/[^0-9]/g, "");
  return d ? d : undefined;
}

const whatsapp = digits(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP); // e.g. 2348031234567
const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || undefined; // e.g. +234 803 123 4567
const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || undefined;

import { brand } from "@cultivanode/shared/brand";

export const site = {
  name: brand.name,
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  contact: {
    whatsappUrl: whatsapp ? `https://wa.me/${whatsapp}` : undefined,
    phone,
    phoneHref: phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : undefined,
    email,
  },
  // Partner logos appear on the home page once agreements are signed: { name, url }.
  partners: [] as { name: string; url?: string }[],
} as const;

export const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;
