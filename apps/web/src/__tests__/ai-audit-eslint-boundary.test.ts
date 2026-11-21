import { describe, expect, it } from "vitest";
import { Linter, type Rule } from "eslint";
import { noDirectAiAuditWriterRule } from "../../eslint.config.mjs";

function lintSnippet(code: string, filename: string) {
  const linter = new Linter({ configType: "flat" });
  return linter.verify(
    code,
    [
      {
        languageOptions: { ecmaVersion: 2022, sourceType: "module" },
        plugins: {
          cultivanode: {
            rules: {
              "no-direct-ai-audit-writer":
                noDirectAiAuditWriterRule as unknown as Rule.RuleModule,
            },
          },
        },
        rules: {
          "cultivanode/no-direct-ai-audit-writer": "error",
        },
      },
    ],
    filename,
  );
}

describe("ESLint boundary: cultivanode/no-direct-ai-audit-writer", () => {
  it("allows apps/web/src/lib/ai-audit.ts to invoke write_ai_audit_event", () => {
    const messages = lintSnippet(
      `export async function write(admin) { return admin.rpc("write_ai_audit_event", {}); }`,
      "apps/web/src/lib/ai-audit.ts",
    );
    expect(messages).toHaveLength(0);
  });

  it("allows unrelated service-role RPCs (payment webhooks, account deletion) in other modules", () => {
    const messages = lintSnippet(
      `
        export async function run(admin) {
          await admin.rpc("process_payment_webhook", {});
          await admin.rpc("execute_account_deletion", {});
        }
      `,
      "apps/web/src/app/api/webhooks/paystack/route.ts",
    );
    expect(messages).toHaveLength(0);
  });

  it("blocks direct, schema-qualified, computed-property, template-literal, and variable-indirection calls in unapproved modules", () => {
    const bypasses = [
      `admin.rpc("write_ai_audit_event", {});`,
      `admin.rpc("public.write_ai_audit_event", {});`,
      `admin.schema("private").rpc("write_ai_audit_event", {});`,
      `admin.rpc("private.write_ai_audit_event", {});`,
      `admin["rpc"]("write_ai_audit_event", {});`,
      "admin.rpc(`write_ai_audit_event`, {});",
      `const fn = "write_ai_audit_event"; admin.rpc(fn, {});`,
    ];

    for (const snippet of bypasses) {
      const messages = lintSnippet(snippet, "apps/web/src/app/api/ai/rogue/route.ts");
      expect(messages.length, `Expected ESLint error for: ${snippet}`).toBeGreaterThan(0);
      expect(messages[0]?.ruleId).toBe("cultivanode/no-direct-ai-audit-writer");
    }
  });
});
