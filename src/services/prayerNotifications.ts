/**
 * خدمة جدولة إشعارات الصلوات اليومية المتكرّرة.
 * تستخدم expo-notifications إن كانت متاحة، وإلا تعمل graceful fallback.
 *
 * - الفجر/الظهر/العصر/المغرب/العشاء: 5 إشعارات يومية متكرّرة
 * - أذكار الصباح: بعد الفجر بـ ٣٠ دقيقة
 * - أذكار المساء: قبل المغرب بـ ٣٠ دقيقة
 * - تذكير بقراءة آية اليوم: بعد العشاء بـ ٣٠ دقيقة
 */
import { Platform } from 'react-native';
import { PrayerTimes, PRAYER_NAMES_AR } from './prayerTimes';

let Notifications: any = null;
try {
  if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
  }
} catch {}

export const isAvailable = (): boolean => !!Notifications && Platform.OS !== 'web';

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
} as const;

/** يلغي كل إشعارات الصلاة المُجَدْوَلة. */
export async function cancelAllPrayerNotifications(): Promise<void> {
  if (!isAvailable()) return;
  try {
    for (const id of Object.values(NOTIF_IDS)) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    }
  } catch {}
}

/** يطلب إذن الإشعارات إن لم يكن مُمنحاً. */
export async function ensurePermission(): Promise<boolean> {
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

/**
 * يجدول إشعارات الصلوات الخمس + أذكار + آية اليوم بناءً على مواقيت اليوم.
 * يلغي السابق ثم يُعيد الجدولة كاملة.
 */
export async function schedulePrayerNotifications(times: PrayerTimes): Promise<void> {
  if (!isAvailable()) return;
  const granted = await ensurePermission();
  if (!granted) return;

  // ألغِ السابق
  await cancelAllPrayerNotifications();

  // جدول كل صلاة
  const prayers: { id: string; key: keyof PrayerTimes; nameAr: string }[] = [
    { id: NOTIF_IDS.fajr,    key: 'fajr',    nameAr: PRAYER_NAMES_AR.fajr },
    { id: NOTIF_IDS.dhuhr,   key: 'dhuhr',   nameAr: PRAYER_NAMES_AR.dhuhr },
    { id: NOTIF_IDS.asr,     key: 'asr',     nameAr: PRAYER_NAMES_AR.asr },
    { id: NOTIF_IDS.maghrib, key: 'maghrib', nameAr: PRAYER_NAMES_AR.maghrib },
    { id: NOTIF_IDS.isha,    key: 'isha',    nameAr: PRAYER_NAMES_AR.isha },
  ];

  for (const p of prayers) {
    const { hour, minute } = parseTime(times[p.key]);
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: p.id,
        content: {
          title: `🕌 ${p.nameAr}`,
          body: `حان وقت أذان ${p.nameAr}`,
          sound: 'default',
          data: { type: 'prayer', prayer: p.key },
        },
        trigger: { hour, minute, repeats: true },
      });
    } catch {}
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
      trigger: { hour: morningTime.hour, minute: morningTime.minute, repeats: true },
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
      trigger: { hour: eveningTime.hour, minute: eveningTime.minute, repeats: true },
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
      trigger: { hour: ayahTime.hour, minute: ayahTime.minute, repeats: true },
    });
  } catch {}
}

/** يحصل على قائمة الإشعارات المُجَدْوَلة (للتشخيص). */
export async function getScheduledNotifications(): Promise<any[]> {
  if (!isAvailable()) return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}
