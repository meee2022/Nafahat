/**
 * 🔔 Push Notifications — تسجيل token + scheduling محلي.
 *
 * تستخدم expo-notifications (موجود في package.json).
 *
 * يوفّر:
 *  - registerForPushNotifications() → يطلب الإذن ويرجّع expoPushToken
 *  - scheduleLocalReminder() → جدولة تذكير محلي (للحفظ، الورد، الأذكار)
 *  - cancelAllReminders() → إلغاء كل التذكيرات
 *
 * ملاحظة: لإرسال push من server تحتاج Expo push API + الـ token.
 *  الـ scheduling المحلي بيشتغل offline بدون أي server.
 */
import { Platform } from 'react-native';
import { log } from '@utils/logger';

let Notifications: any = null;
let notificationsReady = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
  notificationsReady = true;
} catch {
  // مش متركّب
}

// تهيئة كيف تظهر الإشعارات لما التطبيق مفتوح
if (notificationsReady && Notifications?.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      // SDK 53+ API: shouldShowBanner / shouldShowList
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * يسجّل الجهاز للـ push ويرجّع الـ token.
 * يطلب الإذن لو لم يُعطَ، ويعيد null لو رفض المستخدم.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!notificationsReady) return null;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    // Android: نحدّد قناة لإشعارات نَفَحات
    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      try {
        await Notifications.setNotificationChannelAsync('nafahat-reminders', {
          name: 'تذكيرات نَفَحات',
          importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4B570',
        });
      } catch {}
    }

    // اجلب expoPushToken (يحتاج projectId من app.json)
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      log.info('Expo push token acquired');
      return tokenData?.data ?? null;
    } catch (e) {
      log.warn('expoPushToken not available', { error: String(e) });
      return null;
    }
  } catch (e) {
    log.warn('push registration failed', { error: String(e) });
    return null;
  }
}

/**
 * جدولة تذكير محلي. يشتغل offline بدون server.
 *
 * @param title عنوان الإشعار
 * @param body نص الإشعار
 * @param triggerSeconds عدد الثواني من الآن (مثلاً 3600 لـ ساعة)
 * @param repeating لو true → يتكرّر يومياً في نفس الوقت
 */
export async function scheduleLocalReminder(
  title: string,
  body: string,
  triggerSeconds: number,
  repeating: boolean = false,
): Promise<string | null> {
  if (!notificationsReady) return null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: repeating
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: triggerSeconds, repeats: true }
        : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, triggerSeconds) },
    });
    return id;
  } catch (e) {
    log.warn('scheduleLocalReminder failed', { error: String(e) });
    return null;
  }
}

/**
 * جدولة تذكير في وقت محدّد من اليوم (HH:MM) — يومي.
 */
export async function scheduleDailyReminder(
  title: string,
  body: string,
  hour: number,
  minute: number,
): Promise<string | null> {
  if (!notificationsReady) return null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    return id;
  } catch (e) {
    log.warn('scheduleDailyReminder failed', { error: String(e) });
    return null;
  }
}

/**
 * إلغاء كل التذكيرات المجدولة (للإعدادات → إيقاف الإشعارات).
 */
export async function cancelAllReminders(): Promise<void> {
  if (!notificationsReady) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

/**
 * إلغاء تذكير محدّد بالـ id.
 */
export async function cancelReminder(id: string): Promise<void> {
  if (!notificationsReady) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

/** Public flag للـ debug. */
export const isPushReady = () => notificationsReady;
