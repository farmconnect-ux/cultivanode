import type { AppLanguage } from '../../roles';

/**
 * Batch 03.4 (LFC-AC-04): when more than one active crop cycle matches the request and the
 * farmer has not selected one, the assistant must not guess. The server returns
 * `subject_ambiguous` with the candidate cycles, and no crop-specific numeric output is produced.
 */
export interface SubjectCandidate {
  cycleId: string;
  cropId: string;
  plotId: string | null;
  plotName: string | null;
  status: string;
  currentStage: string;
  plantingDate: string;
}

export interface SubjectAmbiguity {
  status: 'subject_ambiguous';
  reasonCode: 'crop_cycle_ambiguous';
  candidates: SubjectCandidate[];
}

/** Upper bound on candidates passed to the model and the client. */
export const MAX_SUBJECT_CANDIDATES = 12;

export function buildSubjectAmbiguity(
  cycles: ReadonlyArray<{
    cycleId: string;
    cropId: string;
    plotId: string | null;
    status: string;
    currentStage: string;
    plantingDate: string;
  }>,
  plotNames: ReadonlyMap<string, string> = new Map(),
): SubjectAmbiguity | null {
  if (cycles.length < 2) return null;
  return {
    status: 'subject_ambiguous',
    reasonCode: 'crop_cycle_ambiguous',
    candidates: cycles.slice(0, MAX_SUBJECT_CANDIDATES).map((c) => ({
      cycleId: c.cycleId,
      cropId: c.cropId,
      plotId: c.plotId,
      plotName: c.plotId ? (plotNames.get(c.plotId) ?? null) : null,
      status: c.status,
      currentStage: c.currentStage,
      plantingDate: c.plantingDate,
    })),
  };
}

function clean(value: string | null | undefined, max: number): string {
  return (value ?? '')
    .replace(/[\u0000-\u001f\u007f<>`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Short human label for one candidate, e.g. "Maize on North plot (planted 2026-09-01)". */
export function describeSubjectCandidate(c: SubjectCandidate, lang: AppLanguage | 'pcm' = 'en'): string {
  const crop = clean(c.cropId, 40) || (lang === 'yo' ? 'Irugbin' : 'Crop');
  const cropLabel = crop.charAt(0).toUpperCase() + crop.slice(1);
  const plot = clean(c.plotName, 60);
  const planted = clean(c.plantingDate, 10);
  if (lang === 'yo') {
    return `${cropLabel}${plot ? ` ní ${plot}` : ''}${planted ? ` (a gbìn ín ${planted})` : ''}`;
  }
  return `${cropLabel}${plot ? ` on ${plot}` : ''}${planted ? ` (planted ${planted})` : ''}`;
}

/** Instruction block added to the model prompt when the subject is ambiguous. */
export function formatSubjectAmbiguityNotice(a: SubjectAmbiguity): string {
  const list = a.candidates.map((c, i) => `${i + 1}. ${describeSubjectCandidate(c)}`).join('\n');
  return `SUBJECT AMBIGUOUS: the farmer has ${a.candidates.length} active crop cycles and did not say which one this question is about:
${list}
Do NOT guess which crop cycle is meant. Do NOT give quantities, rates, doses, spacing, plant counts, dates, days or yields for any particular crop or cycle. You may give short general guidance that is true for all of them, then ask the farmer to pick the crop and plot the question is about.`;
}

/** Clarifying question appended to deterministic (rule engine) answers. */
export function subjectClarificationQuestion(a: SubjectAmbiguity, lang: AppLanguage | 'pcm' = 'en'): string {
  const list = a.candidates.map((c) => `- ${describeSubjectCandidate(c, lang)}`).join('\n');
  if (lang === 'yo') {
    return `O ní irugbin ${a.candidates.length} tí ń lọ lọ́wọ́. Èwo ni ìbéèrè yìí jẹ mọ́?\n${list}\nYan ọ̀kan kí n lè fún ọ ní ìmọ̀ràn tó péye fún un.`;
  }
  if (lang === 'pcm') {
    return `You get ${a.candidates.length} crops wey dey grow now. Which one dis question be for?\n${list}\nPick one make I fit give you correct advice for am.`;
  }
  return `You have ${a.candidates.length} active crops. Which one is this question about?\n${list}\nPick one so I can give advice for that crop and plot.`;
}
