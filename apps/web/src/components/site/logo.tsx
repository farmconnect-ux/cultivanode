import { brand } from "@cultivanode/shared/brand";

/** Brand mark (a "C" of connected nodes), drawn from the shared brand config so a restyle is one edit. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  const l = brand.logo;
  return (
    <svg viewBox={l.viewBox} className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill={l.background} />
      {l.shapes.map((s, i) =>
        s.kind === "circle" ? (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} />
        ) : (
          <path key={i} d={s.d} fill="none" stroke={s.stroke} strokeWidth={s.strokeWidth} strokeLinecap="round"
                strokeLinejoin="round" opacity={"opacity" in s ? s.opacity : undefined} />
        ),
      )}
    </svg>
  );
}

/**
 * Mark plus word mark. The capital N is part of the name: Cultiva + Node, with "Node" in the brand cyan.
 * On light backgrounds the cyan is the darker node-600 so the word mark keeps enough contrast.
 */
export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`text-xl font-extrabold tracking-tight ${tone === "dark" ? "text-cream" : "text-leaf-800"}`}>
        Cultiva<span className={tone === "dark" ? "text-node-300" : "text-node-600"}>Node</span>
      </span>
    </span>
  );
}
