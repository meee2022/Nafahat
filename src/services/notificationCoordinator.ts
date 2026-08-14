import type { PrayerTimes } from './prayerTimes';
import { cancelAllPrayerNotifications, scheduleDatedPrayerNotifications } from './prayerNotifications';
import { cancelDhikrReminders, scheduleDhikrReminders } from './dhikrReminders';
import { notificationResult, type NotificationOperationResult } from './notificationResult';

export interface NotificationScheduleConfig {
  prayerEnabled: boolean;
  prayerDays: { date: Date; times: PrayerTimes }[];
  iqamaEnabled: boolean;
  iqamaOffsetMin: number;
  dhikrEnabled: boolean;
  dhikrIntervalHours: number;
}

/** Single owner for all recurring local notification schedules. */
export async function syncNotificationSchedules(config: NotificationScheduleConfig): Promise<NotificationOperationResult> {
  const prayerTask = config.prayerEnabled
    ? scheduleDatedPrayerNotifications(config.prayerDays, {
        iqamaEnabled: config.iqamaEnabled,
        iqamaOffsetMin: config.iqamaOffsetMin,
      })
    : cancelAllPrayerNotifications();
  const dhikrTask = config.dhikrEnabled
    ? scheduleDhikrReminders(config.dhikrIntervalHours)
    : cancelDhikrReminders();
  const [prayerResult, dhikrResult] = await Promise.all([prayerTask, dhikrTask]);
  const prayer = prayerResult;
  const dhikrOk = typeof dhikrResult === 'boolean' ? dhikrResult : true;
  const dhikrFailed = !dhikrOk ? 1 : 0;
  return notificationResult(
    prayer.scheduled + (config.dhikrEnabled && dhikrOk ? 1 : 0),
    prayer.failed + dhikrFailed,
  );
}
