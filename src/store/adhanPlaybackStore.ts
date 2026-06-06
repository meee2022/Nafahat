import { create } from 'zustand';

/**
 * حالة تشغيل الأذان الحيّة (reactive) — تسمح لأي شاشة بمعرفة هل الأذان يُرفع
 * الآن لعرض بانر إيقاف عائم. منفصلة عن منطق التشغيل في services/adhan.ts.
 */
interface AdhanPlaybackState {
  playing: boolean;
  /** اسم الصلاة التي يُؤذَّن لها حالياً (اختياري، للعرض). */
  prayerLabel: string | null;
  setPlaying: (playing: boolean, prayerLabel?: string | null) => void;
}

export const useAdhanPlaybackStore = create<AdhanPlaybackState>((set) => ({
  playing: false,
  prayerLabel: null,
  setPlaying: (playing, prayerLabel = null) =>
    set({ playing, prayerLabel: playing ? prayerLabel : null }),
}));
