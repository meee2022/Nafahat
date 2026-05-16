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

const API_BASE = 'https://api.alquran.cloud/v1';
const CACHE_PREFIX = '@nafahat/tafsir/';

export type TafsirEdition  =
  | 'ar.muyassar'
  | 'ar.mukhtasar'
  | 'ar.saadi'
  | 'ar.jalalayn'
  | 'ar.qurtubi';
export type TranslationEdition = 'en.sahih' | 'en.pickthall' | 'fr.hamidullah' | 'ur.maududi';
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

export interface TranslationMeta {
  id: TranslationEdition;
  nameAr: string;
  nameEn: string;
  lang: 'en' | 'fr' | 'ur';
  flag: string;
}

export const TRANSLATION_OPTIONS: TranslationMeta[] = [
  { id: 'en.sahih',      nameAr: 'إنجليزية',  nameEn: 'English',  lang: 'en', flag: '🇺🇸' },
  { id: 'en.pickthall',  nameAr: 'إنجليزية - بيكثول', nameEn: 'Pickthall', lang: 'en', flag: '🇬🇧' },
  { id: 'fr.hamidullah', nameAr: 'فرنسية',    nameEn: 'Français', lang: 'fr', flag: '🇫🇷' },
  { id: 'ur.maududi',    nameAr: 'أردية',     nameEn: 'Urdu',     lang: 'ur', flag: '🇵🇰' },
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
    // المسار: AlQuran.cloud (للميسّر، الجلالين، القرطبي، والترجمات)
    const url = `${API_BASE}/ayah/${surahId}:${ayahNumber}/${edition}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Tafsir fetch failed: HTTP ${res.status}`);
    const json = await res.json();
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
