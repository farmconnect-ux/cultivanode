import { brand } from "@tillmate/shared/brand";

/** Brand mark (a seedling over furrows), drawn from the shared brand config so a rename is one edit. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  const l = brand.logo;
  return (
    <svg viewBox={l.viewBox} className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill={l.background} />
      <path d={l.stem.d} stroke={l.stem.stroke} strokeWidth={l.stem.strokeWidth} strokeLinecap="round" />
      <path d={l.leafLeft.d} fill={l.leafLeft.fill} />
      <path d={l.leafRight.d} fill={l.leafRight.fill} />
      <path d={l.furrows.d} stroke={l.furrows.stroke} strokeWidth={l.furrows.strokeWidth} strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight text-leaf-800">{brand.name}</span>
    </span>
  );
}
