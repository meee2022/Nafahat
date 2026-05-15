/**
 * متجر الختمات - يحفظ الخطة النشطة + سجل الختمات المكتملة.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KhatmaPlan {
  id: string;
  planType: '30' | 'r' | '60' | '90' | '10';
  titleKey: string;
  startedAt: number;
  /** عدد الأيام الإجمالي للخطة. */
  totalDays: number;
  /** عدد الصفحات اليومي. */
  pagesPerDay: number;
  /** الصفحات المقروءة في هذه الختمة. */
  pagesRead: number;
  /** هل اكتملت. */
  completed: boolean;
  completedAt?: number;
}

interface KhatmaState {
  activePlan: KhatmaPlan | null;
  history: KhatmaPlan[];

  startPlan: (p: Omit<KhatmaPlan, 'id' | 'startedAt' | 'pagesRead' | 'completed'>) => void;
  recordPages: (n: number) => void;
  cancelPlan: () => void;
  completePlan: () => void;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/khatma';

const persist = (s: Partial<KhatmaState>) => {
  AsyncStorage.setItem(KEY, JSON.stringify({ activePlan: s.activePlan, history: s.history })).catch(() => {});
};

export const useKhatmaStore = create<KhatmaState>((set, get) => ({
  activePlan: null,
  history: [],

  startPlan(p) {
    const plan: KhatmaPlan = {
      ...p,
      id: `khatma-${Date.now()}`,
      startedAt: Date.now(),
      pagesRead: 0,
      completed: false,
    };
    set({ activePlan: plan });
    persist(get());
  },

  recordPages(n) {
    const plan = get().activePlan;
    if (!plan) return;
    const next = { ...plan, pagesRead: Math.min(604, plan.pagesRead + n) };
    if (next.pagesRead >= 604) {
      get().completePlan();
      return;
    }
    set({ activePlan: next });
    persist(get());
  },

  completePlan() {
    const plan = get().activePlan;
    if (!plan) return;
    const completed = { ...plan, completed: true, completedAt: Date.now(), pagesRead: 604 };
    const history = [completed, ...get().history];
    set({ activePlan: null, history });
    persist(get());
  },

  cancelPlan() {
    set({ activePlan: null });
    persist(get());
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set(JSON.parse(raw));
    } catch {}
  },
}));
