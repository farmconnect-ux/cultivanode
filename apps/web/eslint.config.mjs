import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const AUDIT_WRITER_PATTERN = /(^|[.\s])write_ai_audit_event$/i;

/**
 * Custom AST rule enforcing the Batch 03.1C / 03.1D application boundary (ADR-005):
 * Only `apps/web/src/lib/ai-audit.ts` may statically reference or invoke the privileged
 * `write_ai_audit_event` RPC (direct literals, schema-qualified names, template literals,
 * string concatenation, array `.join(...)`, constant/object bindings, aliased clients,
 * destructured/aliased `.rpc` methods, and wrapper functions).
 *
 * Security note: ESLint is a static-analysis guardrail, NOT a PostgreSQL privilege boundary.
 * Runtime-obfuscated strings (e.g., decoded from external env/base64) cannot be proven by AST
 * inspection alone; PostgreSQL ACLs and `private.write_ai_audit_event` remain authoritative.
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
        "Direct or indirect invocation of write_ai_audit_event is prohibited outside apps/web/src/lib/ai-audit.ts. Use recordAiAuditEvent() from @/lib/ai-audit instead.",
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

    /** @type {Map<string, string>} */
    const stringBindings = new Map();
    /** @type {Map<string, Map<string, string>>} */
    const objectStringBindings = new Map();
    /** @type {Set<string>} */
    const rpcAliases = new Set();
    /** @type {Set<object>} */
    const reportedNodes = new Set();

    const reportOnce = (node) => {
      if (!node || reportedNodes.has(node)) return;
      reportedNodes.add(node);
      context.report({ node, messageId: "forbidden" });
    };

    const resolveStaticString = (node, depth = 0) => {
      if (!node || depth > 8) return null;

      if (node.type === "Literal" && typeof node.value === "string") {
        return node.value;
      }

      if (node.type === "Identifier") {
        return stringBindings.has(node.name) ? stringBindings.get(node.name) : null;
      }

      if (node.type === "MemberExpression" && node.object?.type === "Identifier") {
        const objMap = objectStringBindings.get(node.object.name);
        if (!objMap) return null;
        const propName = !node.computed && node.property?.type === "Identifier"
          ? node.property.name
          : resolveStaticString(node.property, depth + 1);
        return propName && objMap.has(propName) ? objMap.get(propName) : null;
      }

      if (node.type === "TemplateLiteral") {
        let out = "";
        for (let i = 0; i < node.quasis.length; i++) {
          out += node.quasis[i].value.cooked ?? node.quasis[i].value.raw;
          if (i < node.expressions.length) {
            const exprVal = resolveStaticString(node.expressions[i], depth + 1);
            if (exprVal === null) return null;
            out += exprVal;
          }
        }
        return out;
      }

      if (node.type === "BinaryExpression" && node.operator === "+") {
        const left = resolveStaticString(node.left, depth + 1);
        const right = resolveStaticString(node.right, depth + 1);
        if (left !== null && right !== null) return left + right;
        return null;
      }

      // Detect `["write", "ai", "audit", "event"].join("_")`
      if (
        node.type === "CallExpression" &&
        node.callee?.type === "MemberExpression" &&
        !node.callee.computed &&
        node.callee.property?.type === "Identifier" &&
        node.callee.property.name === "join" &&
        node.callee.object?.type === "ArrayExpression"
      ) {
        const sep = node.arguments.length === 0 ? "," : resolveStaticString(node.arguments[0], depth + 1);
        if (sep === null) return null;
        const parts = [];
        for (const el of node.callee.object.elements) {
          const val = resolveStaticString(el, depth + 1);
          if (val === null) return null;
          parts.push(val);
        }
        return parts.join(sep);
      }

      return null;
    };

    const matchesAuditWriter = (value) =>
      typeof value === "string" && AUDIT_WRITER_PATTERN.test(value.trim());

    const isRpcProperty = (memberExpr) => {
      if (!memberExpr || memberExpr.type !== "MemberExpression") return false;
      if (!memberExpr.computed && memberExpr.property?.type === "Identifier") {
        return memberExpr.property.name === "rpc";
      }
      return resolveStaticString(memberExpr.property) === "rpc";
    };

    return {
      VariableDeclarator(node) {
        // Track constant/variable string bindings: `const fn = "write_ai_" + "audit_event"`
        if (node.id?.type === "Identifier" && node.init) {
          const resolved = resolveStaticString(node.init);
          if (resolved !== null) {
            stringBindings.set(node.id.name, resolved);
            if (matchesAuditWriter(resolved)) {
              reportOnce(node.init);
            }
          }

          // Track object literal string maps: `const RPCS = { audit: "write_ai_audit_event" }`
          if (node.init.type === "ObjectExpression") {
            const propMap = new Map();
            for (const prop of node.init.properties) {
              if (prop.type !== "Property") continue;
              const keyName = !prop.computed && prop.key?.type === "Identifier"
                ? prop.key.name
                : resolveStaticString(prop.key);
              const val = resolveStaticString(prop.value);
              if (keyName && val !== null) {
                propMap.set(keyName, val);
                if (matchesAuditWriter(val)) {
                  reportOnce(prop.value);
                }
              }
            }
            if (propMap.size > 0) objectStringBindings.set(node.id.name, propMap);
          }

          // Track aliased `.rpc` method: `const callRpc = admin.rpc` or `const callRpc = admin["rpc"]`
          if (isRpcProperty(node.init)) {
            rpcAliases.add(node.id.name);
          }
          // Track `.rpc.bind(...)` alias: `const callRpc = admin.rpc.bind(admin)`
          if (
            node.init.type === "CallExpression" &&
            node.init.callee?.type === "MemberExpression" &&
            !node.init.callee.computed &&
            node.init.callee.property?.type === "Identifier" &&
            node.init.callee.property.name === "bind" &&
            isRpcProperty(node.init.callee.object)
          ) {
            rpcAliases.add(node.id.name);
          }
        }

        // Track destructured `.rpc` method: `const { rpc } = admin` or `const { rpc: invoke } = admin`
        if (node.id?.type === "ObjectPattern") {
          for (const prop of node.id.properties) {
            if (prop.type !== "Property") continue;
            const keyName = !prop.computed && prop.key?.type === "Identifier"
              ? prop.key.name
              : resolveStaticString(prop.key);
            if (keyName === "rpc" && prop.value?.type === "Identifier") {
              rpcAliases.add(prop.value.name);
            }
          }
        }
      },

      Literal(node) {
        if (typeof node.value === "string" && matchesAuditWriter(node.value)) {
          reportOnce(node);
        }
      },

      TemplateLiteral(node) {
        const resolved = resolveStaticString(node);
        if (matchesAuditWriter(resolved)) {
          reportOnce(node);
          return;
        }
        // Even if an expression is dynamic (e.g. `${schema}.write_ai_audit_event`), check joined quasis.
        const rawQuasis = node.quasis.map((q) => q.value.cooked ?? q.value.raw).join("").trim();
        if (matchesAuditWriter(rawQuasis)) {
          reportOnce(node);
        }
      },

      BinaryExpression(node) {
        if (node.operator !== "+") return;
        const resolved = resolveStaticString(node);
        if (matchesAuditWriter(resolved)) {
          reportOnce(node);
        }
      },

      CallExpression(node) {
        // Check array `.join(...)` expressions constructing the prohibited RPC name
        const resolvedCall = resolveStaticString(node);
        if (matchesAuditWriter(resolvedCall)) {
          reportOnce(node);
          return;
        }

        const callee = node.callee;
        const isDirectOrComputedRpc = isRpcProperty(callee);
        const isAliasedRpc = callee?.type === "Identifier" && rpcAliases.has(callee.name);

        if (!isDirectOrComputedRpc && !isAliasedRpc) return;

        const firstArg = resolveStaticString(node.arguments?.[0]);
        if (matchesAuditWriter(firstArg)) {
          reportOnce(node);
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
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
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
