#!/usr/bin/env node
/**
 * One-off codemod: moves pages and components from the original brand utility classes
 * (leaf-*, cream, ink, muted, line, harvest-*, danger) to the Agro-Enterprise suite tokens
 * defined in src/app/globals.css (primary, surface-*, on-surface-variant, caution, critical …).
 *
 * Usage (from the repo root):
 *   node apps/web/scripts/migrate-legacy-classes.mjs            # rewrite files in place
 *   node apps/web/scripts/migrate-legacy-classes.mjs --dry-run  # list what would change
 *
 * Only class-like tokens are touched (e.g. "hover:bg-leaf-700"), so text content is safe.
 * The brand palette stays in globals.css for the logo, charts and the mobile app.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "src");
const DRY = process.argv.includes("--dry-run");
// Already on the suite, or intentionally brand-coloured.
const SKIP = ["components/ds/", "components/shadcn/", "components/screens/", "components/site/logo.tsx", "app/globals.css"];

const leaf = {
  50: { bg: "surface-container-low", text: "secondary", border: "secondary/20" },
  100: { bg: "secondary-container/40", text: "on-primary/80", border: "secondary/20" },
  200: { bg: "secondary-container/60", text: "on-primary/70", border: "secondary/30" },
  300: { bg: "secondary-fixed-dim", text: "secondary-fixed-dim", border: "secondary/40" },
  400: { bg: "secondary", text: "secondary", border: "secondary" },
  500: { bg: "secondary", text: "secondary", border: "secondary" },
  600: { bg: "primary-container", text: "secondary", border: "primary-container" },
  700: { bg: "primary-container", text: "primary-container", border: "primary-container" },
  800: { bg: "primary", text: "primary", border: "primary" },
  900: { bg: "primary", text: "primary", border: "primary" },
  950: { bg: "primary", text: "primary", border: "primary" },
};
const harvest = {
  50: { bg: "caution-soft", text: "caution", border: "caution/20" },
  100: { bg: "tertiary-fixed/60", text: "caution", border: "caution/25" },
  200: { bg: "tertiary-fixed", text: "caution", border: "caution/30" },
  300: { bg: "tertiary-fixed-dim", text: "tertiary-fixed-dim", border: "caution/40" },
  400: { bg: "caution", text: "caution", border: "caution" },
  500: { bg: "caution", text: "[#b45309]", border: "caution" },
  600: { bg: "caution", text: "[#b45309]", border: "caution" },
  700: { bg: "tertiary-container", text: "[#b45309]", border: "caution" },
  800: { bg: "tertiary-container", text: "[#92400e]", border: "caution" },
  900: { bg: "tertiary", text: "[#78350f]", border: "caution" },
};
const flat = {
  cream: { bg: "surface-container-low", text: "inverse-on-surface", border: "surface-container" },
  ink: { bg: "inverse-surface", text: "on-surface", border: "on-surface" },
  muted: { bg: "surface-container", text: "on-surface-variant", border: "outline-variant" },
  line: { bg: "surface-container", text: "outline-variant", border: "border" },
  danger: { bg: "critical", text: "critical", border: "critical" },
};
const kindOf = (prop) =>
  ["bg", "from", "to", "via"].includes(prop) ? "bg" : ["border", "divide", "ring", "outline"].includes(prop) ? "border" : "text";

const RE = /(?<=^|[\s"'`{(:!])((?:[a-z0-9-]+:)*)(bg|text|border(?:-[trblxy])?|ring|divide|outline|from|to|via|fill|stroke|accent|decoration|placeholder)-(leaf|harvest|cream|ink|muted|line|danger)(?:-(\d{2,3}))?(\/\d{1,3})?(?=$|[\s"'`})])/g;

function map(_m, variants, prop, token, shade, alpha) {
  const base = prop.startsWith("border-") ? "border" : prop;
  const table = token === "leaf" ? leaf[shade ?? 600] : token === "harvest" ? harvest[shade ?? 500] : flat[token];
  if (!table) return _m;
  let target = table[kindOf(base)];
  if (!target) return _m;
  if (alpha && !target.includes("/")) target += alpha;
  return `${variants}${prop}-${target}`;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  if (SKIP.some((s) => rel.startsWith(s))) continue;
  const src = readFileSync(file, "utf8");
  const next = src.replace(RE, map);
  if (next !== src) {
    changed++;
    if (DRY) console.log("would update", rel);
    else writeFileSync(file, next);
  }
}
console.log(`${DRY ? "Would update" : "Updated"} ${changed} file(s).`);
