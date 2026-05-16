/**
 * Hook بيراقب تقدم الإنجازات وبيشغّل toast لما المستخدم يفتح واحد جديد.
 *
 * يقارن الـ snapshot القديم بالحالي:
 *   - لو إنجاز اتفك جديد → يطلق notification
 *   - يحفظ الـ unlocked IDs في AsyncStorage عشان مايكررش
 */

import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStatsStore } from '@store/index';
import { computeAchievements } from '@data/achievements';

const STORAGE_KEY = '@nafahat/unlocked-achievements';

type Notifier = (title: string, description: string) => void;

export function useAchievementNotifier(notify: Notifier) {
  const stats = useStatsStore((s) => s.stats);
  const seenRef = useRef<Set<string> | null>(null);

  // تحميل الـ snapshot الأولي
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        seenRef.current = new Set(raw ? JSON.parse(raw) : []);
      } catch {
        seenRef.current = new Set();
      }
    })();
  }, []);

  // المراقبة
  useEffect(() => {
    if (!seenRef.current) return;

    const achievements = computeAchievements(stats);
    const newlyUnlocked = achievements.filter(
      (a) => a.unlocked && !seenRef.current!.has(a.id),
    );

    if (newlyUnlocked.length > 0) {
      for (const ach of newlyUnlocked) {
        notify(
          `🎉 إنجاز جديد: ${ach.title}`,
          ach.description,
        );
        seenRef.current.add(ach.id);
      }
      AsyncStorage
        .setItem(STORAGE_KEY, JSON.stringify(Array.from(seenRef.current)))
        .catch(() => {});
    }
  }, [stats, notify]);
}
