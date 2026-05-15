/**
 * Store إعدادات التطبيق - يخزّن التعديلات اللي بيعملها الأدمن من لوحة التحكم.
 *
 * كل قيمة في هذا الـ store اختيارية:
 *   - لو موجودة → تستخدم بدل القيمة الافتراضية في src/config/appInfo.ts
 *   - لو undefined → ترجع القيمة الافتراضية تلقائياً
 *
 * يُحفظ محلياً عبر AsyncStorage. للاستخدام الفعلي على الإنتاج
 * (مزامنة بين كل المستخدمين) يمكن استبدال الـ persist بـ Convex.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_INFO, ADMIN_EMAILS } from '@/config/appInfo';

const STORAGE_KEY = '@nafahat/app-config-overrides';

export interface CharityDedicationOverride {
  title?: string;
  parents?: {
    label?: string;
    names?: string;
    prayer?: string;
  };
  general?: {
    title?: string;
    scope?: string;
    deceasedPrayer?: string;
    livingPrayer?: string;
  };
}

export interface AppConfigOverrides {
  // الهوية
  name?: string;
  nameEn?: string;
  tagline?: string;
  version?: string;
  build?: string;

  // الفوتر
  copyrightYear?: number | null;
  madeWithSuffix?: string;
  charityNotice?: string;

  // تواصل
  supportEmail?: string;
  website?: string;
  githubUrl?: string;
  githubLabel?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;

  // قانوني
  termsUrl?: string;
  privacyUrl?: string;

  // المشاركة
  shareMessage?: string;

  // الإهداء
  charityDedication?: CharityDedicationOverride | null;

  // أدمنز إضافيين (يضاف عليهم الـ bootstrap admin من appInfo.ts)
  extraAdminEmails?: string[];
}

interface AppConfigState {
  overrides: AppConfigOverrides;
  hydrated: boolean;

  setOverride: <K extends keyof AppConfigOverrides>(key: K, value: AppConfigOverrides[K]) => Promise<void>;
  setOverrides: (patch: Partial<AppConfigOverrides>) => Promise<void>;
  resetAll: () => Promise<void>;
  hydrate: () => Promise<void>;

  // إدارة الأدمنز
  addAdmin: (email: string) => Promise<void>;
  removeAdmin: (email: string) => Promise<void>;
}

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  overrides: {},
  hydrated: false,

  async setOverride(key, value) {
    const next = { ...get().overrides, [key]: value };
    set({ overrides: next });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  },

  async setOverrides(patch) {
    const next = { ...get().overrides, ...patch };
    set({ overrides: next });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  },

  async resetAll() {
    set({ overrides: {} });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  async addAdmin(email) {
    const normalized = email.toLowerCase().trim();
    if (!normalized) return;
    const current = get().overrides.extraAdminEmails ?? [];
    if (current.map((e) => e.toLowerCase().trim()).includes(normalized)) return;
    await get().setOverride('extraAdminEmails', [...current, normalized]);
  },

  async removeAdmin(email) {
    const normalized = email.toLowerCase().trim();
    const current = get().overrides.extraAdminEmails ?? [];
    const next = current.filter((e) => e.toLowerCase().trim() !== normalized);
    await get().setOverride('extraAdminEmails', next);
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ overrides: JSON.parse(raw), hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },
}));

/**
 * Hook رئيسي للحصول على بيانات التطبيق الفعلية.
 * يدمج القيم الافتراضية من APP_INFO مع تعديلات الأدمن المخزّنة في الـ store.
 */
export function useAppInfo() {
  const overrides = useAppConfigStore((s) => s.overrides);
  return mergeAppInfo(overrides);
}

/**
 * يرجع قائمة كل الأدمنز الحاليين (bootstrap من appInfo.ts + إضافيين من الـ store).
 */
export function getAllAdmins(extraEmails?: string[]): string[] {
  const bootstrap = ADMIN_EMAILS.map((e) => e.toLowerCase().trim());
  const extras = (extraEmails ?? []).map((e) => e.toLowerCase().trim());
  return Array.from(new Set([...bootstrap, ...extras]));
}

/**
 * يفحص هل الإيميل أدمن (محسوب من القائمتين معاً).
 * non-hook - يمكن استخدامه خارج React.
 */
export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const extras = useAppConfigStore.getState().overrides.extraAdminEmails ?? [];
  return getAllAdmins(extras).includes(normalized);
}

/**
 * Hook لفحص هل الإيميل الحالي أدمن - يعيد re-render لما القائمة تتغير.
 */
export function useIsAdmin(email?: string | null): boolean {
  const extras = useAppConfigStore((s) => s.overrides.extraAdminEmails);
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return getAllAdmins(extras).includes(normalized);
}

/**
 * Hook لقائمة كل الأدمنز - يستخدم في لوحة الإدارة لعرض القائمة.
 */
export function useAdminList(): { bootstrap: string[]; extras: string[]; all: string[] } {
  const extras = useAppConfigStore((s) => s.overrides.extraAdminEmails) ?? [];
  const bootstrap = ADMIN_EMAILS.map((e) => e.toLowerCase().trim());
  return {
    bootstrap,
    extras: extras.map((e) => e.toLowerCase().trim()),
    all: getAllAdmins(extras),
  };
}

/**
 * يفحص هل الإيميل أدمن أصلي (bootstrap) - دول لا يمكن حذفهم من لوحة التحكم.
 */
export function isBootstrapAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(email.toLowerCase().trim());
}

/**
 * دمج القيم الافتراضية مع التعديلات - يستخدمها الـ hook والـ resolver خارج React.
 */
export function mergeAppInfo(overrides: AppConfigOverrides) {
  const charityDedication: typeof APP_INFO.charityDedication =
    overrides.charityDedication === null
      ? null
      : overrides.charityDedication && APP_INFO.charityDedication
        ? {
            title: overrides.charityDedication.title ?? APP_INFO.charityDedication.title,
            parents: {
              label:  overrides.charityDedication.parents?.label  ?? APP_INFO.charityDedication.parents.label,
              names:  overrides.charityDedication.parents?.names  ?? APP_INFO.charityDedication.parents.names,
              prayer: overrides.charityDedication.parents?.prayer ?? APP_INFO.charityDedication.parents.prayer,
            },
            general: {
              title:           overrides.charityDedication.general?.title           ?? APP_INFO.charityDedication.general.title,
              scope:           overrides.charityDedication.general?.scope           ?? APP_INFO.charityDedication.general.scope,
              deceasedPrayer:  overrides.charityDedication.general?.deceasedPrayer  ?? APP_INFO.charityDedication.general.deceasedPrayer,
              livingPrayer:    overrides.charityDedication.general?.livingPrayer    ?? APP_INFO.charityDedication.general.livingPrayer,
            },
          }
        : APP_INFO.charityDedication;

  return {
    name:           overrides.name           ?? APP_INFO.name,
    nameEn:         overrides.nameEn         ?? APP_INFO.nameEn,
    tagline:        overrides.tagline        ?? APP_INFO.tagline,
    version:        overrides.version        ?? APP_INFO.version,
    build:          overrides.build          ?? APP_INFO.build,
    copyrightYear:  overrides.copyrightYear  !== undefined ? overrides.copyrightYear : APP_INFO.copyrightYear,
    madeWithSuffix: overrides.madeWithSuffix ?? APP_INFO.madeWithSuffix,
    charityNotice:  overrides.charityNotice  !== undefined ? overrides.charityNotice : APP_INFO.charityNotice,
    supportEmail:   overrides.supportEmail   !== undefined ? overrides.supportEmail : APP_INFO.supportEmail,
    website:        overrides.website        !== undefined ? overrides.website : APP_INFO.website,
    githubUrl:      overrides.githubUrl      !== undefined ? overrides.githubUrl : APP_INFO.githubUrl,
    githubLabel:    overrides.githubLabel    ?? APP_INFO.githubLabel,
    appStoreUrl:    overrides.appStoreUrl    ?? APP_INFO.appStoreUrl,
    playStoreUrl:   overrides.playStoreUrl   ?? APP_INFO.playStoreUrl,
    termsUrl:       overrides.termsUrl       !== undefined ? overrides.termsUrl : APP_INFO.termsUrl,
    privacyUrl:     overrides.privacyUrl     !== undefined ? overrides.privacyUrl : APP_INFO.privacyUrl,
    shareMessage:   overrides.shareMessage   ?? APP_INFO.shareMessage,
    charityDedication,
  };
}

export function getCopyrightYearFromInfo(info: ReturnType<typeof mergeAppInfo>): number {
  return info.copyrightYear ?? new Date().getFullYear();
}
