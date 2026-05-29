/**
 * متجر إعدادات التطبيق - يحفظ تفضيلات المستخدم البسيطة (toggles).
 * يخزَّن في AsyncStorage بنفس نمط بقية المتاجر.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  cityAr: string;
  cityEn: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

interface SettingsState {
  /** هل التذكيرات والإشعارات مُفعّلة. */
  notificationsEnabled: boolean;
  /** هل يُحفَظ التسميع تلقائياً بعد كل جلسة. */
  autoSaveTasmee: boolean;
  /** هل المزامنة السحابية مفعّلة. */
  cloudSyncEnabled: boolean;
  /** آخر تحديث للنسخة السحابية. */
  lastCloudSyncAt: number | null;
  /** حجم التحميلات بالـ MB (محسوب من الكاش). */
  estimatedDownloadsMB: number;

  /** المُقرئ المفضل للمستخدم. */
  preferredReciterId: string;
  /** 🆕 آخر القرّاء اللي استمع لهم المستخدم (LRU، أحدث 5). للـ Quick Access في تبويب الاستماع. */
  recentReciterIds: string[];

  /** الموقع الجغرافي المختار (لمواقيت الصلاة + القبلة + المساجد). */
  location: UserLocation;
  /** هل المستخدم مشترك في العضوية المدفوعة. */
  isPremium: boolean;

  /** وضع عرض المصحف: 'image' = صور مصحف المدينة الرسمي، 'text' = نص تفاعلي. */
  mushafMode: 'image' | 'text' | 'qpc';

  /** هل التطبيق يشغّل صوت الأذان تلقائياً عند المواقيت (داخل التطبيق). */
  autoAdhanEnabled: boolean;
  /** صوت الأذان المختار. */
  adhanVoice: 'makkah' | 'madinah' | 'abdulbaset' | 'default';
  /** هل تنبيه الإقامة مفعّل (تذكير بعد الأذان بعدد دقائق). */
  iqamaEnabled: boolean;
  /** عدد الدقائق بين الأذان والإقامة. */
  iqamaOffsetMin: number;

  setNotifications: (v: boolean) => void;
  setAutoAdhan: (v: boolean) => void;
  setAdhanVoice: (v: 'makkah' | 'madinah' | 'abdulbaset' | 'default') => void;
  setIqamaEnabled: (v: boolean) => void;
  setIqamaOffsetMin: (m: number) => void;
  setAutoSaveTasmee: (v: boolean) => void;
  setCloudSync: (v: boolean) => void;
  setPreferredReciterId: (id: string) => void;
  /** 🆕 يدفع reciterId إلى recentReciterIds (max 5، أحدث في الأول، مفيش duplicates) */
  pushRecentReciter: (id: string) => void;
  setLocation: (loc: UserLocation) => void;
  setPremium: (v: boolean) => void;
  setMushafMode: (m: 'image' | 'text' | 'qpc') => void;
  markCloudSynced: () => void;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/settings';
/** نسخة الإعدادات - زدّها لو احتجت ميجريشن لتفضيلات قديمة. */
const SETTINGS_VERSION = 2;

const DEFAULT_LOCATION: UserLocation = {
  cityAr: 'الدوحة',
  cityEn: 'Doha',
  latitude: 25.2854,
  longitude: 51.5310,
  timezone: 3,
};

const DEFAULT = {
  notificationsEnabled: true,
  autoSaveTasmee: false,
  cloudSyncEnabled: false,
  preferredReciterId: 'ajamy',
  recentReciterIds: [] as string[],
  lastCloudSyncAt: null as number | null,
  estimatedDownloadsMB: 0,
  location: DEFAULT_LOCATION,
  isPremium: false,
  mushafMode: 'qpc' as 'image' | 'text' | 'qpc',  // 🎯 QPC الافتراضي: مطابق لمصحف المدينة + تفاعلية كلمة-بكلمة
  autoAdhanEnabled: true,           // 🕌 الأذان التلقائي مفعّل افتراضياً
  adhanVoice: 'makkah' as 'makkah' | 'madinah' | 'abdulbaset' | 'default',
  iqamaEnabled: false,              // 🕌 تنبيه الإقامة (معطّل افتراضياً)
  iqamaOffsetMin: 10,               // ⏱️ 10 دقائق بين الأذان والإقامة افتراضياً
};

const persist = (s: Partial<SettingsState>) => {
  const data = {
    _v: SETTINGS_VERSION,
    notificationsEnabled: s.notificationsEnabled,
    autoSaveTasmee: s.autoSaveTasmee,
    cloudSyncEnabled: s.cloudSyncEnabled,
    preferredReciterId: s.preferredReciterId,
    recentReciterIds: s.recentReciterIds,
    lastCloudSyncAt: s.lastCloudSyncAt,
    location: s.location,
    isPremium: s.isPremium,
    mushafMode: s.mushafMode,
    autoAdhanEnabled: s.autoAdhanEnabled,
    adhanVoice: s.adhanVoice,
    iqamaEnabled: s.iqamaEnabled,
    iqamaOffsetMin: s.iqamaOffsetMin,
  };
  AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT,

  setNotifications(v) {
    set({ notificationsEnabled: v });
    persist(get());
  },
  setAutoSaveTasmee(v) {
    set({ autoSaveTasmee: v });
    persist(get());
  },
  setCloudSync(v) {
    set({ cloudSyncEnabled: v });
    persist(get());
  },
  setPreferredReciterId(id) {
    set({ preferredReciterId: id });
    persist(get());
  },
  pushRecentReciter(id) {
    const cur = get().recentReciterIds.filter((x) => x !== id);
    const next = [id, ...cur].slice(0, 5);
    set({ recentReciterIds: next });
    persist(get());
  },
  setLocation(loc) {
    set({ location: loc });
    persist(get());
  },
  setMushafMode(m) {
    set({ mushafMode: m });
    persist(get());
  },
  setAutoAdhan(v) {
    set({ autoAdhanEnabled: v });
    persist(get());
  },
  setAdhanVoice(v) {
    set({ adhanVoice: v });
    persist(get());
  },
  setIqamaEnabled(v) {
    set({ iqamaEnabled: v });
    persist(get());
  },
  setIqamaOffsetMin(m) {
    set({ iqamaOffsetMin: m });
    persist(get());
  },
  setPremium(v) {
    set({ isPremium: v });
    persist(get());
  },
  markCloudSynced() {
    set({ lastCloudSyncAt: Date.now() });
    persist(get());
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const storedVersion = parsed._v ?? 1;

        // ميجريشن v1 → v2: حوّل أي مستخدم قديم إلى وضع QPC (المظهر الجديد المطابق لمصحف المدينة).
        if (storedVersion < 2) {
          parsed.mushafMode = 'qpc';
        }
        if (!parsed.mushafMode) {
          parsed.mushafMode = 'qpc';
        }

        set(parsed);
        // إعادة الحفظ بالنسخة الجديدة لتثبيت الميجريشن
        if (storedVersion < SETTINGS_VERSION) {
          persist({ ...DEFAULT, ...parsed, mushafMode: parsed.mushafMode });
        }
      }

      // قراءة حجم كاش القرآن من AsyncStorage (تقديري)
      try {
        const keys = await AsyncStorage.getAllKeys();
        const quranKeys = keys.filter((k) => k.startsWith('@nafahat/quran/'));
        const stores = await AsyncStorage.multiGet(quranKeys);
        const totalBytes = stores.reduce((sum, [, val]) => sum + (val?.length ?? 0), 0);
        set({ estimatedDownloadsMB: +(totalBytes / 1024 / 1024).toFixed(1) });
      } catch {}
    } catch {}
  },
}));
