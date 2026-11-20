import { describe, expect, it } from "vitest";
import enAccount from "@/i18n/dictionaries/en-account";
import yoAccount from "@/i18n/dictionaries/yo-account";
import { fill } from "@/lib/text";

const marketplaceKinds = [
  "marketplace_order_placed",
  "marketplace_order_confirmed",
  "marketplace_order_preparing",
  "marketplace_order_ready_for_pickup",
  "marketplace_order_dispatched",
  "marketplace_order_in_transit",
  "marketplace_order_delivered",
  "marketplace_order_rejected",
  "marketplace_order_accepted",
] as const;

describe("marketplace notification copy", () => {
  it.each(["en", "yo"] as const)("defines every fulfilment notification kind in %s", (locale) => {
    const kinds = locale === "en" ? enAccount.acct.inbox.kinds : yoAccount.acct.inbox.kinds;

    for (const kind of marketplaceKinds) {
      expect(kinds[kind], `Missing ${locale} translation for ${kind}`).toBeTruthy();
    }
  });

  it.each([
    ["en", enAccount.acct.inbox.kinds.marketplace_order_dispatched],
    ["yo", yoAccount.acct.inbox.kinds.marketplace_order_dispatched],
  ] as const)("renders the delivery tracking reference in %s", (_locale, template) => {
    const rendered = fill(template, {
      order_number: "CN-2026-001",
      tracking: "TRK-987654",
    });

    expect(rendered).toContain("TRK-987654");
    expect(rendered).not.toContain("{tracking}");
  });

  it("provides a safe generic message for unrecognised notification kinds in both locales", () => {
    expect(enAccount.acct.inbox.unknown).toBeTruthy();
    expect(yoAccount.acct.inbox.unknown).toBeTruthy();
  });
});
