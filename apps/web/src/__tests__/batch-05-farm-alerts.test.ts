import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en";
import yo from "@/i18n/dictionaries/yo";

/**
 * Batch 05 (part 1): farm monitors raise in-app notifications with these kinds. The inbox must
 * have words for every kind in both languages, and the farmer's answer goes through the RPC.
 */
const KINDS = ["farm_operation_upcoming", "farm_operation_overdue", "farm_task_overdue", "farm_soil_test_needed"] as const;
const root = resolve(__dirname, "../../../..");
const migration = readFileSync(resolve(root, "supabase/migrations/20261126000000_batch_05_farm_monitors.sql"), "utf8");

describe("Batch 05 farm alerts in the inbox", () => {
  it("every notification kind raised by the monitors has English and Yorùbá text", () => {
    for (const kind of KINDS) {
      expect(migration).toContain(`'${kind}'`);
      expect(en.acct.inbox.kinds[kind]).toMatch(/\{title\}/);
      expect(yo.acct.inbox.kinds[kind]).toMatch(/\{title\}/);
    }
  });

  it("alerts never name an SMS channel before a provider is contracted", () => {
    // private.notify(..., p_sms) is always called with false.
    expect(migration).toMatch(/perform private\.notify\([\s\S]*?false\s*\);/);
    expect(migration).not.toMatch(/private\.notify\([^;]*true\s*\)/);
  });

  it("the inbox answers through respond_to_intelligence_event, not a direct table write", () => {
    const action = readFileSync(resolve(__dirname, "../actions/notifications.ts"), "utf8");
    expect(action).toContain('rpc("respond_to_intelligence_event"');
    expect(action).not.toMatch(/from\("fie_intelligence_events"\)\s*\.(update|insert|delete)/);
    const page = readFileSync(resolve(__dirname, "../app/[lang]/account/inbox/page.tsx"), "utf8");
    expect(page).toContain("respondToFarmAlert");
    expect(page).toMatch(/n\.kind\.startsWith\("farm_"\)/);
  });
});
