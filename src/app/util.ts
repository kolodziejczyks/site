/** Polish pluralization for "wpis" (post): 1 wpis / 2–4 wpisy / 5+ wpisów. */
export function plPosts(n: number): string {
  const abs = Math.abs(n) % 100;
  const dec = abs % 10;
  let word: string;
  if (abs === 1) word = 'wpis';
  else if (dec >= 2 && dec <= 4 && !(abs >= 12 && abs <= 14)) word = 'wpisy';
  else word = 'wpisów';
  return `${n} ${word}`;
}

/** Polish "cited in N post(s)" phrasing used in the Sources detail header. */
export function plCitedIn(n: number): string {
  const abs = Math.abs(n) % 100;
  const dec = abs % 10;
  let word: string;
  if (abs === 1) word = 'wpisie';
  else if (dec >= 2 && dec <= 4 && !(abs >= 12 && abs <= 14)) word = 'wpisach';
  else word = 'wpisach';
  return `Cytowane w ${n} ${word}`;
}

const PL_DATE = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Format a YYYY-MM-DD string as a pl-PL short date (e.g. "10 lip 2026"). */
export function formatPlDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return PL_DATE.format(new Date(y, m - 1, d));
}
