/**
 * خدمة جدولة إشعارات الصلوات اليومية المتكرّرة.
 *
 * - على الموبايل (iOS/Android): تستخدم expo-notifications بإشعارات يومية متكرّرة.
 * - على الويب: تستخدم Web Notifications API + جدولة بالـ setTimeout للصلوات
 *   المتبقّية اليوم. ⚠️ على الويب تعمل فقط والتبويب/التطبيق مفتوح (لا يوجد
 *   جدولة في الخلفية كما في الموبايل).
 *
 * المحتوى المُجَدْوَل:
 * - الفجر/الظهر/العصر/المغرب/العشاء: 5 إشعارات يومية
 * - أذكار الصباح: بعد الفجر بـ ٣٠ دقيقة
 * - أذكار المساء: قبل المغرب بـ ٣٠ دقيقة
 * - تذكير بقراءة آية اليوم: بعد العشاء بـ ٣٠ دقيقة
 */
import { Platform } from 'react-native';
import { PrayerTimes, PRAYER_NAMES_AR } from './prayerTimes';

const isWeb = Platform.OS === 'web';

let Notifications: any = null;
try {
  if (!isWeb) {
    Notifications = require('expo-notifications');
  }
} catch {}

/** هل واجهة إشعارات المتصفح متاحة (ويب). */
function webNotifSupported(): boolean {
  return isWeb && typeof window !== 'undefined' && 'Notification' in window;
}

/** هل خدمة الإشعارات متاحة على المنصّة الحالية. */
export const isAvailable = (): boolean => {
  if (isWeb) return webNotifSupported();
  return !!Notifications;
};

/**
 * 🔊 ينشئ قناة "الأذان" على أندرويد بصوت الأذان المدمج.
 * على أندرويد، صوت الإشعار يأتي من القناة (مش من محتوى الإشعار) — فلازم
 * نعرّف القناة بصوت adhan.wav حتى يُسمَع الأذان والتطبيق مقفول.
 */
async function ensureAdhanChannel(): Promise<void> {
  if (isWeb || !isAvailable() || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('adhan', {
      name: 'الأذان',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'adhan.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0F4A41',
    });
  } catch {}
}

/** يحوّل "HH:MM" → { hour, minute } */
function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(':').map(Number);
  return { hour: h, minute: m };
}

/** يضيف دقائق إلى وقت "HH:MM" ويُرجع وقتاً جديداً. */
function addMinutes(time: string, mins: number): { hour: number; minute: number } {
  const { hour, minute } = parseTime(time);
  const total = hour * 60 + minute + mins;
  const newHour   = Math.floor((total + 1440) / 60) % 24;
  const newMinute = ((total % 60) + 60) % 60;
  return { hour: newHour, minute: newMinute };
}

const NOTIF_IDS = {
  fajr:           'prayer-fajr',
  dhuhr:          'prayer-dhuhr',
  asr:            'prayer-asr',
  maghrib:        'prayer-maghrib',
  isha:           'prayer-isha',
  adhkarMorning:  'adhkar-morning',
  adhkarEvening:  'adhkar-evening',
  ayahOfDay:      'ayah-of-day',
  iqamaFajr:      'iqama-fajr',
  iqamaDhuhr:     'iqama-dhuhr',
  iqamaAsr:       'iqama-asr',
  iqamaMaghrib:   'iqama-maghrib',
  iqamaIsha:      'iqama-isha',
} as const;

/** خيارات الجدولة - تفعيل الإقامة وعدد دقائقها. */
export interface ScheduleOptions {
  iqamaEnabled?: boolean;
  iqamaOffsetMin?: number;
}

/** الصلوات الخمس المفروضة (بدون الشروق) - تُستخدم للأذان والإقامة. */
const FARD_PRAYERS: { key: keyof PrayerTimes; nameAr: string; adhanId: string; iqamaId: string }[] = [
  { key: 'fajr',    nameAr: PRAYER_NAMES_AR.fajr,    adhanId: NOTIF_IDS.fajr,    iqamaId: NOTIF_IDS.iqamaFajr },
  { key: 'dhuhr',   nameAr: PRAYER_NAMES_AR.dhuhr,   adhanId: NOTIF_IDS.dhuhr,   iqamaId: NOTIF_IDS.iqamaDhuhr },
  { key: 'asr',     nameAr: PRAYER_NAMES_AR.asr,     adhanId: NOTIF_IDS.asr,     iqamaId: NOTIF_IDS.iqamaAsr },
  { key: 'maghrib', nameAr: PRAYER_NAMES_AR.maghrib, adhanId: NOTIF_IDS.maghrib, iqamaId: NOTIF_IDS.iqamaMaghrib },
  { key: 'isha',    nameAr: PRAYER_NAMES_AR.isha,    adhanId: NOTIF_IDS.isha,    iqamaId: NOTIF_IDS.iqamaIsha },
];

// ============== جدولة الويب (setTimeout) ==============

/** مؤقّتات الويب النشطة - تُلغى عند إعادة الجدولة أو الإيقاف. */
let webTimers: ReturnType<typeof setTimeout>[] = [];

function clearWebTimers(): void {
  for (const id of webTimers) clearTimeout(id);
  webTimers = [];
}

/** يطلب إذن إشعارات المتصفح. */
async function ensureWebPermission(): Promise<boolean> {
  if (!webNotifSupported()) return false;
  try {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

/** يجدول إشعاراً واحداً عبر setTimeout عند الساعة/الدقيقة اليوم (إن لم يَفُت بعد). */
function scheduleWebAt(hour: number, minute: number, title: string, body: string): void {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  const delay = target.getTime() - now.getTime();
  if (delay <= 0) return; // فات وقته اليوم
  const id = setTimeout(() => {
    try {
      // eslint-disable-next-line no-new
      new Notification(title, { body, tag: title });
    } catch {}
  }, delay);
  webTimers.push(id);
}

async function scheduleWeb(times: PrayerTimes, opts: ScheduleOptions): Promise<void> {
  const granted = await ensureWebPermission();
  if (!granted) return;
  clearWebTimers();

  for (const p of FARD_PRAYERS) {
    const { hour, minute } = parseTime(times[p.key]);
    scheduleWebAt(hour, minute, `🕌 ${p.nameAr}`, `حان وقت أذان ${p.nameAr}`);

    // تنبيه الإقامة بعد الأذان بعدد الدقائق المختار
    if (opts.iqamaEnabled) {
      const iq = addMinutes(times[p.key], opts.iqamaOffsetMin ?? 10);
      scheduleWebAt(iq.hour, iq.minute, `🕌 إقامة ${p.nameAr}`, `حان وقت إقامة صلاة ${p.nameAr}`);
    }
  }

  const m = addMinutes(times.fajr, 30);
  scheduleWebAt(m.hour, m.minute, '🌅 أذكار الصباح', 'ابدأ يومك بحصن من ذكر الله');
  const e = addMinutes(times.maghrib, -30);
  scheduleWebAt(e.hour, e.minute, '🌙 أذكار المساء', 'لا تنسَ أذكار المساء قبل غروب الشمس');
  const a = addMinutes(times.isha, 30);
  scheduleWebAt(a.hour, a.minute, '📖 آية اليوم', 'لحظات تأمّل مع كتاب الله قبل النوم');
}

// ============== الواجهة العامّة ==============

/**
 * 🔔 يرسل إشعاراً تجريبياً فورياً (بعد ٣ ثوانٍ) ليتأكّد المستخدم أن الإشعارات
 * تعمل فعلاً — لأن إشعارات الصلاة مجدولة لأوقاتها فلا تظهر فور التفعيل.
 */
export async function sendTestNotification(): Promise<boolean> {
  if (isWeb || !isAvailable()) return false;
  const granted = await ensurePermission();
  if (!granted) return false;
  await ensureAdhanChannel();
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🕌 نَفَحات',
        body: 'تم تفعيل تنبيهات الصلاة بنجاح ✅ — هذا صوت الأذان الذي سيصلك في أوقاته.',
        sound: 'adhan.wav',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: 'adhan' },
    });
    return true;
  } catch {
    return false;
  }
}

/** يطلب إذن الإشعارات إن لم يكن مُمنحاً. */
export async function ensurePermission(): Promise<boolean> {
  if (isWeb) return ensureWebPermission();
  if (!isAvailable()) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** يلغي كل إشعارات الصلاة المُجَدْوَلة. */
export async function cancelAllPrayerNotifications(): Promise<void> {
  if (isWeb) {
    clearWebTimers();
    return;
  }
  if (!isAvailable()) return;
  try {
    for (const id of Object.values(NOTIF_IDS)) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    }
  } catch {}
}

/**
 * يجدول إشعارات الصلوات الخمس + أذكار + آية اليوم بناءً على مواقيت اليوم.
 * يلغي السابق ثم يُعيد الجدولة كاملة.
 */
export async function schedulePrayerNotifications(times: PrayerTimes, opts: ScheduleOptions = {}): Promise<void> {
  if (isWeb) {
    await scheduleWeb(times, opts);
    return;
  }
  if (!isAvailable()) return;
  const granted = await ensurePermission();
  if (!granted) return;

  // 🔊 قناة الأذان (أندرويد) — لازمة ليُشغَّل صوت الأذان حتى والتطبيق مقفول.
  await ensureAdhanChannel();

  // ألغِ السابق
  await cancelAllPrayerNotifications();

  // جدول أذان + إقامة كل صلاة
  for (const p of FARD_PRAYERS) {
    const { hour, minute } = parseTime(times[p.key]);
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: p.adhanId,
        content: {
          title: `🕌 ${p.nameAr}`,
          body: `حان وقت أذان ${p.nameAr}`,
          // 🔊 صوت أذان مدمج (يعمل والتطبيق مقفول) — على أندرويد يأتي من القناة.
          sound: 'adhan.wav',
          data: { type: 'prayer', prayer: p.key },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'adhan' },
      });
    } catch {}

    // تنبيه الإقامة بعد الأذان بعدد الدقائق المختار
    if (opts.iqamaEnabled) {
      const iq = addMinutes(times[p.key], opts.iqamaOffsetMin ?? 10);
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: p.iqamaId,
          content: {
            title: `🕌 إقامة ${p.nameAr}`,
            body: `حان وقت إقامة صلاة ${p.nameAr}`,
            sound: 'default',
            data: { type: 'iqama', prayer: p.key },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: iq.hour, minute: iq.minute },
        });
      } catch {}
    }
  }

  // أذكار الصباح - بعد الفجر بـ ٣٠ دقيقة
  const morningTime = addMinutes(times.fajr, 30);
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIF_IDS.adhkarMorning,
      content: {
        title: '🌅 أذكار الصباح',
        body: 'ابدأ يومك بحصن من ذكر الله',
        sound: 'default',
        data: { type: 'adhkar', category: 'morning' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: morningTime.hour, minute: morningTime.minute },
    });
  } catch {}

  // أذكار المساء - قبل المغرب بـ ٣٠ دقيقة
  const eveningTime = addMinutes(times.maghrib, -30);
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIF_IDS.adhkarEvening,
      content: {
        title: '🌙 أذكار المساء',
        body: 'لا تنسَ أذكار المساء قبل غروب الشمس',
        sound: 'default',
        data: { type: 'adhkar', category: 'evening' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: eveningTime.hour, minute: eveningTime.minute },
    });
  } catch {}

  // تذكير بآية اليوم - بعد العشاء بـ ٣٠ دقيقة
  const ayahTime = addMinutes(times.isha, 30);
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIF_IDS.ayahOfDay,
      content: {
        title: '📖 آية اليوم',
        body: 'لحظات تأمّل مع كتاب الله قبل النوم',
        sound: 'default',
        data: { type: 'ayah-of-day' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: ayahTime.hour, minute: ayahTime.minute },
    });
  } catch {}
}

/** يحصل على قائمة الإشعارات المُجَدْوَلة (للتشخيص). */
export async function getScheduledNotifications(): Promise<any[]> {
  if (isWeb) return [];
  if (!isAvailable()) return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}
