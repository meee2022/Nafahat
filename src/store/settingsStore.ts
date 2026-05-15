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

  /** الموقع الجغرافي المختار (لمواقيت الصلاة + القبلة + المساجد). */
  location: UserLocation;
  /** هل المستخدم مشترك في العضوية المدفوعة. */
  isPremium: boolean;

  setNotifications: (v: boolean) => void;
  setAutoSaveTasmee: (v: boolean) => void;
  setCloudSync: (v: boolean) => void;
  setPreferredReciterId: (id: string) => void;
  setLocation: (loc: UserLocation) => void;
  setPremium: (v: boolean) => void;
  markCloudSynced: () => void;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/settings';

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
  lastCloudSyncAt: null as number | null,
  estimatedDownloadsMB: 0,
  location: DEFAULT_LOCATION,
  isPremium: false,
};

const persist = (s: Partial<SettingsState>) => {
  const data = {
    notificationsEnabled: s.notificationsEnabled,
    autoSaveTasmee: s.autoSaveTasmee,
    cloudSyncEnabled: s.cloudSyncEnabled,
    preferredReciterId: s.preferredReciterId,
    lastCloudSyncAt: s.lastCloudSyncAt,
    location: s.location,
    isPremium: s.isPremium,
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
  setLocation(loc) {
    set({ location: loc });
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
      if (raw) set(JSON.parse(raw));

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
