/**
 * متجر دروس التجويد - يتتبّع الدروس المكتملة + الاختبارات.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TajweedState {
  completedLessons: string[];   // معرّفات الدروس المكتملة
  quizScores: Record<string, number>; // معرّف الدرس → النتيجة (0-100)

  completeLesson: (lessonId: string) => void;
  recordQuizScore: (lessonId: string, score: number) => void;
  isCompleted: (lessonId: string) => boolean;
  /** عدد الدروس المكتملة من إجمالي. */
  progressPercent: (totalLessons: number) => number;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/tajweed';

const persist = (s: Partial<TajweedState>) => {
  AsyncStorage.setItem(KEY, JSON.stringify({
    completedLessons: s.completedLessons,
    quizScores: s.quizScores,
  })).catch(() => {});
};

export const useTajweedStore = create<TajweedState>((set, get) => ({
  completedLessons: [],
  quizScores: {},

  completeLesson(lessonId) {
    if (get().completedLessons.includes(lessonId)) return;
    const completedLessons = [...get().completedLessons, lessonId];
    set({ completedLessons });
    persist(get());
  },

  recordQuizScore(lessonId, score) {
    const quizScores = { ...get().quizScores, [lessonId]: score };
    set({ quizScores });
    persist(get());
  },

  isCompleted(lessonId) {
    return get().completedLessons.includes(lessonId);
  },

  progressPercent(totalLessons) {
    if (totalLessons === 0) return 0;
    return Math.round((get().completedLessons.length / totalLessons) * 100);
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set(JSON.parse(raw));
    } catch {}
  },
}));
