/**
 * خدمة الإشعارات - تغليف expo-notifications مع graceful fallback.
 *
 * - إذا لم تُثبَّت الحزمة، تعمل بدون أخطاء (مثل ما فعلنا في خدمة Convex).
 * - تدعم: طلب إذن، جدولة يومية متكرّرة، إلغاء كل الإشعارات.
 * - لا تعمل على الويب (Web push يحتاج إعداد منفصل).
 */

import { Platform } from 'react-native';

// نُحضِر الحزمة عبر require ديناميكي حتى لا يكسر البناء إن لم تكن مثبّتة
let Notifications: any = null;
try {
  if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
  }
} catch {
  Notifications = null;
}

// إعداد سلوك الإشعارات في المقدّمة (تظهر تنبيهاً + صوتاً)
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // 🔇 إشعار الصلاة في المقدّمة: المُجدول يشغّل الأذان الكامل، فنكتم صوت
        //    الإشعار لتفادي تشغيل صوتين معاً.
        const isPrayer = notification?.request?.content?.data?.type === 'prayer';
        return {
          // SDK 52 (متوافق قديم)
          shouldShowAlert: true,
          // SDK 53+ (مطلوب لعرض التنبيه في المقدّمة على iOS الحديث)
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: !isPrayer,
          shouldSetBadge: false,
        };
      },
    });
  } catch {}
}

export const isNotificationsSupported = (): boolean =>
  !!Notifications && Platform.OS !== 'web';

/**
 * يطلب من المستخدم إذن إرسال الإشعارات.
 * يُرجع true إذا منح الإذن.
 */
export async function requestPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export interface DailyReminderConfig {
  identifier: string;
  hour: number;          // 0..23
  minute: number;        // 0..59
  title: string;
  body: string;
}

/**
 * يجدول إشعاراً يومياً متكرّراً في الوقت المحدّد.
 * يلغي أي إشعار سابق بنفس الـ identifier.
 */
export async function scheduleDaily(cfg: DailyReminderConfig): Promise<void> {
  if (!isNotificationsSupported()) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(cfg.identifier).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: cfg.identifier,
      content: {
        title: cfg.title,
        body: cfg.body,
        sound: true,
      },
      // 🩹 SDK 56: صيغة الـtrigger اليومي تتطلّب type صريحاً، وإلا تفشل الجدولة
      //    صمتاً (خصوصاً على iOS) فلا يصل أي إشعار.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: cfg.hour,
        minute: cfg.minute,
      },
    });
  } catch {}
}

export async function cancelReminder(identifier: string): Promise<void> {
  if (!isNotificationsSupported()) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {}
}

export async function cancelAllReminders(): Promise<void> {
  if (!isNotificationsSupported()) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

/**
 * إعدادات تذكيرات نَفَحات الافتراضية.
 */
export const DEFAULT_REMINDERS: DailyReminderConfig[] = [
  {
    identifier: 'wird-morning',
    hour: 7, minute: 0,
    title: '☀️ ورد الصباح بانتظارك',
    body: 'صفحات اليوم في القرآن - ابدأ صباحك بآية',
  },
  {
    identifier: 'memo-evening',
    hour: 19, minute: 30,
    title: '🌙 وقت الحفظ',
    body: 'لا تنسَ ورد الحفظ والمراجعة اليومي',
  },
  {
    identifier: 'adhkar-evening',
    hour: 17, minute: 30,
    title: '✨ أذكار المساء',
    body: 'تذكّر أذكار المساء - وقت مبارك',
  },
];
