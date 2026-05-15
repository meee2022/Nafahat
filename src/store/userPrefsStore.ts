/**
 * تفضيلات المستخدم الشخصية (مستوى، أهداف، وقت التذكير) - تُجمع في Onboarding.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserLevel = 'beginner' | 'intermediate' | 'memorizer';
export type UserGoal  = 'read' | 'memorize' | 'learn' | 'consistent';

interface UserPrefsState {
  level: UserLevel | null;
  goal: UserGoal | null;
  reminderTime: string; // "HH:MM"
  dailyPageGoal: number;

  setLevel: (lvl: UserLevel) => void;
  setGoal: (g: UserGoal) => void;
  setReminderTime: (t: string) => void;
  setDailyPageGoal: (n: number) => void;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/userPrefs';

const DEFAULT = {
  level: null as UserLevel | null,
  goal: null as UserGoal | null,
  reminderTime: '06:30',
  dailyPageGoal: 5,
};

const persist = (s: UserPrefsState) => {
  AsyncStorage.setItem(KEY, JSON.stringify({
    level: s.level, goal: s.goal,
    reminderTime: s.reminderTime, dailyPageGoal: s.dailyPageGoal,
  })).catch(() => {});
};

export const useUserPrefsStore = create<UserPrefsState>((set, get) => ({
  ...DEFAULT,

  setLevel(level) { set({ level }); persist(get()); },
  setGoal(goal)   { set({ goal });  persist(get()); },
  setReminderTime(reminderTime) { set({ reminderTime }); persist(get()); },
  setDailyPageGoal(dailyPageGoal) { set({ dailyPageGoal }); persist(get()); },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set(JSON.parse(raw));
    } catch {}
  },
}));
