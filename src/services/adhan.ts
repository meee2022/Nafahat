/**
 * خدمة تشغيل صوت الأذان.
 *
 * ملاحظات:
 *  - النسخة الحالية تستخدم MP3 من mp3quran.net (سلسلة الأذان الشهيرة).
 *  - لاحقاً يمكن تحميل أصوات أذان متعدّدة (Makkah / Madinah / مشاري...)
 *    وحفظها في expo-file-system لتشغيلها أوفلاين.
 */
import { Platform } from 'react-native';

let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch {}

/**
 * 🕌 مصادر الأذان الحقيقية (ليست تلاوة قرآنية!).
 *
 * البديل القديم كان يُشغّل سورة الفاتحة بصوت العفاسي بدلاً من الأذان -
 * تم إصلاحه باستخدام مصادر mp3quran.net الرسمية للأذان.
 */
const ADHAN_SOURCES = {
  /** الحرم المكي - الشيخ علي ملّا (الأذان الأصلي من مكة). */
  makkah:  'https://server8.mp3quran.net/Adhan_Makkah.mp3',
  /** الحرم النبوي - أذان المدينة. */
  madinah: 'https://server8.mp3quran.net/Adhan_Madina.mp3',
  /** عبد الباسط عبد الصمد - أذان قديم مشهور. */
  abdulbaset: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
  /** أذان قصير قياسي - الخيار الافتراضي. */
  default: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
} as const;

export type AdhanVoice = keyof typeof ADHAN_SOURCES;

let currentAdhan: any = null;
/** علامة version لمنع التداخل بين استدعاءات playAdhan المتتالية بسرعة. */
let adhanRequestVersion = 0;

/**
 * يُشغّل صوت أذان كامل.
 * يُرجع true إذا بدأ التشغيل بنجاح.
 */
export async function playAdhan(voice: AdhanVoice = 'default'): Promise<boolean> {
  if (!Audio) return false;
  // أعطِ رقم نسخة لهذه المحاولة - لو أتت محاولة أخرى قبل الانتهاء، نلغي الحالية
  const myVersion = ++adhanRequestVersion;
  try {
    // أوقف أي أذان سابق
    if (currentAdhan) {
      try { await currentAdhan.unloadAsync(); } catch {}
      currentAdhan = null;
    }

    const url = ADHAN_SOURCES[voice];
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, volume: 1 },
    );
    // لو حصلت محاولة أحدث أثناء التحميل، تجاهل هذه (وحرّر الـ sound)
    if (myVersion !== adhanRequestVersion) {
      try { await sound.unloadAsync(); } catch {}
      return false;
    }
    currentAdhan = sound;
    return true;
  } catch {
    return false;
  }
}

/** يوقف الأذان الجاري. */
export async function stopAdhan(): Promise<void> {
  if (!currentAdhan) return;
  try { await currentAdhan.stopAsync(); } catch {}
  try { await currentAdhan.unloadAsync(); } catch {}
  currentAdhan = null;
}

/** هل يوجد أذان يُشغَّل حالياً. */
export function isAdhanPlaying(): boolean {
  return currentAdhan !== null;
}
