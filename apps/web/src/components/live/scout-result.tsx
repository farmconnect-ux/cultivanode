import type { FieldSpec } from "@/components/live/action-form";
import { ActionButton } from "@/components/live/action-form";
import { Pill } from "@/components/live/kit";
import { Icon } from "@/components/ds/icon";
import { analyseObservationPhotos } from "@/actions/farm-ops";
import type { Diagnosis } from "@/lib/ai-vision";

/** The photo field for the scouting forms (camera or gallery on a phone). */
export const SCOUT_PHOTO_FIELD: FieldSpec = {
  name: "photos",
  label: "Photos of the problem",
  type: "photos",
  maxFiles: 4,
  hint: "Up to 4. One close-up of the damage and one of the whole plant work best. The AI looks at them when photo analysis is on.",
};

type Props = {
  id: string;
  lang: string;
  photos: string[];
  signed: Map<string, string>;
  diagnosis: Diagnosis | null;
  analysedAt: string | null;
  aiOn: boolean;
};

const CONF_TONE = { high: "critical", medium: "caution", low: "neutral" } as const;

/** Photos and the AI's suggestion for one scouting observation. */
export function ScoutResult({ id, lang, photos, signed, diagnosis, analysedAt, aiOn }: Props) {
  const urls = photos.map((p) => signed.get(p) ?? (p.startsWith("http") ? p : null)).filter((u): u is string => Boolean(u));
  if (!urls.length && !diagnosis) return null;
  return (
    <div className="flex flex-col gap-2">
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((u) => (
            <a key={u} href={u} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed link */}
              <img src={u} alt="Scouting photo" className="h-20 w-20 rounded-lg object-cover ring-1 ring-outline-variant/60" />
            </a>
          ))}
        </div>
      )}

      {diagnosis ? (
        <div className="flex flex-col gap-2 rounded-xl border border-secondary/30 bg-secondary-container/15 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="auto_awesome" className="text-base text-secondary" />
            <p className="font-label-md text-label-md text-on-surface">AI suggestion</p>
            {diagnosis.urgent && <Pill tone="critical" icon="warning">Act within days</Pill>}
          </div>
          {diagnosis.summary && <p className="text-body-sm text-on-surface">{diagnosis.summary}</p>}
          {diagnosis.likely.length > 0 && (
            <ul className="flex flex-col gap-1">
              {diagnosis.likely.map((l) => (
                <li key={l.name} className="text-body-sm">
                  <span className="font-label-md text-on-surface">{l.name}</span> <Pill tone={CONF_TONE[l.confidence]}>{`${l.confidence} confidence`}</Pill>
                  {l.why && <span className="block text-on-surface-variant">{l.why}</span>}
                </li>
              ))}
            </ul>
          )}
          {diagnosis.checks.length > 0 && (
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Check in the field</p>
              <ul className="list-disc pl-5 text-body-sm text-on-surface">{diagnosis.checks.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          )}
          {diagnosis.actions.length > 0 && (
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">What you can do</p>
              <ul className="list-disc pl-5 text-body-sm text-on-surface">{diagnosis.actions.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          )}
          {diagnosis.safety.map((s) => (
            <p key={s} className="rounded-lg bg-caution-soft px-2 py-1 text-body-sm text-[#92400e]">{s}</p>
          ))}
          {diagnosis.see_expert_if && <p className="text-body-sm text-on-surface-variant">Call an extension agent if: {diagnosis.see_expert_if}</p>}
          <p className="text-[12px] text-on-surface-variant">
            AI can be wrong. Confirm in the field, follow the product label, and ask an agronomist before spraying.
            {analysedAt ? ` Analysed ${new Date(analysedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.` : ""}
          </p>
        </div>
      ) : null}

      {aiOn && urls.length > 0 && (
        <div>
          <ActionButton action={analyseObservationPhotos} hidden={{ lang, id }} label={diagnosis ? "Analyse again" : "Analyse photos"} icon="auto_awesome" tone="ghost" />
        </div>
      )}
    </div>
  );
}
