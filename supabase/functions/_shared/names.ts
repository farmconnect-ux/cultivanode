// Compares the name on a profile with the name an ID provider returns.
// Nigerian records often reorder names, add middle names or drop one, so this is token-based
// and forgives one-letter typos in longer names.

function tokens(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // drop combining marks (Yoruba tone marks, under-dots) so accented names still match
    .toUpperCase()
    .replace(/[^A-Z\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length >= 2);
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function tokenMatches(a: string, b: string): boolean {
  if (a === b) return true;
  return a.length >= 5 && b.length >= 5 && editDistanceAtMostOne(a, b);
}

export type NameMatch = { score: number; passed: boolean };

/**
 * score = share of the profile's name parts found in the provider's name (0..1).
 * Passes when at least two parts match, or every part when the profile has only one.
 */
export function matchNames(profileName: string, providerName: string): NameMatch {
  const mine = [...new Set(tokens(profileName))];
  const theirs = [...new Set(tokens(providerName))];
  if (mine.length === 0 || theirs.length === 0) return { score: 0, passed: false };
  const matched = mine.filter((m) => theirs.some((t) => tokenMatches(m, t))).length;
  const score = Math.round((matched / mine.length) * 1000) / 1000;
  const passed = matched >= 2 || (mine.length === 1 && matched === 1);
  return { score, passed };
}
