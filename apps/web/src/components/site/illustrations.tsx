// Simple, light illustrations for the hero. Replace with real pilot-farm photos when available
// (the plan calls for them); keep each image under ~150 KB for low-bandwidth visitors.

const sky = "#FDF7E7";

export function PlanScene() {
  return (
    <svg viewBox="0 0 480 320" className="h-full w-full" role="presentation">
      <rect width="480" height="320" fill={sky} />
      <circle cx="400" cy="70" r="34" fill="#EFC150" />
      <path d="M0 210 Q120 170 240 200 T480 190 V320 H0Z" fill="#78BB8A" />
      <path d="M0 240 Q140 205 260 232 T480 225 V320 H0Z" fill="#4A9C62" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`translate(${40 + i * 62} ${250 + (i % 2) * 6})`}>
          <path d="M0 30 V8" stroke="#1F5130" strokeWidth="3" strokeLinecap="round" />
          <path d="M0 14 C-10 6 -14 -2 -12 -6 C-4 -4 0 4 0 14Z" fill="#236639" />
          <path d="M0 10 C10 2 14 -6 12 -10 C4 -8 0 0 0 10Z" fill="#2F7F47" />
        </g>
      ))}
      <g transform="translate(60 40)">
        <rect width="170" height="150" rx="14" fill="#FFFFFF" stroke="#DAD6CC" strokeWidth="2" />
        <rect width="170" height="36" rx="14" fill="#236639" />
        <rect y="22" width="170" height="14" fill="#236639" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4].map((c) => (
            <rect key={`${r}-${c}`} x={14 + c * 30} y={50 + r * 24} width="22" height="16" rx="4" fill={r === 1 && c === 2 ? "#EFC150" : r === 2 && c === 4 ? "#78BB8A" : "#EEF7F0"} />
          )),
        )}
      </g>
    </svg>
  );
}

export function HireScene() {
  return (
    <svg viewBox="0 0 480 320" className="h-full w-full" role="presentation">
      <rect width="480" height="320" fill={sky} />
      <path d="M0 200 H480 V320 H0Z" fill="#C3A58A" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M0 ${220 + i * 22} Q240 ${210 + i * 22} 480 ${220 + i * 22}`} stroke="#8A6546" strokeWidth="3" fill="none" />
      ))}
      <g transform="translate(150 110)">
        <rect x="40" y="30" width="110" height="60" rx="8" fill="#236639" />
        <rect x="95" y="0" width="55" height="45" rx="6" fill="#1F5130" />
        <rect x="103" y="8" width="40" height="26" rx="4" fill="#D5EBDA" />
        <rect x="20" y="55" width="40" height="18" rx="4" fill="#1F5130" />
        <circle cx="130" cy="95" r="36" fill="#33241A" />
        <circle cx="130" cy="95" r="16" fill="#EFC150" />
        <circle cx="50" cy="105" r="24" fill="#33241A" />
        <circle cx="50" cy="105" r="10" fill="#EFC150" />
        <rect x="150" y="10" width="8" height="30" rx="3" fill="#5C4130" />
      </g>
      <g transform="translate(340 40)">
        <path d="M0 0 h100 v60 h-100z" fill="#FFFFFF" stroke="#DAD6CC" strokeWidth="2" />
        <circle cx="22" cy="30" r="12" fill="#78BB8A" />
        <path d="M16 30 l5 5 l9 -10" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="42" y="20" width="46" height="8" rx="4" fill="#DAD6CC" />
        <rect x="42" y="34" width="32" height="8" rx="4" fill="#EFC150" />
      </g>
    </svg>
  );
}

export function BooksScene() {
  const bars = [60, 90, 75, 120, 150];
  return (
    <svg viewBox="0 0 480 320" className="h-full w-full" role="presentation">
      <rect width="480" height="320" fill={sky} />
      <g transform="translate(70 50)">
        <rect width="340" height="220" rx="16" fill="#FFFFFF" stroke="#DAD6CC" strokeWidth="2" />
        <path d="M30 180 H310" stroke="#DAD6CC" strokeWidth="2" />
        {bars.map((h, i) => (
          <rect key={i} x={50 + i * 55} y={180 - h} width="32" height={h} rx="6" fill={i === bars.length - 1 ? "#236639" : "#ABD6B6"} />
        ))}
        <path d="M66 110 L121 85 L176 98 L231 60 L286 30" stroke="#C98A14" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="286" cy="30" r="7" fill="#C98A14" />
      </g>
      <g transform="translate(360 220)">
        <ellipse cx="40" cy="44" rx="40" ry="12" fill="#A06B0E" />
        <ellipse cx="40" cy="34" rx="40" ry="12" fill="#C98A14" />
        <ellipse cx="40" cy="24" rx="40" ry="12" fill="#EFC150" />
        <text x="40" y="30" textAnchor="middle" fontSize="16" fontWeight="800" fill="#5C4130">₦</text>
      </g>
    </svg>
  );
}
