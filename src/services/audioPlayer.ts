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
 * الفلسفة (إعادة هيكلة لإصلاح صمت التشغيل من آية):
 *  ١. كل استدعاء يأخذ رقم نسخة (loadRequestVersion) كـ cancellation token.
 *  ٢. نحمّل دائماً بـ `shouldPlay: false`، ثم نـ poll للـ duration بـ getStatusAsync
 *     (حتى 10 محاولات × 100ms)، ثم نـ seek، ثم نـ playAsync **متزامناً**.
 *     ده بيمنع الـ race condition القديم حيث الـ seek+play كان بيحصل في listener
 *     async IIFE والـ store كان بيـ set isPlaying:true قبل ما الصوت يبدأ فعلاً.
 *  ٣. الـ listener بيشتغل بعد ما نبدأ نشغّل، عشان status بيتبعت لـ caller صحيح.
 */
export async function loadAndPlay(
  uri: string,
  onStatus?: (s: PlaybackStatus) => void,
  /** اختياري: دالة تحسب موضع البداية من مدّة الـ MP3 - تُستخدم للبدء من آية محدّدة. */
  computeStartMs?: (durationMs: number) => number,
): Promise<void> {
  const myVersion = ++loadRequestVersion;

  await ensureAudioMode();
  if (myVersion !== loadRequestVersion) return;

  await unload();
  if (myVersion !== loadRequestVersion) return;

  // 🎯 نبدأ دائماً paused — هنشغّل بنفسنا بعد ما نـ seek
  let sound: Audio.Sound;
  try {
    const result = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false, volume: 1 },
    );
    sound = result.sound;
  } catch (e) {
    if (myVersion !== loadRequestVersion) return;
    throw e;
  }

  if (myVersion !== loadRequestVersion) {
    try { await sound.unloadAsync(); } catch {}
    return;
  }

  currentSound = sound;

  // 🕐 لو محتاجين seek، نـ poll للـ duration الأول
  if (computeStartMs) {
    let duration = 0;
    for (let i = 0; i < 10; i++) {
      const st = await sound.getStatusAsync();
      if (myVersion !== loadRequestVersion) {
        try { await sound.unloadAsync(); } catch {}
        return;
      }
      if (st.isLoaded && (st.durationMillis ?? 0) > 0) {
        duration = st.durationMillis ?? 0;
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    if (duration > 0) {
      const targetMs = computeStartMs(duration);
      if (targetMs > 0 && targetMs < duration) {
        try { await sound.setPositionAsync(targetMs); } catch {}
      }
    }
  }

  // 📡 listener قبل playAsync عشان أول status update يوصل للـ caller
  sound.setOnPlaybackStatusUpdate((st: AVPlaybackStatus) => {
    if (myVersion !== loadRequestVersion) return;
    if (!st.isLoaded) return;
    const s = st as AVPlaybackStatusSuccess;
    onStatus?.({
      isPlaying: s.isPlaying,
      positionMs: s.positionMillis ?? 0,
      durationMs: s.durationMillis ?? 0,
      didJustFinish: s.didJustFinish === true,
    });
  });

  // ▶️ شغّل الآن — متزامن، عشان loadAndPlay ما يـ returnش غير بعد بداية فعلية
  try { await sound.playAsync(); } catch {}
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

/**
 * 🌙 يُخفت الصوت تدريجياً (fade-out) ثم يوقف.
 * @param durationMs المدة الإجمالية للـ fade (مثلاً 8000 = 8 ثوانٍ)
 * @param steps عدد خطوات التدريج (الافتراضي 40 = خفض كل 200ms للـ 8s)
 *
 * استخدام: sleep timer يستدعيها قبل لحظات من الانتهاء.
 * يحترم cancellation: لو الـ user عمل seek/play/stop يدوياً، الـ fade لا يكمل.
 */
let fadeAbortToken = 0;
export async function fadeOutAndStop(durationMs: number = 8000, steps: number = 40): Promise<void> {
  if (!currentSound) return;
  const myToken = ++fadeAbortToken;
  const stepMs = Math.max(50, durationMs / steps);
  const startVolume = 1; // expo-av maximum

  for (let i = 1; i <= steps; i++) {
    if (myToken !== fadeAbortToken) return; // تم الإلغاء
    if (!currentSound) return;
    const v = Math.max(0, startVolume * (1 - i / steps));
    try { await currentSound.setVolumeAsync(v); } catch {}
    await new Promise((r) => setTimeout(r, stepMs));
  }
  if (myToken !== fadeAbortToken) return;
  // بعد الـ fade: أوقف ورجّع volume للـ next session
  try {
    if (currentSound) {
      await currentSound.pauseAsync();
      await currentSound.setVolumeAsync(1);
    }
  } catch {}
}

/**
 * يلغي أي fade-out جارٍ ويعيد volume لطبيعته.
 * يُستخدم لما المستخدم يلمس play/seek بعد بدء الـ fade.
 */
export async function cancelFade(): Promise<void> {
  fadeAbortToken++;
  if (currentSound) {
    try { await currentSound.setVolumeAsync(1); } catch {}
  }
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
