/**
 * خدمة جلب تفسير الآيات والترجمات.
 * مع كاش في الذاكرة + AsyncStorage (التفاسير ثابتة، تستحقّ الحفظ الدائم).
 *
 * المصادر:
 *  - AlQuran.cloud API → الميسّر، الجلالين، القرطبي + الترجمات
 *  - QuranEnc.com API  → المختصر، السعدي (تفاسير معتمدة من مركز تفسير ومجمع الملك فهد)
 *
 * مراجع التفاسير المتاحة:
 *  - ar.muyassar  : التفسير الميسّر (الأسهل والأشهر)
 *  - ar.mukhtasar : المختصر في التفسير (مركز تفسير - من QuranEnc)
 *  - ar.saadi     : تفسير السعدي (شامل ومحبّب - من QuranEnc)
 *  - ar.jalalayn  : تفسير الجلالين (كلاسيكي)
 *  - ar.qurtubi   : تفسير القرطبي (موسوعي)
 *
 * الترجمات:
 *  - en.sahih      : Sahih International (إنجليزية شائعة)
 *  - en.pickthall  : Pickthall
 *  - fr.hamidullah : Hamidullah (فرنسية)
 *  - ur.maududi    : أردية - مودودي
 *
 * المراجع: https://alquran.cloud/api  |  https://quranenc.com/en/home/api/
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { getAyah as getQuranEncAyah } from './quranEncApi';
import { LruCache } from '@/utils/lruCache';

const API_BASE       = 'https://api.alquran.cloud/v1';
const QURAN_COM_BASE = 'https://api.quran.com/api/v4';
const CACHE_PREFIX   = '@nafahat/tafsir/';

/**
 * معرّفات تفاسير quran.com (CORS-safe على الويب):
 * يمكن الحصول على القائمة من: GET /resources/tafsirs
 */
const QURAN_COM_TAFSIR_IDS: Partial<Record<string, number>> = {
  'ar.muyassar':  381,   // التفسير الميسّر
  'ar.jalalayn':  74,    // تفسير الجلالين
  'ar.qurtubi':   169,   // تفسير القرطبي (متاح في بعض النسخ)
};

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

/**
 * يجلب تفسيراً عبر quran.com API (CORS-friendly دائماً)
 */
async function fetchFromQuranCom(edition: string, surahId: number, ayahNumber: number): Promise<string | null> {
  const tafsirId = QURAN_COM_TAFSIR_IDS[edition];
  if (!tafsirId) return null;

  const url = `${QURAN_COM_BASE}/tafsirs/${tafsirId}/by_ayah/${surahId}:${ayahNumber}`;
  const json = await fetchJsonWithTimeout(url, 8000);
  const text: string = json?.tafsir?.text ?? '';
  if (!text) return null;
  // إزالة HTML tags لو وُجدت
  return text.replace(/<[^>]+>/g, '').trim() || null;
}

/**
 * يجلب JSON من AlQuran.cloud مع fallback متعدد:
 *  1) quran.com (CORS-safe) — للإصدارات المدعومة
 *  2) AlQuran.cloud مباشرة — على native
 *  3) AllOrigins proxy — fallback مجاني وموثوق
 *  4) CORS-Anywhere — fallback أخير
 */
async function fetchAlQuranCloudJson(directUrl: string, edition?: string, surahId?: number, ayahNumber?: number): Promise<any> {
  // ── محاولة 1: quran.com (CORS-safe دائماً)
  if (edition && surahId && ayahNumber) {
    try {
      const qcText = await fetchFromQuranCom(edition, surahId, ayahNumber);
      if (qcText) {
        // نُعيد كـ shape متوافق مع الكود الحالي
        return { data: { text: qcText } };
      }
    } catch {}
  }

  // ── محاولة 2: AlQuran.cloud مباشرة (native أو web)
  try {
    return await fetchJsonWithTimeout(directUrl, 8000);
  } catch {}

  // ── محاولة 3: allorigins.win proxy (مجاني وموثوق)
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`;
    const res = await fetchJsonWithTimeout(proxyUrl, 8000);
    // allorigins يُعيد { contents: '...json...' }
    if (res?.contents) return JSON.parse(res.contents);
  } catch {}

  // ── محاولة 4: corsproxy.io كآخر محاولة
  try {
    const proxyUrl2 = `https://corsproxy.io/?url=${encodeURIComponent(directUrl)}`;
    return await fetchJsonWithTimeout(proxyUrl2, 8000);
  } catch (err) {
    throw err;
  }
}


export type TafsirEdition  =
  | 'ar.muyassar'
  | 'ar.mukhtasar'
  | 'ar.saadi'
  | 'ar.jalalayn'
  | 'ar.qurtubi';
export type TranslationEdition =
  // English
  | 'en.sahih' | 'en.pickthall' | 'en.yusufali' | 'en.asad'
  // French / Spanish / German
  | 'fr.hamidullah' | 'es.cortes' | 'de.bubenheim'
  // Asian
  | 'tr.diyanet' | 'id.indonesian' | 'ms.basmeih' | 'ru.kuliev'
  // Indian subcontinent
  | 'ur.maududi' | 'ur.junagarhi' | 'bn.bengali' | 'fa.makarem'
  // African languages
  | 'ha.gumi' | 'sw.barwani';
export type AyahTextEdition = TafsirEdition | TranslationEdition;

/**
 * ربط الإصدارات الخاصة بـ QuranEnc بمفاتيحها الأصلية في الـ API.
 * أي إصدار غير موجود هنا → يُستخدم AlQuran.cloud.
 */
const QURANENC_KEYS: Partial<Record<AyahTextEdition, string>> = {
  'ar.mukhtasar': 'arabic_mukhtasar',
  'ar.saadi':     'arabic_saadi',
};

export interface TafsirMeta {
  id: TafsirEdition;
  nameAr: string;
  nameEn: string;
  description: string;
}

export const TAFSIR_OPTIONS: TafsirMeta[] = [
  { id: 'ar.muyassar',  nameAr: 'الميسّر',   nameEn: 'Muyassar',  description: 'أسهل التفاسير وأكثرها وضوحاً' },
  { id: 'ar.mukhtasar', nameAr: 'المختصر',   nameEn: 'Mukhtasar', description: 'المختصر في التفسير - مركز تفسير' },
  { id: 'ar.saadi',     nameAr: 'السعدي',    nameEn: 'Saadi',     description: 'تفسير الشيخ السعدي - شامل ومحبّب' },
  { id: 'ar.jalalayn',  nameAr: 'الجلالين',  nameEn: 'Jalalayn',  description: 'كلاسيكي مختصر، للسيوطي والمحلّي' },
  { id: 'ar.qurtubi',   nameAr: 'القرطبي',   nameEn: 'Qurtubi',   description: 'تفسير موسوعي شامل' },
];

export type TranslationLang =
  | 'en' | 'fr' | 'es' | 'de'
  | 'tr' | 'id' | 'ms' | 'ru'
  | 'ur' | 'bn' | 'fa'
  | 'ha' | 'sw';

export interface TranslationMeta {
  id: TranslationEdition;
  nameAr: string;
  nameEn: string;
  lang: TranslationLang;
  flag: string;
}

export const TRANSLATION_OPTIONS: TranslationMeta[] = [
  // English
  { id: 'en.sahih',       nameAr: 'إنجليزية - صحيح',   nameEn: 'English (Sahih)',     lang: 'en', flag: '🇺🇸' },
  { id: 'en.pickthall',   nameAr: 'إنجليزية - بيكثول', nameEn: 'English (Pickthall)', lang: 'en', flag: '🇬🇧' },
  { id: 'en.yusufali',    nameAr: 'إنجليزية - يوسف علي', nameEn: 'English (Yusuf Ali)', lang: 'en', flag: '🇬🇧' },
  { id: 'en.asad',        nameAr: 'إنجليزية - أسد',    nameEn: 'English (Asad)',      lang: 'en', flag: '🇺🇸' },
  // European
  { id: 'fr.hamidullah',  nameAr: 'فرنسية',            nameEn: 'Français',            lang: 'fr', flag: '🇫🇷' },
  { id: 'es.cortes',      nameAr: 'إسبانية',           nameEn: 'Español',             lang: 'es', flag: '🇪🇸' },
  { id: 'de.bubenheim',   nameAr: 'ألمانية',           nameEn: 'Deutsch',             lang: 'de', flag: '🇩🇪' },
  { id: 'ru.kuliev',      nameAr: 'روسية',             nameEn: 'Русский',             lang: 'ru', flag: '🇷🇺' },
  // Asian / SE Asian
  { id: 'tr.diyanet',     nameAr: 'تركية',             nameEn: 'Türkçe',              lang: 'tr', flag: '🇹🇷' },
  { id: 'id.indonesian',  nameAr: 'إندونيسية',         nameEn: 'Indonesia',           lang: 'id', flag: '🇮🇩' },
  { id: 'ms.basmeih',     nameAr: 'ماليزية',           nameEn: 'Melayu',              lang: 'ms', flag: '🇲🇾' },
  // Indian subcontinent
  { id: 'ur.maududi',     nameAr: 'أردية - مودودي',    nameEn: 'Urdu (Maududi)',      lang: 'ur', flag: '🇵🇰' },
  { id: 'ur.junagarhi',   nameAr: 'أردية - جوناكاره',  nameEn: 'Urdu (Junagarhi)',    lang: 'ur', flag: '🇵🇰' },
  { id: 'bn.bengali',     nameAr: 'بنغالية',           nameEn: 'বাংলা',                lang: 'bn', flag: '🇧🇩' },
  { id: 'fa.makarem',     nameAr: 'فارسية',            nameEn: 'فارسی',               lang: 'fa', flag: '🇮🇷' },
  // African
  { id: 'ha.gumi',        nameAr: 'هوسا',              nameEn: 'Hausa',               lang: 'ha', flag: '🇳🇬' },
  { id: 'sw.barwani',     nameAr: 'سواحيلية',          nameEn: 'Kiswahili',           lang: 'sw', flag: '🇹🇿' },
];

// كاش الذاكرة (خلال الجلسة الواحدة) - محدود بـ 200 آية لمنع تسرّب الذاكرة
// (كل آية ~500 byte → ~100KB سقف)
const memoryCache = new LruCache<string, string>(200);

function cacheKey(surahId: number, ayahNumber: number, edition: AyahTextEdition): string {
  return `${edition}:${surahId}:${ayahNumber}`;
}

function storageKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

/**
 * يجلب نص الآية بطبعة معيّنة (تفسير أو ترجمة).
 * يحاول الكاش أولاً، ثم AsyncStorage، ثم API.
 */
export async function getAyahText(
  surahId: number,
  ayahNumber: number,
  edition: AyahTextEdition,
): Promise<string> {
  const key = cacheKey(surahId, ayahNumber, edition);

  // 1) الذاكرة
  const memHit = memoryCache.get(key);
  if (memHit) return memHit;

  // 2) AsyncStorage
  try {
    const stored = await AsyncStorage.getItem(storageKey(key));
    if (stored) {
      memoryCache.set(key, stored);
      return stored;
    }
  } catch {}

  // 3) API
  let text = '';

  const quranEncKey = QURANENC_KEYS[edition];
  if (quranEncKey) {
    // المسار: QuranEnc.com (للمختصر والسعدي)
    const result = await getQuranEncAyah(quranEncKey, surahId, ayahNumber);
    text = result?.translation ?? '';
    // الهوامش المعتمدة (إن وُجدت) تُضاف للنص للقارئ
    if (result?.footnotes) {
      const cleanedFootnotes = result.footnotes.replace(/<[^>]+>/g, '').trim();
      if (cleanedFootnotes) text += `\n\n${cleanedFootnotes}`;
    }
  } else {
    // المسار: AlQuran.cloud مع fallback تلقائي لـ quran.com وproxies متعددة
    const directUrl = `${API_BASE}/ayah/${surahId}:${ayahNumber}/${edition}`;
    const json = await fetchAlQuranCloudJson(directUrl, edition, surahId, ayahNumber);
    text = json?.data?.text ?? '';
  }

  if (!text) throw new Error('Empty tafsir response');

  // احفظ
  memoryCache.set(key, text);
  AsyncStorage.setItem(storageKey(key), text).catch(() => {});

  return text;
}

/** يمسح كاش التفاسير (للاستخدام في إعدادات التحميلات). */
export async function clearTafsirCache(): Promise<void> {
  try {
    memoryCache.clear();
    const keys = await AsyncStorage.getAllKeys();
    const tafsirKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(tafsirKeys);
  } catch {}
}
