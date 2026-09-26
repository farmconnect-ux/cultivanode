/** Tillmate mark: a sprouting seedling over three furrows. Pure SVG so it stays sharp and light. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#236639" />
      <path d="M20 27c0-6 0-9 0-12" stroke="#FAF7F0" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M20 17c-1-5-5-7-9-6 0 5 4 7 9 6Z" fill="#78BB8A" />
      <path d="M20 15c1-5 5-7 9-6 0 5-4 7-9 6Z" fill="#EFC150" />
      <path d="M8 29.5c4-2 20-2 24 0M9 33.5c4-1.6 18-1.6 22 0" stroke="#EFC150" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight text-leaf-800">Tillmate</span>
    </span>
  );
}
