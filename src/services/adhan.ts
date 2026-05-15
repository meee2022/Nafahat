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

const ADHAN_SOURCES = {
  // سلسلة قراءات معروفة لصوت الأذان (مكة المكرّمة - علي ملا)
  makkah:   'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/1.mp3',
  // افتراضي
  default:  'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/1.mp3',
} as const;

export type AdhanVoice = keyof typeof ADHAN_SOURCES;

let currentAdhan: any = null;

/**
 * يُشغّل صوت أذان كامل.
 * يُرجع true إذا بدأ التشغيل بنجاح.
 */
export async function playAdhan(voice: AdhanVoice = 'default'): Promise<boolean> {
  if (!Audio) return false;
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
