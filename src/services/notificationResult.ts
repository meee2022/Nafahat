export interface NotificationOperationResult {
  ok: boolean;
  scheduled: number;
  failed: number;
  message: string;
}

export const notificationResult = (
  scheduled: number,
  failed: number,
  message?: string,
): NotificationOperationResult => ({
  ok: failed === 0,
  scheduled,
  failed,
  message: message ?? (failed === 0
    ? `تمت جدولة ${scheduled} تنبيه بنجاح.`
    : `تمت جدولة ${scheduled} تنبيه وفشل ${failed}.`),
});
