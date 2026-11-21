import { describe, expect, it } from "vitest";
import { Linter, type Rule } from "eslint";
import { noDirectAiAuditWriterRule } from "../../eslint.config.mjs";

function lintSnippet(code: string, filename: string) {
  const linter = new Linter({ configType: "flat" });
  return linter.verify(
    code,
    [
      {
        files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
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

describe("ESLint boundary: cultivanode/no-direct-ai-audit-writer (Finding 08)", () => {
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
          const { rpc } = admin;
          await admin.rpc("process_payment_webhook", {});
          await rpc("execute_account_deletion", {});
        }
      `,
      "apps/web/src/app/api/webhooks/paystack/route.ts",
    );
    expect(messages).toHaveLength(0);
  });

  it("blocks direct, schema-qualified, aliased-client, constant, object-map, concatenation, array-join, template-literal, destructured-rpc, and wrapper-function invocations outside ai-audit.ts", () => {
    const forbiddenSnippets = [
      // Direct and schema-qualified calls
      `export async function bad(admin) { return admin.rpc("write_ai_audit_event", {}); }`,
      `export async function bad(admin) { return admin.rpc("public.write_ai_audit_event", {}); }`,
      `export async function bad(admin) { return admin.rpc("private.write_ai_audit_event", {}); }`,
      // Computed property + template literal
      `export async function bad(admin) { return admin["rpc"](\`write_ai_audit_event\`, {}); }`,
      `export async function bad(admin) { return admin["r" + "pc"]("write_ai_audit_event", {}); }`,
      // Aliased Supabase client + constant reference
      `const db = createServiceClient(); const fn = "write_ai_audit_event"; db.rpc(fn, {});`,
      // String concatenation and chained constant composition
      `const prefix = "write_ai_"; const suffix = "audit_event"; export const run = (c) => c.rpc(prefix + suffix, {});`,
      `export const run = (c) => c.rpc("public." + "write_ai_" + "audit_event", {});`,
      // Template literal interpolation
      `const schema = "public"; const name = \`\${schema}.write_ai_audit_event\`; export const run = (c) => c.rpc(name, {});`,
      `export const run = (c, s) => c.rpc(\`\${s}.write_ai_audit_event\`, {});`,
      // Array join construction
      `const fn = ["write", "ai", "audit", "event"].join("_"); export const run = (c) => c.rpc(fn, {});`,
      // Destructured and aliased rpc methods
      `export async function bad(admin) { const { rpc } = admin; return rpc("write_ai_audit_event", {}); }`,
      `export async function bad(admin) { const { rpc: callRpc } = admin; return callRpc("public.write_ai_audit_event", {}); }`,
      `export async function bad(admin) { const invoke = admin.rpc.bind(admin); return invoke("write_ai_audit_event", {}); }`,
      // Object map indirection & wrapper function
      `const RPCS = { audit: "write_ai_audit_event" }; export function wrap(c, p) { return c.rpc(RPCS.audit, p); }`,
    ];

    for (const snippet of forbiddenSnippets) {
      const messages = lintSnippet(snippet, "apps/web/src/app/api/ai/route.ts");
      expect(messages.length, `Expected ESLint error for: ${snippet}`).toBeGreaterThan(0);
      expect(messages[0]?.ruleId).toBe("cultivanode/no-direct-ai-audit-writer");
    }
  });
});
