/**
 * خدمة تشغيل الصوت - تغليف expo-av Sound API.
 * تُستخدم من الـ Zustand store. تدعم التشغيل في الخلفية وعلى الـ Web.
 */

import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';

let currentSound: Audio.Sound | null = null;
let statusListener: ((s: AVPlaybackStatusSuccess) => void) | null = null;

/**
 * رقم نسخة لكل استدعاء loadAndPlay - يستخدم كـ cancellation token.
 * لو طلب جديد ابتدأ قبل القديم ما يخلّص، القديم يكتشف نفسه قديم ويتجاهل نتائجه.
 */
let loadRequestVersion = 0;

export interface PlaybackStatus {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  didJustFinish: boolean;
}

let audioModeConfigured = false;
async function ensureAudioMode() {
  if (audioModeConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      // يسمح بالتشغيل حتى لو الجهاز على الوضع الصامت (iOS)
      playsInSilentModeIOS: true,
      // ✅ يبقى الصوت شغّالاً عند قفل الشاشة أو الانتقال لتطبيق آخر
      staysActiveInBackground: true,
      // يقلّل صوت تطبيقات أخرى لما يشتغل الـ Adhan/التلاوة بدل قطعها
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      // تكامل مع Now Playing على iOS و notification controls على Android
      interruptionModeIOS:     1, // InterruptionModeIOS.DoNotMix
      interruptionModeAndroid: 1, // InterruptionModeAndroid.DoNotMix
    });
  } catch {}
  audioModeConfigured = true;
}

export async function unload(): Promise<void> {
  if (currentSound) {
    try { await currentSound.unloadAsync(); } catch {}
    currentSound = null;
  }
}

/**
 * يحمّل ملف صوتي ويُشغّله من موضع محدّد.
 *
 * الفلسفة:
 *  ١. كل استدعاء يأخذ رقم نسخة (loadRequestVersion). لو استدعاء أحدث يبدأ
 *     قبل ما ينتهي القديم، القديم يكتشف نفسه قديم ويُلغى تماماً.
 *  ٢. لو `computeStartMs` موجود، نحمّل بـ `shouldPlay: false` أولاً، ثم نـ seek،
 *     ثم نـ play - لمنع سماع البداية ثم القفز للمكان المطلوب.
 *  ٣. الـ listener القديم لا يفعل شيء بعد أن يصبح قديماً (يقارن version).
 */
export async function loadAndPlay(
  uri: string,
  onStatus?: (s: PlaybackStatus) => void,
  /** اختياري: دالة تحسب موضع البداية من مدّة الـ MP3 - تُستخدم للبدء من آية محدّدة. */
  computeStartMs?: (durationMs: number) => number,
): Promise<void> {
  // 🎫 احصل على رقم نسخة لهذا الطلب
  const myVersion = ++loadRequestVersion;

  await ensureAudioMode();
  // لو حصل طلب أحدث أثناء انتظار audio mode، توقف
  if (myVersion !== loadRequestVersion) return;

  await unload();
  if (myVersion !== loadRequestVersion) return;

  // 🎯 لو محدّد seek target، نبدأ بدون play لمنع سماع البداية
  const shouldPlayInitially = !computeStartMs;
  let initialSeekDone = false;

  let sound: Audio.Sound;
  let status: AVPlaybackStatus;
  try {
    const result = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: shouldPlayInitially, volume: 1 },
    );
    sound = result.sound;
    status = result.status;
  } catch (e) {
    if (myVersion !== loadRequestVersion) return;
    throw e;
  }

  // ⛔ لو طلب جديد جاء أثناء التحميل، حرّر الـ sound اللي بدأ تحميله وانصرف
  if (myVersion !== loadRequestVersion) {
    try { await sound.unloadAsync(); } catch {}
    return;
  }

  currentSound = sound;

  // محاولة seek فورية لو الـ duration معروف بعد createAsync مباشرة
  if (status.isLoaded && computeStartMs) {
    const s = status as AVPlaybackStatusSuccess;
    const durationMs = s.durationMillis ?? 0;
    if (durationMs > 0) {
      initialSeekDone = true;
      const targetMs = computeStartMs(durationMs);
      try {
        if (targetMs > 0) await sound.setPositionAsync(targetMs);
        await sound.playAsync();
      } catch {}
    }
  }

  // 🔄 Listener: لو الـ duration ما عُرفش فوراً، يُعمل الـ seek أول ما يُعرف
  sound.setOnPlaybackStatusUpdate((st: AVPlaybackStatus) => {
    // ✋ تجاهل الـ updates لو هذا الـ sound أصبح "قديماً"
    if (myVersion !== loadRequestVersion) return;
    if (!st.isLoaded) return;
    const s = st as AVPlaybackStatusSuccess;
    const durationMs = s.durationMillis ?? 0;

    // 🎯 محاولة seek مؤجَّلة لما الـ duration يُعرف
    if (computeStartMs && !initialSeekDone && durationMs > 0) {
      initialSeekDone = true;
      const targetMs = computeStartMs(durationMs);
      (async () => {
        try {
          if (targetMs > 0) await sound.setPositionAsync(targetMs);
          await sound.playAsync();
        } catch {}
      })();
      // لا نُرسل status للـ caller في هذه الحالة - لسه ما بدأناش
      return;
    }

    onStatus?.({
      isPlaying: s.isPlaying,
      positionMs: s.positionMillis ?? 0,
      durationMs: s.durationMillis ?? 0,
      didJustFinish: s.didJustFinish === true,
    });
  });
}

export async function setPlaying(playing: boolean): Promise<void> {
  if (!currentSound) return;
  try {
    if (playing) await currentSound.playAsync();
    else await currentSound.pauseAsync();
  } catch {}
}

export async function setSpeed(rate: number): Promise<void> {
  if (!currentSound) return;
  try {
    await currentSound.setRateAsync(rate, true);
  } catch {}
}

export async function seekTo(positionMs: number): Promise<void> {
  if (!currentSound) return;
  try {
    await currentSound.setPositionAsync(positionMs);
  } catch {}
}

export function isLoaded(): boolean {
  return !!currentSound;
}

// ─────────────── صوت "خاطف" لكلمات/تنبيهات قصيرة (لا يتداخل مع التلاوة الرئيسية) ───────────────

let oneShotSound: Audio.Sound | null = null;

/**
 * يشغّل ملف صوتي قصير (مثل كلمة من Tarteel) بدون أن يقطع التلاوة الرئيسية.
 * يُحمَّل ويُلعب ثم يُحرَّر تلقائياً عند الانتهاء.
 */
export async function playOneShot(uri: string): Promise<void> {
  await ensureAudioMode();
  // unload أي one-shot سابق
  if (oneShotSound) {
    try { await oneShotSound.unloadAsync(); } catch {}
    oneShotSound = null;
  }
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1 },
      (st: AVPlaybackStatus) => {
        if (!st.isLoaded) return;
        const s = st as AVPlaybackStatusSuccess;
        if (s.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (oneShotSound === sound) oneShotSound = null;
        }
      },
    );
    oneShotSound = sound;
  } catch {}
}
