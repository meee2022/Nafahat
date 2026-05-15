import { create } from 'zustand';
import { Reciter } from '@/types/index';
import { getSurahAudioUrl } from '@data/reciters';
import { getSurahById } from '@data/surahs';
import { loadAndPlay, setPlaying, setSpeed as setSpeedAv, seekTo, unload } from '@services/audioPlayer';

interface NowPlaying {
  reciter: Reciter;
  surahId: number;
  surahName: string;
  ayahNumber?: number;
}

const SKIP_STEP_MS = 10_000;

interface AudioState {
  current: NowPlaying | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  positionMs: number;
  durationMs: number;
  speed: 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
  repeatMode: 'none' | 'one' | 'all';
  sleepTimerMin: number | null;
  /** الوقت المتبقي للموقّت بالملي ثانية - يُستخدم في الواجهة لعرض العدّ التنازلي. */
  sleepRemainingMs: number | null;
  /** عداد المفضلة للسور (سعّ تجريبي - يخزَّن في readingStore.favorites). */
  play: (n: NowPlaying) => Promise<void>;
  toggle: () => Promise<void>;
  setSpeed: (s: AudioState['speed']) => Promise<void>;
  setRepeat: (m: AudioState['repeatMode']) => void;
  setSleepTimer: (min: number | null) => void;
  seek: (ms: number) => Promise<void>;
  skipForward: (stepMs?: number) => Promise<void>;
  skipBackward: (stepMs?: number) => Promise<void>;
  /** اللعب التالي/السابق: ينتقل إلى السورة التالية أو السابقة. */
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  clearError: () => void;
  stop: () => Promise<void>;
}

// مؤقت داخلي لـ sleep timer - لا يُحفَظ في state لتجنّب re-render غير ضروري
let sleepTimeoutId: ReturnType<typeof setTimeout> | null = null;
let sleepTickId: ReturnType<typeof setInterval> | null = null;

function clearSleepInternals() {
  if (sleepTimeoutId) { clearTimeout(sleepTimeoutId); sleepTimeoutId = null; }
  if (sleepTickId)    { clearInterval(sleepTickId);   sleepTickId = null; }
}

export const useAudioStore = create<AudioState>((set, get) => ({
  current: null,
  isPlaying: false,
  isLoading: false,
  error: null,
  positionMs: 0,
  durationMs: 0,
  speed: 1,
  repeatMode: 'none',
  sleepTimerMin: null,
  sleepRemainingMs: null,

  async play(n) {
    const url = getSurahAudioUrl(n.reciter.id, n.surahId);
    if (!url) {
      set({ error: 'لم يُعثر على رابط الصوت' });
      return;
    }
    set({ current: n, isLoading: true, error: null, positionMs: 0, durationMs: 0 });
    try {
      await loadAndPlay(url, (st) => {
        set({
          isPlaying: st.isPlaying,
          positionMs: st.positionMs,
          durationMs: st.durationMs,
        });
        if (st.didJustFinish) {
          const mode = get().repeatMode;
          if (mode === 'one') {
            seekTo(0).then(() => setPlaying(true));
          } else if (mode === 'all') {
            // الانتقال للسورة التالية بشكل آلي
            get().playNext().catch(() => {});
          } else {
            set({ isPlaying: false, positionMs: 0 });
          }
        }
      });
      // طبّق سرعة التشغيل المختارة
      await setSpeedAv(get().speed);
      set({ isLoading: false, isPlaying: true });
    } catch (e: any) {
      set({ isLoading: false, isPlaying: false, error: 'تعذّر تشغيل الملف الصوتي' });
    }
  },

  async toggle() {
    const playing = !get().isPlaying;
    set({ isPlaying: playing });
    await setPlaying(playing);
  },

  async setSpeed(s) {
    set({ speed: s });
    await setSpeedAv(s);
  },

  setRepeat(m) { set({ repeatMode: m }); },

  setSleepTimer(min) {
    clearSleepInternals();
    if (min === null) {
      set({ sleepTimerMin: null, sleepRemainingMs: null });
      return;
    }
    const totalMs = min * 60 * 1000;
    const startedAt = Date.now();
    set({ sleepTimerMin: min, sleepRemainingMs: totalMs });

    // عدّ تنازلي للعرض
    sleepTickId = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const left = totalMs - elapsed;
      if (left <= 0) {
        set({ sleepRemainingMs: 0 });
        return;
      }
      set({ sleepRemainingMs: left });
    }, 1000);

    // الإيقاف الفعلي بعد المدة
    sleepTimeoutId = setTimeout(async () => {
      clearSleepInternals();
      const st = get();
      if (st.isPlaying) {
        set({ isPlaying: false });
        try { await setPlaying(false); } catch {}
      }
      set({ sleepTimerMin: null, sleepRemainingMs: null });
    }, totalMs);
  },

  async seek(ms) {
    set({ positionMs: ms });
    await seekTo(ms);
  },

  async skipForward(stepMs = SKIP_STEP_MS) {
    const { positionMs, durationMs } = get();
    const target = Math.min(durationMs || Number.MAX_SAFE_INTEGER, positionMs + stepMs);
    set({ positionMs: target });
    await seekTo(target);
  },

  async skipBackward(stepMs = SKIP_STEP_MS) {
    const { positionMs } = get();
    const target = Math.max(0, positionMs - stepMs);
    set({ positionMs: target });
    await seekTo(target);
  },

  async playNext() {
    const cur = get().current;
    if (!cur) return;
    const nextId = cur.surahId + 1;
    if (nextId > 114) {
      // وصلنا لنهاية المصحف - أوقف
      set({ isPlaying: false, positionMs: 0 });
      try { await setPlaying(false); } catch {}
      return;
    }
    // نعتمد على getSurahById للاسم الصحيح
    const next = getSurahById(nextId);
    await get().play({ reciter: cur.reciter, surahId: nextId, surahName: next?.nameAr ?? `سورة ${nextId}` });
  },

  async playPrev() {
    const cur = get().current;
    if (!cur) return;
    const prevId = cur.surahId - 1;
    if (prevId < 1) {
      // قبل الفاتحة - أعد للبداية
      await get().seek(0);
      return;
    }
    const prev = getSurahById(prevId);
    await get().play({ reciter: cur.reciter, surahId: prevId, surahName: prev?.nameAr ?? `سورة ${prevId}` });
  },

  clearError() { set({ error: null }); },

  async stop() {
    clearSleepInternals();
    set({ isPlaying: false, current: null, positionMs: 0, durationMs: 0, sleepTimerMin: null, sleepRemainingMs: null });
    await unload();
  },
}));
