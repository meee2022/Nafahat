/**
 * Hook المزامنة مع Convex - يعمل offline-first.
 *
 * نستخدم استعلامات بسلسلة نصية ("module:function") لنتجنّب الاعتماد على
 * `convex/_generated/api` المُنشأ تلقائيًا بـ `npx convex dev`.
 * إذا لم يكن Convex مفعّلًا (حزمة غير مثبتة، URL غير معرّف، الشبكة معطّلة)،
 * يعمل التطبيق محليًا دون أخطاء.
 */

import { useEffect } from 'react';
import { useDeviceId } from './useDeviceId';
import { useReadingStore } from '@store/index';
import { convex, isCloudEnabled } from '@services/convex';

type RemoteLastRead = {
  surahId: number;
  surahName: string;
  ayahNumber: number;
  page: number;
  updatedAt: number;
};

export function useCloudSync() {
  const deviceId = useDeviceId();
  const setLastRead = useReadingStore((s) => s.setLastRead);

  useEffect(() => {
    if (!deviceId || !convex) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = (await convex.query('lastRead:get', { deviceId })) as RemoteLastRead | null;
        if (!cancelled && remote) {
          setLastRead({
            surahId: remote.surahId,
            ayahNumber: remote.ayahNumber,
            surahName: remote.surahName,
            page: remote.page,
            updatedAt: remote.updatedAt,
          });
        }
      } catch {
        // تجاهل بهدوء - نبقى offline-first
      }
    })();
    return () => { cancelled = true; };
  }, [deviceId]);

  return { enabled: isCloudEnabled() && !!deviceId, deviceId };
}
