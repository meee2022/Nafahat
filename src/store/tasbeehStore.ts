import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TasbeehItem } from '@/types/index';
import { TASBEEH_PRESETS } from '@data/tasbeeh';

interface TasbeehState {
  items: TasbeehItem[];
  selectedId: string;
  todayCount: number;
  select: (id: string) => void;
  increment: () => void;
  reset: (id: string) => void;
  setGoal: (id: string, goal: number) => void;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/tasbeeh';

export const useTasbeehStore = create<TasbeehState>((set, get) => ({
  items: TASBEEH_PRESETS,
  selectedId: TASBEEH_PRESETS[0].id,
  todayCount: 0,

  select(id) { set({ selectedId: id }); },

  increment() {
    const items = get().items.map((it) =>
      it.id === get().selectedId ? { ...it, current: it.current + 1 } : it
    );
    set({ items, todayCount: get().todayCount + 1 });
    AsyncStorage.setItem(KEY, JSON.stringify({ items })).catch(() => {});
  },

  reset(id) {
    const items = get().items.map((it) => (it.id === id ? { ...it, current: 0 } : it));
    set({ items });
    AsyncStorage.setItem(KEY, JSON.stringify({ items })).catch(() => {});
  },

  setGoal(id, goal) {
    const items = get().items.map((it) => (it.id === id ? { ...it, goal } : it));
    set({ items });
    AsyncStorage.setItem(KEY, JSON.stringify({ items })).catch(() => {});
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const { items } = JSON.parse(raw);
        if (items) set({ items });
      }
    } catch {}
  },
}));
