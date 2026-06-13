import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemorizationPlan, MemorizationTask, MemorizationStrength } from '@/types/index';
import { scheduleNextReview } from '@services/memorization';
import { getSurahById } from '@data/surahs';
import { useStatsStore } from './statsStore';

interface MemoState {
  plans: MemorizationPlan[];
  tasks: MemorizationTask[];
  createPlan: (p: Omit<MemorizationPlan, 'id' | 'createdAt' | 'active'>) => MemorizationPlan;
  /**
   * يعلّم المهمة كمحفوظة:
   * - يحدّث جدولة المراجعة (SRS)
   * - يزيد الإحصائيات
   * - يولّد المهمة التالية تلقائياً إذا كانت الخطة لا تزال نشطة وفيها مساحة
   */
  markTaskMemorized: (id: string, strength: MemorizationStrength) => void;
  markTaskReviewed: (id: string, strength: MemorizationStrength) => void;
  /** الانتقال من 'new' إلى 'learning' عند بدء جلسة الحفظ. */
  startLearningTask: (id: string) => void;
  addTask: (t: Omit<MemorizationTask, 'id' | 'reviewIntervalDays' | 'repetitions' | 'strength'>) => void;
  removeTask: (id: string) => void;
  /** يمسح كل المهام المحفوظة (status = 'memorized'). يُرجع عدد المحذوف. */
  clearMemorizedTasks: () => number;
  /** يمسح المهام المكرّرة (نفس السورة + نفس المدى)، يُبقي واحدة. يُرجع عدد المحذوف. */
  removeDuplicateTasks: () => number;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/memo';

const persist = (state: Partial<MemoState>) => {
  AsyncStorage.setItem(KEY, JSON.stringify({ plans: state.plans, tasks: state.tasks })).catch(() => {});
};

/**
 * يحسب المهمة التالية بناءً على المهمة المكتملة:
 * - في نفس السورة: ينقل ayahFrom/ayahTo بمقدار dailyAmount
 * - إذا انتهت السورة: ينتقل لبداية السورة التالية في نطاق الخطة
 * - يرجع null إذا انتهت الخطة (وصلنا لـ endSurah)
 */
function computeNextRange(
  plan: MemorizationPlan,
  completedTask: MemorizationTask,
): Omit<MemorizationTask, 'id' | 'reviewIntervalDays' | 'repetitions' | 'strength'> | null {
  if (plan.unit !== 'ayah') return null; // حالياً ندعم الآيات فقط

  const step = plan.dailyAmount;
  const currentSurah = getSurahById(completedTask.surahId);
  if (!currentSurah) return null;

  const nextFrom = completedTask.ayahTo + 1;

  // ضمن نفس السورة
  if (nextFrom <= currentSurah.versesCount) {
    const nextTo = Math.min(currentSurah.versesCount, nextFrom + step - 1);
    return {
      surahId: completedTask.surahId,
      ayahFrom: nextFrom,
      ayahTo: nextTo,
      status: 'new',
    };
  }

  // ننتقل للسورة التالية
  const nextSurahId = completedTask.surahId + 1;
  if (nextSurahId > plan.endSurah || nextSurahId > 114) {
    return null; // انتهت الخطة
  }

  const nextSurah = getSurahById(nextSurahId);
  if (!nextSurah) return null;

  return {
    surahId: nextSurahId,
    ayahFrom: 1,
    ayahTo: Math.min(nextSurah.versesCount, step),
    status: 'new',
  };
}

export const useMemoStore = create<MemoState>((set, get) => ({
  plans: [],
  tasks: [],

  createPlan(p) {
    const plan: MemorizationPlan = { ...p, id: `p-${Date.now()}`, createdAt: Date.now(), active: true };
    const plans = [plan, ...get().plans];
    set({ plans });
    persist({ ...get(), plans });
    return plan;
  },

  startLearningTask(id) {
    const tasks = get().tasks.map((t) =>
      t.id === id && t.status === 'new' ? { ...t, status: 'learning' as const } : t,
    );
    set({ tasks });
    persist({ ...get(), tasks });
  },

  markTaskMemorized(id, strength) {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const plan = get().plans.find((p) => p.startSurah <= task.surahId && task.surahId <= p.endSurah && p.active);

    const tasks = get().tasks.map((t) => {
      if (t.id !== id) return t;
      const repetitions = t.repetitions + 1;
      const { intervalDays, nextAt } = scheduleNextReview(repetitions, strength);
      return {
        ...t,
        status: 'memorized' as const,
        strength,
        repetitions,
        reviewIntervalDays: intervalDays,
        lastReviewedAt: Date.now(),
        nextReviewAt: nextAt,
      };
    });

    // حدّث الإحصائيات (عدد الآيات المحفوظة جديداً فقط - أي ما لم يكن محفوظاً قبلاً)
    if (task.status !== 'memorized') {
      const versesCount = task.ayahTo - task.ayahFrom + 1;
      try { useStatsStore.getState().incrementMemorized(versesCount); } catch {}
    }

    // ولّد المهمة التالية إذا كانت الخطة موجودة وغير منتهية
    let newList = tasks;
    if (plan) {
      const next = computeNextRange(plan, task);
      if (next) {
        // تأكد ألا تكون موجودة سلفاً (تجنّب التكرار)
        const exists = tasks.some(
          (t) => t.surahId === next.surahId && t.ayahFrom === next.ayahFrom && t.ayahTo === next.ayahTo,
        );
        if (!exists) {
          const newTask: MemorizationTask = {
            ...next,
            id: `m-${Date.now()}`,
            strength: 'weak',
            reviewIntervalDays: 1,
            repetitions: 0,
          };
          newList = [...tasks, newTask];
        }
      }
    }

    set({ tasks: newList });
    persist({ ...get(), tasks: newList });
  },

  markTaskReviewed(id, strength) {
    const tasks = get().tasks.map((t) => {
      if (t.id !== id) return t;
      const repetitions = t.repetitions + 1;
      const { intervalDays, nextAt } = scheduleNextReview(repetitions, strength);
      return { ...t, strength, repetitions, reviewIntervalDays: intervalDays, lastReviewedAt: Date.now(), nextReviewAt: nextAt };
    });
    set({ tasks });
    persist({ ...get(), tasks });
  },

  addTask(t) {
    const newTask: MemorizationTask = { ...t, id: `m-${Date.now()}`, strength: 'weak', reviewIntervalDays: 1, repetitions: 0 };
    const tasks = [...get().tasks, newTask];
    set({ tasks });
    persist({ ...get(), tasks });
  },

  removeTask(id) {
    const tasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks });
    persist({ ...get(), tasks });
  },

  clearMemorizedTasks() {
    const before = get().tasks.length;
    const tasks = get().tasks.filter((t) => t.status !== 'memorized');
    set({ tasks });
    persist({ ...get(), tasks });
    return before - tasks.length;
  },

  removeDuplicateTasks() {
    const before = get().tasks.length;
    const seen = new Set<string>();
    const tasks = get().tasks.filter((t) => {
      const key = `${t.surahId}:${t.ayahFrom}:${t.ayahTo}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    set({ tasks });
    persist({ ...get(), tasks });
    return before - tasks.length;
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const { plans, tasks } = JSON.parse(raw);
        set({ plans, tasks });
      }
    } catch {}
  },
}));
