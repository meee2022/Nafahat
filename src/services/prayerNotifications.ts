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
import { PrayerTimes, PRAYER_NAMES_AR, getJumuahFirstAdhanTime, getPrayerNameAr } from './prayerTimes';
import { log } from '@utils/logger';
import { notificationResult, type NotificationOperationResult } from './notificationResult';

const isWeb = Platform.OS === 'web';

let Notifications: any = null;
try {
  if (!isWeb) {
    Notifications = require('expo-notifications');
  }
} catch (error) {
  log.error('expo-notifications could not be loaded', { error: String(error) });
}

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
async function ensureAdhanChannel(): Promise<boolean> {
  if (isWeb || Platform.OS !== 'android') return true;
  if (!isAvailable()) return false;
  try {
    await Notifications.setNotificationChannelAsync('adhan', {
      name: 'الأذان',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'adhan.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0F4A41',
    });
    return true;
  } catch (error) {
    log.error('adhan notification channel setup failed', { error: String(error) });
    return false;
  }
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
  jumuahFirst:    'jumuah-first-adhan',
  iqamaAsr:       'iqama-asr',
  iqamaMaghrib:   'iqama-maghrib',
  iqamaIsha:      'iqama-isha',
} as const;

/** خيارات الجدولة - تفعيل الإقامة وعدد دقائقها. */
export interface ScheduleOptions {
  iqamaEnabled?: boolean;
  iqamaOffsetMin?: number;
  datedTimes?: { date: Date; times: PrayerTimes }[];
}

const PRAYER_NOTIFICATION_PREFIX = 'prayer-schedule-';

function triggerFor(date: Date, hour: number, minute: number, channelId?: string): any {
  const target = new Date(date);
  target.setHours(hour, minute, 0, 0);
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: target,
    ...(channelId ? { channelId } : {}),
  };
}

function datedId(date: Date, suffix: string): string {
  return `${PRAYER_NOTIFICATION_PREFIX}${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${suffix}`;
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

      new Notification(title, { body, tag: title });
    } catch (error) {
      log.error('web notification display failed', { title, error: String(error) });
    }
  }, delay);
  webTimers.push(id);
}

async function scheduleWeb(times: PrayerTimes, opts: ScheduleOptions): Promise<void> {
  const granted = await ensureWebPermission();
  if (!granted) return;
  clearWebTimers();
  const today = new Date();

  if (today.getDay() === 5) {
    const first = parseTime(getJumuahFirstAdhanTime(times.dhuhr));
    scheduleWebAt(first.hour, first.minute, '🕌 الأذان الأول لصلاة الجمعة', 'حان وقت الاستعداد والتبكير إلى صلاة الجمعة');
  }

  for (const p of FARD_PRAYERS) {
    const prayerName = p.key === 'dhuhr' ? getPrayerNameAr('dhuhr', today) : p.nameAr;
    const { hour, minute } = parseTime(times[p.key]);
    scheduleWebAt(hour, minute, `🕌 ${prayerName}`, `حان وقت أذان ${prayerName}`);

    // تنبيه الإقامة بعد الأذان بعدد الدقائق المختار
    if (opts.iqamaEnabled) {
      const iq = addMinutes(times[p.key], opts.iqamaOffsetMin ?? 10);
      scheduleWebAt(iq.hour, iq.minute, `🕌 إقامة ${prayerName}`, `حان وقت إقامة صلاة ${prayerName}`);
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
  if (!(await ensureAdhanChannel())) return false;
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
  } catch (error) {
    log.error('test notification scheduling failed', { error: String(error) });
    return false;
  }
}

/** يطلب إذن الإشعارات إن لم يكن مُمنحاً. */
export async function ensurePermission(): Promise<boolean> {
  if (isWeb) return ensureWebPermission();
  if (!isAvailable()) return false;
  try {
    const accepted = (value: any) => value?.granted === true || value?.status === 'granted' ||
      value?.ios?.status === Notifications?.IosAuthorizationStatus?.PROVISIONAL ||
      value?.ios?.status === Notifications?.IosAuthorizationStatus?.EPHEMERAL;
    const existing = await Notifications.getPermissionsAsync();
    if (accepted(existing)) return true;
    return accepted(await Notifications.requestPermissionsAsync());
  } catch (error) {
    log.error('notification permission check failed', { error: String(error) });
    return false;
  }
}

/** يلغي كل إشعارات الصلاة المُجَدْوَلة. */
export async function cancelAllPrayerNotifications(): Promise<NotificationOperationResult> {
  if (isWeb) {
    clearWebTimers();
    return notificationResult(0, 0, 'تم إيقاف مؤقتات التنبيهات في المتصفح.');
  }
  if (!isAvailable()) return notificationResult(0, 1, 'خدمة الإشعارات غير متاحة في هذه النسخة.');
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (typeof item.identifier === 'string' && item.identifier.startsWith(PRAYER_NOTIFICATION_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
    for (const id of Object.values(NOTIF_IDS)) {
      await Notifications.cancelScheduledNotificationAsync(id).catch((error: unknown) => {
        log.warn('notification was not present while cancelling', { id, error: String(error) });
      });
    }
    return notificationResult(0, 0, 'تم إيقاف تنبيهات الصلاة.');
  } catch (error) {
    log.error('cancel prayer notifications failed', { error: String(error) });
    return notificationResult(0, 1, 'تعذّر إيقاف بعض تنبيهات الصلاة.');
  }
}

/**
 * يجدول إشعارات الصلوات الخمس + أذكار + آية اليوم بناءً على مواقيت اليوم.
 * يلغي السابق ثم يُعيد الجدولة كاملة.
 */
async function schedulePrayerNotificationsLegacy(times: PrayerTimes, opts: ScheduleOptions = {}): Promise<void> {
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
    } catch (error) { log.error('legacy prayer notification scheduling failed', { prayer: p.key, error: String(error) }); }

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
      } catch (error) { log.error('legacy iqama notification scheduling failed', { prayer: p.key, error: String(error) }); }
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
  } catch (error) { log.error('legacy morning reminder scheduling failed', { error: String(error) }); }

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
  } catch (error) { log.error('legacy evening reminder scheduling failed', { error: String(error) }); }

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
  } catch (error) { log.error('legacy ayah reminder scheduling failed', { error: String(error) }); }
}

/** يحصل على قائمة الإشعارات المُجَدْوَلة (للتشخيص). */
/** Schedule exact calendar instants so today's astronomical times are not repeated forever. */
export async function scheduleDatedPrayerNotifications(
  days: { date: Date; times: PrayerTimes }[],
  opts: ScheduleOptions = {},
): Promise<NotificationOperationResult> {
  if (!days.length) return notificationResult(0, 1, 'لا توجد مواقيت صالحة لجدولة التنبيهات.');
  if (isWeb) {
    await scheduleWeb(days[0].times, opts);
    return notificationResult(0, 0, 'تنبيهات الويب تعمل فقط أثناء بقاء الصفحة مفتوحة.');
  }
  if (!isAvailable()) return notificationResult(0, 1, 'خدمة الإشعارات غير متاحة في هذه النسخة.');
  if (!(await ensurePermission())) return notificationResult(0, 1, 'إذن الإشعارات غير مفعّل من إعدادات الهاتف.');
  if (!(await ensureAdhanChannel())) {
    return notificationResult(0, 1, 'تعذّر إعداد قناة صوت الأذان على الهاتف. افتح إعدادات الإشعارات وحاول مرة أخرى.');
  }
  const cancelled = await cancelAllPrayerNotifications();
  if (!cancelled.ok) return cancelled;
  let scheduledCount = 0;
  let failedCount = 0;
  let old: any[] = [];
  try {
    old = await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    log.error('read scheduled notifications failed', { error: String(error) });
    failedCount++;
  }
  for (const item of old) {
    if (typeof item.identifier === 'string' && item.identifier.startsWith(PRAYER_NOTIFICATION_PREFIX)) {
      try { await Notifications.cancelScheduledNotificationAsync(item.identifier); }
      catch (error) { failedCount++; log.error('cancel dated notification failed', { id: item.identifier, error: String(error) }); }
    }
  }
  for (const day of days.slice(0, 4)) {
    if (day.date.getDay() === 5) {
      const first = parseTime(getJumuahFirstAdhanTime(day.times.dhuhr));
      const firstTrigger = triggerFor(day.date, first.hour, first.minute, 'adhan');
      if (firstTrigger.date.getTime() > Date.now()) {
        try { await Notifications.scheduleNotificationAsync({
          identifier: datedId(day.date, NOTIF_IDS.jumuahFirst),
          content: {
            title: '🕌 الأذان الأول لصلاة الجمعة',
            body: 'حان وقت الاستعداد والتبكير إلى صلاة الجمعة',
            sound: 'adhan.wav',
            data: { type: 'prayer', prayer: 'jumuah-first' },
          },
          trigger: firstTrigger,
        }); scheduledCount++; }
        catch (error) { failedCount++; log.error('schedule first Jumuah adhan failed', { error: String(error) }); }
      }
    }
    for (const prayer of FARD_PRAYERS) {
      const prayerName = prayer.key === 'dhuhr' ? getPrayerNameAr('dhuhr', day.date) : prayer.nameAr;
      const { hour, minute } = parseTime(day.times[prayer.key]);
      const trigger = triggerFor(day.date, hour, minute, 'adhan');
      if (trigger.date.getTime() <= Date.now()) continue;
      try { await Notifications.scheduleNotificationAsync({
        identifier: datedId(day.date, prayer.adhanId),
        content: { title: prayer.key === 'dhuhr' && day.date.getDay() === 5 ? '🕌 الأذان الثاني لصلاة الجمعة' : `🕌 ${prayerName}`, body: `حان وقت أذان ${prayerName}`, sound: 'adhan.wav', data: { type: 'prayer', prayer: prayer.key } },
        trigger,
      }); scheduledCount++; }
      catch (error) { failedCount++; log.error('schedule prayer notification failed', { prayer: prayer.key, error: String(error) }); }
      if (opts.iqamaEnabled) {
        const iqama = addMinutes(day.times[prayer.key], opts.iqamaOffsetMin ?? 10);
        try { await Notifications.scheduleNotificationAsync({
          identifier: datedId(day.date, prayer.iqamaId),
          content: { title: `إقامة ${prayerName}`, body: `حان وقت إقامة صلاة ${prayerName}`, sound: 'default', data: { type: 'iqama', prayer: prayer.key } },
          trigger: triggerFor(day.date, iqama.hour, iqama.minute),
        }); scheduledCount++; }
        catch (error) { failedCount++; log.error('schedule iqama notification failed', { prayer: prayer.key, error: String(error) }); }
      }
    }
  }
  return notificationResult(scheduledCount, failedCount);
}

export async function getScheduledNotifications(): Promise<any[]> {
  if (isWeb) return [];
  if (!isAvailable()) return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    log.error('get scheduled notifications failed', { error: String(error) });
    return [];
  }
}

/** Reads the operating system queue and returns a user-facing diagnostic result. */
export async function inspectScheduledNotifications(): Promise<NotificationOperationResult> {
  if (isWeb) return notificationResult(0, 1, 'فحص التنبيهات المجدولة متاح داخل تطبيق الهاتف فقط.');
  if (!isAvailable()) return notificationResult(0, 1, 'خدمة الإشعارات غير متاحة في هذه النسخة.');
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.length === 0) return notificationResult(0, 1, 'لا توجد أي تنبيهات مجدولة حاليًا على الهاتف.');
    return notificationResult(scheduled.length, 0, `الهاتف يحتفظ حاليًا بـ ${scheduled.length} تنبيهًا مجدولًا.`);
  } catch (error) {
    log.error('scheduled notification inspection failed', { error: String(error) });
    return notificationResult(0, 1, 'تعذّر قراءة قائمة التنبيهات من نظام الهاتف.');
  }
}
