export const SCORE_COLORS = {
  darkRed: '#7f1d1d', red: '#dc2626', yellow: '#eab308', green: '#16a34a', blue: '#2563eb',
} as const;

export function normalizeScore(value: number | null) {
  return value !== null && Number.isFinite(value) ? Math.min(10, Math.max(0, value)) : null;
}

function interpolateColor(start: string, end: string, amount: number) {
  const channels = [1, 3, 5].map((index) => Math.round(
    Number.parseInt(start.slice(index, index + 2), 16)
      + (Number.parseInt(end.slice(index, index + 2), 16)
        - Number.parseInt(start.slice(index, index + 2), 16)) * amount,
  ));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

export function scoreColorFor(value: number | null) {
  const score = normalizeScore(value);
  if (score === null) return null;
  if (score <= 3) return interpolateColor(SCORE_COLORS.darkRed, SCORE_COLORS.red, score / 3);
  if (score < 6) return interpolateColor(SCORE_COLORS.red, SCORE_COLORS.yellow, (score - 3) / 3);
  if (score <= 8) return interpolateColor(SCORE_COLORS.yellow, SCORE_COLORS.green, (score - 6) / 2);
  return interpolateColor(SCORE_COLORS.green, SCORE_COLORS.blue, (score - 8) / 2);
}
