import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reciter } from '@/types/index';
import { getSurahAudioUrl, getReciterAyahFolder } from '@data/reciters';
import { getSurahById } from '@data/surahs';
import { loadAndPlay, setPlaying, setSpeed as setSpeedAv, seekTo, unload, fadeOutAndStop, cancelFade } from '@services/audioPlayer';
import { getAyahStartTimeMs } from '@services/verseSync';
import { getSurahTimings, type SurahTimings } from '@services/audioTimings';

const PREFS_KEY = '@nafahat/audio/prefs';

/** الحقول التي تُحفَظ في AsyncStorage فقط. */
interface AudioPrefs {
  speed: 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
  repeatMode: 'none' | 'one' | 'all';
}

function persistPrefs(prefs: AudioPrefs) {
  AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
}

interface NowPlaying {
  reciter: Reciter;
  surahId: number;
  surahName: string;
  ayahNumber?: number;
  /** قائمة الآيات للسورة - تُستخدم لحساب الـ seek time لما يبدأ من آية معيّنة. */
  ayahs?: { number: number; text: string }[];
  /** الآية اللي نبدأ منها (لو undefined → من أول السورة). */
  startAtAyah?: number;
  /** توقيتات دقيقة لكل آية (لو متوفرة) — تُستخدم للـ seek الدقيق بدل التقدير. */
  timings?: SurahTimings | null;
  /**
   * 🎯 لما المستخدم يضغط آية بعينها: نشغّل ملف الآية المنفصل (بداية مضبوطة)
   *   بدل القفز في ملف السورة. يشتغل فقط للقرّاء اللي ليهم ملفات آيات منفصلة.
   */
  exactAyah?: boolean;
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
  /**
   * 🎯 رقم الآية الجاري تشغيلها في وضع "ملف الآية المنفصل" (بداية مضبوطة).
   *   لو != null، الواجهة تستخدمه مباشرةً للتظليل بدل حساب getCurrentAyah التقريبي.
   */
  liveAyah: number | null;
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
  /** تحميل التفضيلات المحفوظة من AsyncStorage عند بدء التطبيق. */
  hydrate: () => Promise<void>;
}

// مؤقت داخلي لـ sleep timer - لا يُحفَظ في state لتجنّب re-render غير ضروري
let sleepTimeoutId: ReturnType<typeof setTimeout> | null = null;
let sleepTickId: ReturnType<typeof setInterval> | null = null;

function clearSleepInternals() {
  if (sleepTimeoutId) { clearTimeout(sleepTimeoutId); sleepTimeoutId = null; }
  if (sleepTickId)    { clearInterval(sleepTickId);   sleepTickId = null; }
}

// ─────────────────────────────────────────────
// 🎯 وضع "ملف الآية المنفصل" — تشغيل كل آية من ملفها الخاص (بداية مضبوطة).
//   نشغّل آية بعد آية بالترتيب من الآية المختارة لآخر السورة.
// ─────────────────────────────────────────────
let perAyahCtx: { folder: string; surahId: number; nums: number[]; idx: number } | null = null;

/** يبني رابط ملف آية مفردة من مجلّد everyayah. */
function ayahFileUrl(folder: string, surahId: number, ayahNumber: number): string {
  const s = String(surahId).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}

/** يحمّل ويشغّل الآية رقم idx في الطابور، مع الانتقال التلقائي للي بعدها. */
async function loadPerAyahAt(idx: number): Promise<void> {
  const ctx = perAyahCtx;
  if (!ctx) return;
  if (idx < 0 || idx >= ctx.nums.length) {
    // خلصت السورة
    perAyahCtx = null;
    useAudioStore.setState({ isPlaying: false, positionMs: 0, liveAyah: null });
    return;
  }
  ctx.idx = idx;
  const ayahNum = ctx.nums[idx];
  useAudioStore.setState({ liveAyah: ayahNum, positionMs: 0 });
  await loadAndPlay(
    ayahFileUrl(ctx.folder, ctx.surahId, ayahNum),
    (st) => {
      // تجاهل التحديثات لو اتلغى وضع الآية (المستخدم شغّل حاجة تانية)
      if (perAyahCtx !== ctx) return;
      useAudioStore.setState({
        isPlaying: st.isPlaying,
        positionMs: st.positionMs,
        durationMs: st.durationMs,
      });
      if (st.didJustFinish) {
        const mode = useAudioStore.getState().repeatMode;
        if (mode === 'one') loadPerAyahAt(ctx.idx).catch(() => {});
        else loadPerAyahAt(ctx.idx + 1).catch(() => {}); // 'none' و 'all' → كمّل للآية اللي بعدها
      }
    },
  );
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
  liveAyah: null,

  async play(n) {
    const startAyah = n.startAtAyah ?? n.ayahNumber;
    const ayahsForSeek = n.ayahs ?? [];

    // 🎯 وضع "ملف الآية المنفصل": لو المستخدم ضغط آية بعينها والقارئ عنده
    //    ملفات آيات منفصلة → نشغّلها من ملفها مباشرةً (بداية مضبوطة 100% بدون قفز).
    const ayahFolder = n.exactAyah ? getReciterAyahFolder(n.reciter.id) : null;
    if (n.exactAyah && ayahFolder && startAyah && ayahsForSeek.length > 0) {
      const nums = ayahsForSeek
        .map((a) => a.number)
        .filter((x) => x >= startAyah)
        .sort((a, b) => a - b);
      if (nums.length === 0) nums.push(startAyah);
      perAyahCtx = { folder: ayahFolder, surahId: n.surahId, nums, idx: 0 };
      try {
        const { useSettingsStore } = require('./settingsStore');
        useSettingsStore.getState().pushRecentReciter(n.reciter.id);
      } catch {}
      set({ current: n, isLoading: true, error: null, positionMs: 0, durationMs: 0, liveAyah: nums[0] });
      try {
        await loadPerAyahAt(0);
        await setSpeedAv(get().speed);
        set({ isLoading: false, isPlaying: true });
      } catch {
        set({ isLoading: false, isPlaying: false, error: 'تعذّر تشغيل الملف الصوتي' });
      }
      return;
    }

    // 🔻 الوضع العادي (ملف السورة الكامل) — نلغي أي وضع آية منفصل سابق.
    perAyahCtx = null;
    set({ liveAyah: null });

    const wantsAyahSeek = !!(startAyah && startAyah > 1 && ayahsForSeek.length > 0);
    // القارئ له توقيتات خاصة على quran.com؟ (لو لأ، الـ fallback توقيتات العفاسي)
    const reciterHasOwnTimings = n.reciter.qcfRecitationId != null;

    // 🎯 لضمان بداية دقيقة من الآية: تأكّد من وجود توقيتات قبل القفز.
    //    لو اليوزر ضغط الآية قبل ما التوقيتات تحمّل (race) أو لو مش متمرّرة،
    //    نجلبها هنا (مخزّنة بعد أوّل مرة فسريعة) بدل التقدير التقريبي بعدّ الحروف.
    let timings = n.timings ?? null;
    if (wantsAyahSeek && (!timings || timings.verses.length === 0)) {
      try { timings = await getSurahTimings(n.surahId, n.reciter.qcfRecitationId); }
      catch { timings = null; }
    }

    // 🎯 نستخدم ملف صوت التوقيتات (المطابق بالملّي ثانية) فقط لو كان فعلاً
    //    بصوت نفس القارئ المختار. القرّاء بدون qcfRecitationId توقيتاتهم تكون
    //    للعفاسي (fallback) — لو استخدمنا audioUrl بتاعها كنّا هنشغّل العفاسي
    //    بالغلط بدل القارئ المطلوب، فنرجع لملف القارئ نفسه ونستخدم التوقيتات
    //    للقفز بس (بالتناسب مع مدّة ملفه).
    const url = (reciterHasOwnTimings && timings?.audioUrl)
      ? timings.audioUrl
      : getSurahAudioUrl(n.reciter.id, n.surahId);
    if (!url) {
      set({ error: 'لم يُعثر على رابط الصوت' });
      return;
    }
    // 🆕 Track recent reciters (lazy import - avoid circular dep risk)
    try {
      const { useSettingsStore } = require('./settingsStore');
      useSettingsStore.getState().pushRecentReciter(n.reciter.id);
    } catch {}
    set({ current: n, isLoading: true, error: null, positionMs: 0, durationMs: 0 });

    // 🎯 لو محدّد آية بدء + معه قائمة الآيات → احسب موضع البداية من الـ duration
    const computeStartMs = wantsAyahSeek
      ? (durationMs: number) => getAyahStartTimeMs(startAyah as number, durationMs, ayahsForSeek, n.surahId, timings)
      : undefined;

    const onStatus = (st: { isPlaying: boolean; positionMs: number; durationMs: number; didJustFinish: boolean }) => {
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
          get().playNext().catch(() => {});
        } else {
          set({ isPlaying: false, positionMs: 0 });
        }
      }
    };

    try {
      await loadAndPlay(url, onStatus, computeStartMs);
      await setSpeedAv(get().speed);
      set({ isLoading: false, isPlaying: true });
    } catch (e: any) {
      set({ isLoading: false, isPlaying: false, error: 'تعذّر تشغيل الملف الصوتي' });
    }
  },

  async toggle() {
    // أي تفاعل يدوي يُلغي fade-out جاري (لو فيه)
    cancelFade().catch(() => {});
    const playing = !get().isPlaying;
    set({ isPlaying: playing });
    await setPlaying(playing);
  },

  async setSpeed(s) {
    set({ speed: s });
    await setSpeedAv(s);
    persistPrefs({ speed: s, repeatMode: get().repeatMode });
  },

  setRepeat(m) {
    set({ repeatMode: m });
    persistPrefs({ speed: get().speed, repeatMode: m });
  },

  setSleepTimer(min) {
    clearSleepInternals();
    cancelFade().catch(() => {});
    if (min === null) {
      set({ sleepTimerMin: null, sleepRemainingMs: null });
      return;
    }
    const totalMs = min * 60 * 1000;
    const FADE_MS = 8_000; // آخر 8 ثوانٍ هتكون fade-out ناعم بدل cut هرد
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

    // 🌙 ابدأ الـ fade-out قبل الانتهاء بـ FADE_MS عشان الصوت يخفت تدريجياً
    const fadeStartDelay = Math.max(0, totalMs - FADE_MS);
    sleepTimeoutId = setTimeout(async () => {
      const st = get();
      if (st.isPlaying) {
        // ابدأ fade تدريجي (لا يحجب الـ thread - يشتغل async)
        fadeOutAndStop(FADE_MS).catch(() => {});
        // بعد ما يخلص الـ fade، حدّث الـ state
        setTimeout(() => {
          clearSleepInternals();
          set({ isPlaying: false, sleepTimerMin: null, sleepRemainingMs: null });
        }, FADE_MS + 200);
      } else {
        // لو مفيش audio شغّال، نظّف فقط
        clearSleepInternals();
        set({ sleepTimerMin: null, sleepRemainingMs: null });
      }
    }, fadeStartDelay);
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
    perAyahCtx = null;
    set({ isPlaying: false, current: null, positionMs: 0, durationMs: 0, sleepTimerMin: null, sleepRemainingMs: null, liveAyah: null });
    await unload();
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw) as Partial<AudioPrefs>;
      const validSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
      const validRepeats = ['none', 'one', 'all'];
      const speed = validSpeeds.includes(prefs.speed as number)
        ? (prefs.speed as AudioPrefs['speed'])
        : 1;
      const repeatMode = validRepeats.includes(prefs.repeatMode as string)
        ? (prefs.repeatMode as AudioPrefs['repeatMode'])
        : 'none';
      set({ speed, repeatMode });
    } catch {}
  },
}));
