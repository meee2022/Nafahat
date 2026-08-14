export type AudioRepeatMode = 'none' | 'one' | 'all';

export function nextSurahId(current: number, repeatMode: AudioRepeatMode): number | null {
  if (!Number.isInteger(current) || current < 1 || current > 114) return null;
  if (repeatMode === 'one') return current;
  if (current < 114) return current + 1;
  return repeatMode === 'all' ? 1 : null;
}

export function previousSurahId(current: number): number {
  if (!Number.isInteger(current) || current <= 1) return 1;
  return Math.min(114, current - 1);
}
