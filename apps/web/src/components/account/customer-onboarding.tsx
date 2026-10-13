import Link from "next/link";
import { NIGERIAN_STATES } from "@cultivanode/shared";
import { completeCustomerOnboarding } from "@/actions/onboarding";
import { Icon } from "@/components/ds/icon";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import type { Locale } from "@/i18n/config";

/** Short sign-up for marketplace shoppers: name, state and consent. Works without JavaScript. */
export function CustomerOnboarding({
  lang,
  next,
  error,
  defaults,
}: {
  lang: Locale;
  next: string;
  error?: string;
  defaults: { full_name: string; state: string; lga: string };
}) {
  return (
    <form action={completeCustomerOnboarding} className="flex flex-col gap-5">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="next" value={next} />
      {error && <Alert tone="danger">{error}</Alert>}
      <Field id="full_name" label="Full name">
        <Input id="full_name" name="full_name" required minLength={2} maxLength={120} autoComplete="name" defaultValue={defaults.full_name} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="state" label="State">
          <Select id="state" name="state" required defaultValue={defaults.state}>
            <option value="">Choose your state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="lga" label="LGA or town" optional="optional">
          <Input id="lga" name="lga" maxLength={60} defaultValue={defaults.lga} />
        </Field>
      </div>
      <fieldset className="flex flex-col gap-2.5 rounded-xl bg-surface-container-low p-4 text-body-sm text-on-surface">
        <label className="flex items-start gap-2.5">
          <input type="checkbox" name="consent_terms" required className="mt-0.5 size-4 accent-[#14532d]" />
          <span>
            I accept the{" "}
            <Link href={`/${lang}/terms`} className="font-semibold text-secondary underline-offset-4 hover:underline">
              terms of use
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-2.5">
          <input type="checkbox" name="consent_privacy" required className="mt-0.5 size-4 accent-[#14532d]" />
          <span>
            I have read the{" "}
            <Link href={`/${lang}/privacy`} className="font-semibold text-secondary underline-offset-4 hover:underline">
              privacy policy
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-2.5">
          <input type="checkbox" name="consent_data" defaultChecked className="mt-0.5 size-4 accent-[#14532d]" />
          <span>Share my delivery details with the sellers I buy from.</span>
        </label>
        <label className="flex items-start gap-2.5">
          <input type="checkbox" name="consent_marketing" className="mt-0.5 size-4 accent-[#14532d]" />
          <span>Send me offers and price alerts (optional).</span>
        </label>
      </fieldset>
      <Button type="submit" size="lg" className="w-full sm:w-auto">
        <Icon name="shopping_cart" className="text-lg" /> {next.includes("/marketplace/checkout") ? "Continue to checkout" : "Create my account"}
      </Button>
      <p className="text-body-sm text-on-surface-variant">
        Farming or selling too? You can add those roles later from Settings.
      </p>
    </form>
  );
}
