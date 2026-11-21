import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const AUDIT_WRITER_PATTERN = /(^|[.\s])write_ai_audit_event$/;

/**
 * Custom AST rule enforcing the Batch 03.1C application boundary (ADR-005):
 * Only `apps/web/src/lib/ai-audit.ts` may invoke the privileged `write_ai_audit_event` RPC
 * (bare, `public.write_ai_audit_event`, `private.write_ai_audit_event`, computed property
 * access, template literals, or variable indirection).
 */
export const noDirectAiAuditWriterRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Restrict privileged write_ai_audit_event RPC invocations exclusively to apps/web/src/lib/ai-audit.ts.",
    },
    messages: {
      forbidden:
        "Direct invocation of write_ai_audit_event is prohibited outside apps/web/src/lib/ai-audit.ts. Use recordAiAuditEvent() from @/lib/ai-audit instead.",
    },
    schema: [],
  },
  create(context) {
    const filename = (context.filename ?? context.getFilename?.() ?? "").replace(/\\/g, "/");
    if (
      filename.endsWith("/src/lib/ai-audit.ts") ||
      filename.endsWith("src/lib/ai-audit.ts") ||
      filename.includes("/__tests__/") ||
      filename.endsWith(".test.ts") ||
      filename.endsWith(".test.tsx")
    ) {
      return {};
    }

    const extractStringValue = (node) => {
      if (!node) return null;
      if (node.type === "Literal" && typeof node.value === "string") return node.value.trim();
      if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
        return node.quasis.map((q) => q.value.cooked ?? q.value.raw).join("").trim();
      }
      return null;
    };

    return {
      Literal(node) {
        if (typeof node.value === "string" && AUDIT_WRITER_PATTERN.test(node.value.trim())) {
          context.report({ node, messageId: "forbidden" });
        }
      },
      TemplateLiteral(node) {
        const raw = node.quasis.map((q) => q.value.cooked ?? q.value.raw).join("").trim();
        if (AUDIT_WRITER_PATTERN.test(raw)) {
          context.report({ node, messageId: "forbidden" });
        }
      },
      CallExpression(node) {
        const callee = node.callee;
        const isRpcCall =
          callee?.type === "MemberExpression" &&
          ((!callee.computed && callee.property?.type === "Identifier" && callee.property.name === "rpc") ||
            (callee.computed && extractStringValue(callee.property) === "rpc"));
        if (!isRpcCall) return;
        const firstArg = extractStringValue(node.arguments?.[0]);
        if (firstArg && AUDIT_WRITER_PATTERN.test(firstArg)) {
          context.report({ node, messageId: "forbidden" });
        }
      },
    };
  },
};

const cultivanodeSecurityPlugin = {
  rules: {
    "no-direct-ai-audit-writer": noDirectAiAuditWriterRule,
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      cultivanode: cultivanodeSecurityPlugin,
    },
    rules: {
      "cultivanode/no-direct-ai-audit-writer": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
