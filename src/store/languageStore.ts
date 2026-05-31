import { create } from 'zustand';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LanguageCode, translate, TranslationKey, getLanguageMeta,
  isRtlLanguage, LANGUAGE_CODES,
} from '@/i18n/index';

interface LanguageState {
  lang: LanguageCode;
  needsRestart: boolean;
  setLang: (lang: LanguageCode) => void;
  acknowledgeRestart: () => void;
  t: (key: TranslationKey) => string;
  hydrate: () => Promise<void>;
}

const KEY = '@nafahat/language';

/**
 * يطبّق اتجاه اللغة على الـ DOM / I18nManager.
 * يُرجع true إذا تطلّب إعادة تشغيل (على Native عند تغيّر RTL).
 */
function applyDirection(lang: LanguageCode): boolean {
  const rtl = isRtlLanguage(lang);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', lang);
      if (document.body) document.body.style.direction = rtl ? 'rtl' : 'ltr';
    } catch {}
    return false;
  }

  // فرض RTL لازم لقراءة النص العربي صحيحاً على Android (Android يتجاهل writingDirection).
  void rtl;
  if (!I18nManager.isRTL) {
    try {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    } catch {}
    return true;
  }
  return false;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: 'ar',
  needsRestart: false,

  setLang(lang) {
    const needsRestart = applyDirection(lang);
    set({ lang, needsRestart: needsRestart || get().needsRestart });
    AsyncStorage.setItem(KEY, lang).catch(() => {});
  },

  acknowledgeRestart() {
    set({ needsRestart: false });
  },

  t(key) {
    return translate(key, get().lang);
  },

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw && (LANGUAGE_CODES as string[]).includes(raw)) {
        const lang = raw as LanguageCode;
        applyDirection(lang);
        set({ lang });
      } else {
        applyDirection('ar');
      }
    } catch {
      applyDirection('ar');
    }
  },
}));

export function useT() {
  return useLanguageStore((s) => s.t);
}

export function useLanguage() {
  const lang = useLanguageStore((s) => s.lang);
  return { lang, meta: getLanguageMeta(lang) };
}
