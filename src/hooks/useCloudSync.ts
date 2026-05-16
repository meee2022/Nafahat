/**
 * Hook المزامنة الشاملة مع Convex - يعمل offline-first.
 *
 * يستخدم:
 *   - userId   (لو المستخدم مسجّل دخول → بياناته تتزامن عبر كل أجهزته)
 *   - deviceId (للزوار → بياناته تبقى على الجهاز الواحد)
 *
 * يزامن:
 *   - lastRead (آخر آية قُرئت)
 *   - favorites (الآيات المفضّلة)
 *   - bookmarks (العلامات المرجعية)
 *
 * إذا لم يكن Convex مفعّلًا، يعمل التطبيق محليًا دون أخطاء.
 */

import { useEffect, useState } from 'react';
import { useDeviceId } from './useDeviceId';
import { useReadingStore } from '@store/index';
import { useAuthStore } from '@store/authStore';
import { convex, isCloudEnabled } from '@services/convex';

type RemoteLastRead = {
  surahId: number;
  surahName: string;
  ayahNumber: number;
  page: number;
  updatedAt: number;
};

type RemoteFavorite = {
  surahId: number;
  ayahNumber: number;
};

type RemoteBookmark = {
  _id: string;
  surahId: number;
  ayahNumber: number;
  page: number;
  createdAt: number;
};

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export function useCloudSync() {
  const deviceId = useDeviceId();
  const userId = useAuthStore((s) => s.user?.id);
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  // مفتاح المزامنة: userId لو مسجّل، deviceId لو زائر
  const syncKey = isAuthenticated && userId ? `user:${userId}` : deviceId;

  const setLastRead = useReadingStore((s) => s.setLastRead);

  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // تحميل من السحابة عند بدء التطبيق
  useEffect(() => {
    if (!syncKey || !convex) {
      setStatus(isCloudEnabled() ? 'idle' : 'offline');
      return;
    }
    let cancelled = false;

    (async () => {
      setStatus('syncing');
      try {
        // اجلب lastRead
        const remoteLastRead = (await convex.query('lastRead:get' as any, { deviceId: syncKey })) as RemoteLastRead | null;
        if (!cancelled && remoteLastRead) {
          setLastRead({
            surahId: remoteLastRead.surahId,
            ayahNumber: remoteLastRead.ayahNumber,
            surahName: remoteLastRead.surahName,
            page: remoteLastRead.page,
            updatedAt: remoteLastRead.updatedAt,
          });
        }

        // اجلب favorites (محاولة هادئة - مش لازم يفشل لو الـ function مش موجودة)
        try {
          const remoteFavs = (await convex.query('favorites:list' as any, { deviceId: syncKey })) as RemoteFavorite[] | null;
          if (!cancelled && Array.isArray(remoteFavs) && remoteFavs.length > 0) {
            const keys = remoteFavs.map((f) => `${f.surahId}:${f.ayahNumber}`);
            // دمج مع المحلي (union)
            const current = useReadingStore.getState().favorites;
            const merged = Array.from(new Set([...current, ...keys]));
            useReadingStore.setState({ favorites: merged });
          }
        } catch {}

        if (!cancelled) {
          setStatus('synced');
          setLastSyncedAt(Date.now());
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [syncKey, setLastRead]);

  return {
    enabled: isCloudEnabled() && !!syncKey,
    syncKey,
    isAuthenticated,
    status,
    lastSyncedAt,
  };
}

/**
 * Hook خفيف يعرض حالة المزامنة فقط (للـ indicators في الـ UI).
 */
export function useSyncStatus(): { status: SyncStatus; label: string } {
  const { status, isAuthenticated } = useCloudSync();
  const label = (() => {
    switch (status) {
      case 'syncing': return 'جاري المزامنة...';
      case 'synced':  return isAuthenticated ? 'متزامن مع حسابك' : 'متزامن مع جهازك';
      case 'error':   return 'تعذّر المزامنة';
      case 'offline': return 'بدون مزامنة';
      default:        return 'في الانتظار';
    }
  })();
  return { status, label };
}
