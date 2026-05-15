import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStats } from '@/types/index';

interface StatsState {
  stats: AppStats;
  incrementPages: (n: number) => void;
  incrementMinutes: (n: number) => void;
  incrementTasbeeh: (n: number) => void;
  incrementMemorized: (n: number) => void;
  recordSession: (minutes: number) => void;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/stats';

const DEFAULT: AppStats = {
  pagesRead: 0,
  versesMemorized: 0,
  sessionsCount: 0,
  listenedMinutes: 0,
  tasbeehCount: 0,
  streakDays: 0,
  lastActiveDate: 0,
  weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
};

const persist = (stats: AppStats) =>
  AsyncStorage.setItem(KEY, JSON.stringify(stats)).catch(() => {});

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: DEFAULT,

  incrementPages(n) {
    const stats = { ...get().stats, pagesRead: get().stats.pagesRead + n };
    set({ stats }); persist(stats);
  },
  incrementMinutes(n) {
    const stats = { ...get().stats, listenedMinutes: get().stats.listenedMinutes + n };
    set({ stats }); persist(stats);
  },
  incrementTasbeeh(n) {
    const stats = { ...get().stats, tasbeehCount: get().stats.tasbeehCount + n };
    set({ stats }); persist(stats);
  },
  incrementMemorized(n) {
    const stats = { ...get().stats, versesMemorized: get().stats.versesMemorized + n };
    set({ stats }); persist(stats);
  },
  recordSession(minutes) {
    const w = [...get().stats.weeklyMinutes];
    w[w.length - 1] += minutes;
    const stats = { ...get().stats, sessionsCount: get().stats.sessionsCount + 1, weeklyMinutes: w, lastActiveDate: Date.now() };
    set({ stats }); persist(stats);
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ stats: JSON.parse(raw) });
    } catch {}
  },
}));
