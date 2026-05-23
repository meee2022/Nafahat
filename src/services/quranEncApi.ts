/**
 * 🕌 خدمة QuranEnc.com API - موسوعة القرآن الكريم.
 *
 * توفّر:
 *   - تفاسير عربية متعدّدة (الميسر، المختصر، السعدي، ابن كثير، إلخ)
 *   - ترجمات بـ 80+ لغة
 *   - audio لكل آية
 *
 * المصدر الرسمي: https://quranenc.com
 * API Docs: https://quranenc.com/en/home/api/
 */

const API_BASE = 'https://quranenc.com/api/v1';
const AUDIO_BASE = 'https://d.quranenc.com/data/audio';

// ─────────────── الأنواع ───────────────

export interface QuranEncTranslation {
  key: string;
  direction: 'rtl' | 'ltr';
  language_iso_code: string;
  version: string;
  last_update: number;
  title: string;
  description: string;
}

export interface QuranEncAyah {
  id: string;
  sura: string;
  aya: string;
  arabic_text: string;
  translation: string;
  footnotes?: string;
}

// ─────────────── المصادر الموصى بها ───────────────

/**
 * المصادر العربية المتاحة - تفاسير معتمدة.
 */
export const ARABIC_SOURCES = {
  /** التفسير الميسر - مجمع الملك فهد - بسيط وواضح للعامة. */
  moyassar:   { key: 'arabic_moyassar',  title: 'التفسير الميسّر',     short: 'الميسّر' },
  /** المختصر في التفسير - أعمق قليلاً، من مركز تفسير. */
  mukhtasar:  { key: 'arabic_mukhtasar', title: 'المختصر في التفسير',  short: 'المختصر' },
  /** تفسير السعدي - شامل ومحبّب. */
  saadi:      { key: 'arabic_saadi',     title: 'تفسير السعدي',        short: 'السعدي' },
} as const;

export type ArabicSourceKey = keyof typeof ARABIC_SOURCES;

/**
 * أهم الترجمات للغات المدعومة.
 */
export const POPULAR_TRANSLATIONS = {
  en: { key: 'english_saheeh',  title: 'Saheeh International' },
  fr: { key: 'french_rashid',   title: 'الترجمة الفرنسية' },
  ur: { key: 'urdu_junagarhi',  title: 'اردو ترجمہ' },
  id: { key: 'indonesian_complex', title: 'Bahasa Indonesia' },
  tr: { key: 'turkish_shaban',  title: 'Türkçe' },
  fa: { key: 'persian_makaram', title: 'فارسی' },
  ms: { key: 'malayalam_kunhi', title: 'Bahasa Melayu' },
  sw: { key: 'swahili_barwani', title: 'Kiswahili' },
  ha: { key: 'hausa_gummi',     title: 'Hausa' },
} as const;

// ─────────────── Cache محدود (LRU) لمنع تسرّب الذاكرة ───────────────

import { Platform } from 'react-native';
import { LruCache } from '@/utils/lruCache';

const cache = new LruCache<string, Promise<any>>(300);

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = cache.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fetcher();
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 10000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithCorsProxy(directUrl: string): Promise<any> {
  if (Platform.OS !== 'web') {
    try {
      return await fetchJsonWithTimeout(directUrl, 8000);
    } catch {}
  }

  // Web / Fallback proxy
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`;
    const res = await fetchJsonWithTimeout(proxyUrl, 8000);
    if (res?.contents) return JSON.parse(res.contents);
  } catch {}

  try {
    const proxyUrl2 = `https://corsproxy.io/?url=${encodeURIComponent(directUrl)}`;
    return await fetchJsonWithTimeout(proxyUrl2, 8000);
  } catch {
    return await fetchJsonWithTimeout(directUrl, 8000);
  }
}

// ─────────────── الـ API methods ───────────────

/**
 * يجلب آية محدّدة من ترجمة/تفسير معيّن.
 * مثال: getAyah('arabic_moyassar', 2, 255) → آية الكرسي بالتفسير الميسر
 */
export async function getAyah(
  translationKey: string,
  suraNumber: number,
  ayaNumber: number,
): Promise<QuranEncAyah | null> {
  const key = `${translationKey}/${suraNumber}/${ayaNumber}`;
  return cached(key, async () => {
    try {
      const directUrl = `${API_BASE}/translation/aya/${translationKey}/${suraNumber}/${ayaNumber}`;
      const json = await fetchWithCorsProxy(directUrl);
      return json?.result ?? null;
    } catch {
      return null;
    }
  });
}

/**
 * يجلب كل آيات السورة من ترجمة/تفسير معيّن.
 */
export async function getSuraTranslation(
  translationKey: string,
  suraNumber: number,
): Promise<QuranEncAyah[]> {
  const key = `sura/${translationKey}/${suraNumber}`;
  return cached(key, async () => {
    try {
      const directUrl = `${API_BASE}/translation/sura/${translationKey}/${suraNumber}`;
      const json = await fetchWithCorsProxy(directUrl);
      return Array.isArray(json?.result) ? json.result : [];
    } catch {
      return [];
    }
  });
}

/**
 * يجلب التفسير العربي + ترجمة بلغة محدّدة لآية معيّنة.
 * أسرع طريقة للحصول على كل شيء عن آية.
 */
export async function getAyahDetails(
  suraNumber: number,
  ayaNumber: number,
  tafsirSource: ArabicSourceKey = 'moyassar',
  translationLang?: keyof typeof POPULAR_TRANSLATIONS,
): Promise<{
  arabic: string;
  tafsir: QuranEncAyah | null;
  translation: QuranEncAyah | null;
}> {
  const tafsirKey = ARABIC_SOURCES[tafsirSource].key;
  const transKey = translationLang ? POPULAR_TRANSLATIONS[translationLang].key : null;

  const [tafsir, translation] = await Promise.all([
    getAyah(tafsirKey, suraNumber, ayaNumber),
    transKey ? getAyah(transKey, suraNumber, ayaNumber) : Promise.resolve(null),
  ]);

  return {
    arabic: tafsir?.arabic_text ?? translation?.arabic_text ?? '',
    tafsir,
    translation,
  };
}

/**
 * يولّد URL للصوت لآية معيّنة بترجمة معيّنة.
 */
export function getAyahAudioUrl(
  translationKey: string,
  suraNumber: number,
  ayaNumber: number,
): string {
  const sura3 = String(suraNumber).padStart(3, '0');
  const aya3 = String(ayaNumber).padStart(3, '0');
  return `${AUDIO_BASE}/${translationKey}/${sura3}${aya3}.mp3`;
}
