/**
 * 🕌 جدولة تشغيل الأذان تلقائياً عند مواقيت الصلاة.
 *
 * كيف تعمل:
 *   - تفحص الوقت كل ٣٠ ثانية
 *   - لو حان وقت صلاة + لم نُشغّل أذانها بعد اليوم → playAdhan()
 *   - تحتفظ بمجموعة "الصلوات اللتي أُذِّن لها اليوم" لمنع التكرار
 *   - تُعاد التهيئة كل منتصف ليل
 *
 * ⚠️ ملاحظة: تعمل فقط والتطبيق مفتوح. لأذان في الخلفية يلزم background task
 *    (متاح فقط في dev client / production build، ليس Expo Go).
 */
import { PrayerTimes } from './prayerTimes';
import { playAdhan, AdhanVoice } from './adhan';

type PrayerKey = keyof PrayerTimes;

const PRAYER_KEYS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastResetDay = -1;
const playedToday = new Set<PrayerKey>();
let currentTimes: PrayerTimes | null = null;
let preferredVoice: AdhanVoice = 'makkah';
let enabled = false;

/** يحلّل "HH:MM" → دقائق منذ منتصف الليل. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** يعيد التهيئة لو تغيّر اليوم. */
function resetIfNewDay(): void {
  const today = new Date().getDate();
  if (today !== lastResetDay) {
    playedToday.clear();
    lastResetDay = today;
  }
}

/** يفحص لو أي صلاة في نافذة الدقيقة الحالية ولم تُشغَّل بعد. */
function checkAndPlay(): void {
  if (!enabled || !currentTimes) return;
  resetIfNewDay();

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  for (const key of PRAYER_KEYS) {
    if (playedToday.has(key)) continue;
    const prayerMins = timeToMinutes(currentTimes[key]);
    // نافذة دقيقة واحدة بعد الوقت تماماً (لتفادي التشغيل المتأخر جداً)
    if (nowMins === prayerMins) {
      playedToday.add(key);
      playAdhan(preferredVoice).catch(() => {});
      // نشغّل أذاناً واحداً فقط في الدورة - لو حدث أكثر من صلاة في نفس الدقيقة (نادر)
      // الباقي يُشغَّل في الدورة التالية
      break;
    }
  }
}

/**
 * يبدأ مراقبة المواقيت. يُستدعى عند تحميل المواقيت (في prayer-times screen أو _layout).
 *
 * @param times مواقيت اليوم
 * @param voice نوع الأذان المفضّل (mecca | madinah | abdulbaset | default)
 */
export function startAdhanScheduler(times: PrayerTimes, voice: AdhanVoice = 'makkah'): void {
  currentTimes = times;
  preferredVoice = voice;
  enabled = true;

  if (intervalId) return; // مفعّل بالفعل

  // فحص أوّلي
  checkAndPlay();

  // فحص دوريّ كل ٣٠ ثانية - دقّة كافية لنافذة الدقيقة
  intervalId = setInterval(checkAndPlay, 30_000);
}

/** يوقف المراقبة - يُستدعى عند تعطيل ميزة الأذان من الإعدادات. */
export function stopAdhanScheduler(): void {
  enabled = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/** يحدّث المواقيت دون إعادة تشغيل (لو المستخدم غيّر المدينة). */
export function updateAdhanTimes(times: PrayerTimes): void {
  currentTimes = times;
}

/** يغيّر صوت الأذان المفضّل. */
export function setAdhanVoice(voice: AdhanVoice): void {
  preferredVoice = voice;
}

/** هل المُجدول نشط؟ */
export function isAdhanSchedulerActive(): boolean {
  return enabled && intervalId !== null;
}
