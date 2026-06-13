/**
 * متجر الاختبارات - نقاط المستخدم الإجمالية + سجل الجلسات.
 * يُحفظ في AsyncStorage بنفس نمط متاجر التطبيق الأخرى.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizHistoryEntry, QuizLevel } from '@/types/index';

interface QuizPersist {
  totalPoints: number;
  bestStreak: number;
  totalSessions: number;
  totalCorrect: number;
  totalQuestions: number;
  history: QuizHistoryEntry[];
}

interface QuizState extends QuizPersist {
  recordSession: (entry: Omit<QuizHistoryEntry, 'id'>, streakInSession: number) => void;
  reset: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/quiz';

const DEFAULT: QuizPersist = {
  totalPoints: 0,
  bestStreak: 0,
  totalSessions: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  history: [],
};

const persist = (s: QuizPersist) =>
  AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});

export const useQuizStore = create<QuizState>((set, get) => ({
  ...DEFAULT,

  recordSession(entry, streakInSession) {
    const id = `quiz-${entry.startedAt}`;
    const historyEntry: QuizHistoryEntry = { ...entry, id };
    const newHistory = [historyEntry, ...get().history].slice(0, 50); // احتفظ بآخر 50 جلسة

    const next: QuizPersist = {
      totalPoints: get().totalPoints + entry.points,
      bestStreak: Math.max(get().bestStreak, streakInSession),
      totalSessions: get().totalSessions + 1,
      totalCorrect: get().totalCorrect + entry.correctCount,
      totalQuestions: get().totalQuestions + entry.totalQuestions,
      history: newHistory,
    };
    set(next);
    persist(next);
  },

  async reset() {
    set({ ...DEFAULT });
    await AsyncStorage.removeItem(KEY).catch(() => {});
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set(JSON.parse(raw));
    } catch {}
  },
}));

/** يصنّف المستخدم حسب نقاطه إلى مرتبة - للعرض. */
export function getRankForPoints(points: number): { titleKey: string; emoji: string; nextAt?: number } {
  if (points < 50)    return { titleKey: 'quiz.rankNovice',     emoji: '🌱', nextAt: 50 };
  if (points < 200)   return { titleKey: 'quiz.rankSeeker',     emoji: '📖', nextAt: 200 };
  if (points < 500)   return { titleKey: 'quiz.rankStudent',    emoji: '✨', nextAt: 500 };
  if (points < 1000)  return { titleKey: 'quiz.rankScholar',    emoji: '🎓', nextAt: 1000 };
  if (points < 2500)  return { titleKey: 'quiz.rankMemorizer',  emoji: '🌟', nextAt: 2500 };
  return                     { titleKey: 'quiz.rankMaster',     emoji: '👑' };
}

/** عدد الأسئلة الافتراضي لكل مستوى. */
export function defaultQuestionsForLevel(level: QuizLevel): number {
  return level === 'beginner' ? 8 : level === 'intermediate' ? 12 : 15;
}
