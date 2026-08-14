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

// Enable only after the token-protected Convex functions in this revision are deployed.
const SECURE_SYNC_ENABLED = process.env.EXPO_PUBLIC_SECURE_SYNC_V2 === 'true';

export function useCloudSync() {
  useDeviceId();
  const userId = useAuthStore((s) => s.user?.id);
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const token = useAuthStore((s) => s.token);

  // مفتاح المزامنة: userId لو مسجّل، deviceId لو زائر
  const syncKey = SECURE_SYNC_ENABLED && isAuthenticated && userId && token ? `user:${userId}` : null;

  const setLastRead = useReadingStore((s) => s.setLastRead);

  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // تحميل من السحابة عند بدء التطبيق
  useEffect(() => {
    if (!syncKey || !convex) {
      setStatus(SECURE_SYNC_ENABLED && isCloudEnabled() ? 'idle' : 'offline');
      return;
    }
    let cancelled = false;

    (async () => {
      setStatus('syncing');
      try {
        const localBeforeSync = useReadingStore.getState().lastRead;
        // اجلب lastRead
        const remoteLastRead = (await convex.query('lastRead:get' as any, { token })) as RemoteLastRead | null;
        if (!cancelled && remoteLastRead && (!localBeforeSync || remoteLastRead.updatedAt >= localBeforeSync.updatedAt)) {
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
          const remoteFavs = (await convex.query('favorites:list' as any, { token })) as RemoteFavorite[] | null;
          if (!cancelled && Array.isArray(remoteFavs)) {
            const keys = remoteFavs.map((f) => `${f.surahId}:${f.ayahNumber}`);
            // دمج مع المحلي (union)
            const current = useReadingStore.getState().favorites;
            const merged = Array.from(new Set([...current, ...keys]));
            useReadingStore.setState({ favorites: merged });
            await convex.mutation('favorites:replaceAll' as any, {
              token,
              favorites: merged.map((key) => {
                const [surahId, ayahNumber] = key.split(':').map(Number);
                return { surahId, ayahNumber };
              }),
            });
          }
        } catch {}

        try {
          const remoteBookmarks = (await convex.query('bookmarks:list' as any, { token })) as RemoteBookmark[];
          if (!cancelled && Array.isArray(remoteBookmarks)) {
            const local = useReadingStore.getState().bookmarks;
            const byKey = new Map<string, { surahId: number; ayahNumber: number; page: number }>();
            for (const item of [...remoteBookmarks, ...local]) {
              byKey.set(`${item.surahId}:${item.ayahNumber}`, {
                surahId: item.surahId,
                ayahNumber: item.ayahNumber,
                page: item.page,
              });
            }
            const merged = [...byKey.values()];
            useReadingStore.setState({
              bookmarks: merged.map((item, index) => ({
                ...item,
                id: `cloud-${item.surahId}-${item.ayahNumber}`,
                createdAt: remoteBookmarks[index]?.createdAt ?? Date.now(),
              })),
            });
            await convex.mutation('bookmarks:replaceAll' as any, { token, bookmarks: merged });
          }
        } catch {}

        if (localBeforeSync && (!remoteLastRead || localBeforeSync.updatedAt > remoteLastRead.updatedAt)) {
          await convex.mutation('lastRead:set' as any, {
            token,
            surahId: localBeforeSync.surahId,
            surahName: localBeforeSync.surahName,
            ayahNumber: localBeforeSync.ayahNumber,
            page: localBeforeSync.page,
          });
        }

        if (!cancelled) {
          setStatus('synced');
          setLastSyncedAt(Date.now());
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [syncKey, token, setLastRead]);

  return {
    enabled: SECURE_SYNC_ENABLED && isCloudEnabled() && !!syncKey,
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
