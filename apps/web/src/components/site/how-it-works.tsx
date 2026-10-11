"use client";

import { useId, useState } from "react";

type Audience = { key: string; label: string; steps: string[] };

/** Tabs for farmers / machinery owners / service providers (WAI-ARIA tabs pattern). */
export function HowItWorks({ audiences }: { audiences: Audience[] }) {
  const [active, setActive] = useState(0);
  const base = useId();

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + audiences.length) % audiences.length;
    setActive(next);
    document.getElementById(`${base}-tab-${next}`)?.focus();
  }

  const current = audiences[active]!;
  return (
    <div>
      <div role="tablist" aria-orientation="horizontal" className="mb-8 flex flex-wrap gap-2" onKeyDown={onKeyDown}>
        {audiences.map((a, i) => (
          <button
            key={a.key}
            id={`${base}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${base}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`min-h-12 rounded-full px-5 font-semibold transition-colors ${
              i === active ? "bg-primary-container text-white" : "border-2 border-border bg-white text-on-surface hover:border-secondary/40"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <ol
        id={`${base}-panel`}
        role="tabpanel"
        aria-labelledby={`${base}-tab-${active}`}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {current.steps.map((step, i) => (
          <li key={step} className="flex flex-col gap-3 rounded-lg border border-border bg-white p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-tertiary-fixed-dim text-lg font-extrabold text-on-surface" aria-hidden="true">
              {i + 1}
            </span>
            <p className="font-medium">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
