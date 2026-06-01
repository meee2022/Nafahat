/**
 * خدمة تشغيل صوت الأذان.
 *
 * ملاحظات:
 *  - النسخة الحالية تستخدم MP3 من mp3quran.net (سلسلة الأذان الشهيرة).
 *  - لاحقاً يمكن تحميل أصوات أذان متعدّدة (Makkah / Madinah / مشاري...)
 *    وحفظها في expo-file-system لتشغيلها أوفلاين.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * 🕌 مصادر الأذان الحقيقية (ليست تلاوة قرآنية!).
 *
 * البديل القديم كان يُشغّل سورة الفاتحة بصوت العفاسي بدلاً من الأذان -
 * تم إصلاحه باستخدام مصادر mp3quran.net الرسمية للأذان.
 */
const ADHAN_SOURCES = {
  /** أذان كامل بصوت نديّ (CDN aladhan الموثوق). */
  makkah:  'https://cdn.aladhan.com/audio/adhans/a1.mp3',
  /** أذان كامل - صوت مختلف. */
  madinah: 'https://cdn.aladhan.com/audio/adhans/a4.mp3',
  /** عبد الباسط عبد الصمد - أذان قديم مشهور. */
  abdulbaset: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
  /** أذان قياسي - الخيار الافتراضي. */
  default: 'https://cdn.aladhan.com/audio/adhans/a2.mp3',
} as const;

export type AdhanVoice = keyof typeof ADHAN_SOURCES;

let currentAdhan: AudioPlayer | null = null;
/** علامة version لمنع التداخل بين استدعاءات playAdhan المتتالية بسرعة. */
let adhanRequestVersion = 0;

/** يضبط وضع الصوت مرة واحدة حتى يصدر الأذان صوتاً حتى في الوضع الصامت. */
let adhanAudioModeReady = false;
async function ensureAdhanAudioMode(): Promise<void> {
  if (adhanAudioModeReady) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,       // يصدر صوتاً حتى لو الجوال صامت (iOS)
      shouldPlayInBackground: true,  // يكمل لو قُفلت الشاشة أثناء الأذان
      interruptionMode: 'doNotMix',
      interruptionModeAndroid: 'doNotMix',
    });
  } catch {}
  adhanAudioModeReady = true;
}

/**
 * يُشغّل صوت أذان كامل.
 * يُرجع true إذا بدأ التشغيل بنجاح.
 */
export async function playAdhan(voice: AdhanVoice = 'default'): Promise<boolean> {
  const myVersion = ++adhanRequestVersion;
  try {
    await ensureAdhanAudioMode();
    if (myVersion !== adhanRequestVersion) return false;

    // أوقف أي أذان سابق
    if (currentAdhan) {
      try { currentAdhan.remove(); } catch {}
      currentAdhan = null;
    }

    const url = ADHAN_SOURCES[voice];
    const player = createAudioPlayer({ uri: url });
    // لو حصلت محاولة أحدث أثناء التحميل، تجاهل هذه (وحرّر الـ player)
    if (myVersion !== adhanRequestVersion) {
      try { player.remove(); } catch {}
      return false;
    }
    currentAdhan = player;
    player.play();
    return true;
  } catch {
    return false;
  }
}

/** يوقف الأذان الجاري. */
export async function stopAdhan(): Promise<void> {
  if (!currentAdhan) return;
  try { currentAdhan.remove(); } catch {}
  currentAdhan = null;
}

/** هل يوجد أذان يُشغَّل حالياً. */
export function isAdhanPlaying(): boolean {
  return currentAdhan !== null;
}
