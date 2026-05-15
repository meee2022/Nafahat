/**
 * متجر الورد اليومي - يحفظ:
 *  - الهدف اليومي (صفحات)
 *  - الصفحات المقروءة اليوم (يصفّر تلقائياً مع تغيّر اليوم)
 *  - عدد الأيام المكتملة (streak الورد)
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@nafahat/wird';

/** يرجع تاريخ اليوم بصيغة YYYY-MM-DD (يستخدم للمقارنة عبر الأيام). */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface WirdPersist {
  dailyTarget: number;
  /** آخر يوم سُجّلت فيه قراءة - يُستخدم لتصفير العدّاد عند يوم جديد. */
  lastDayKey: string | null;
  pagesReadToday: number;
  /** عدد الأيام التي أُتمّ فيها الورد (streak). */
  completedDays: number;
  /** تاريخ آخر يوم اكتمل فيه الورد - لمنع الإحتساب المضاعف. */
  lastCompletedDayKey: string | null;
}

interface WirdState extends WirdPersist {
  setDailyTarget: (n: number) => void;
  incrementPages: (n?: number) => void;
  decrementPages: () => void;
  resetToday: () => void;
  /** يستدعى عند فتح الشاشة - يصفّر pagesReadToday إذا تغيّر اليوم. */
  refreshIfNewDay: () => void;
  hydrate: () => Promise<void>;
}

const DEFAULT: WirdPersist = {
  dailyTarget: 5,
  lastDayKey: null,
  pagesReadToday: 0,
  completedDays: 0,
  lastCompletedDayKey: null,
};

const persist = (s: WirdPersist) => {
  AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
};

export const useWirdStore = create<WirdState>((set, get) => ({
  ...DEFAULT,

  setDailyTarget(n) {
    const next = { ...get(), dailyTarget: Math.max(1, n) };
    set(next);
    persist(next as any);
  },

  incrementPages(n = 1) {
    const tk = todayKey();
    const s = get();
    // لو تغيّر اليوم، أبدأ من جديد قبل الإضافة
    const startFrom = s.lastDayKey === tk ? s.pagesReadToday : 0;
    const pagesReadToday = startFrom + n;

    // هل اكتمل الورد لأول مرة اليوم؟
    let { completedDays, lastCompletedDayKey } = s;
    if (pagesReadToday >= s.dailyTarget && s.lastCompletedDayKey !== tk) {
      completedDays += 1;
      lastCompletedDayKey = tk;
    }

    const next: WirdPersist = {
      ...s,
      pagesReadToday,
      lastDayKey: tk,
      completedDays,
      lastCompletedDayKey,
    };
    set(next);
    persist(next);
  },

  decrementPages() {
    const s = get();
    const tk = todayKey();
    const startFrom = s.lastDayKey === tk ? s.pagesReadToday : 0;
    const pagesReadToday = Math.max(0, startFrom - 1);
    const next: WirdPersist = { ...s, pagesReadToday, lastDayKey: tk };
    set(next);
    persist(next);
  },

  resetToday() {
    const next: WirdPersist = { ...get(), pagesReadToday: 0, lastDayKey: todayKey() };
    set(next);
    persist(next);
  },

  refreshIfNewDay() {
    const s = get();
    const tk = todayKey();
    if (s.lastDayKey && s.lastDayKey !== tk) {
      // يوم جديد - صفّر العدّاد
      const next: WirdPersist = { ...s, pagesReadToday: 0, lastDayKey: tk };
      set(next);
      persist(next);
    }
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const data: WirdPersist = JSON.parse(raw);
        // عند الإقلاع، تحقّق من تغيّر اليوم
        const tk = todayKey();
        if (data.lastDayKey && data.lastDayKey !== tk) {
          data.pagesReadToday = 0;
          data.lastDayKey = tk;
          persist(data);
        }
        set(data);
      }
    } catch {}
  },
}));
