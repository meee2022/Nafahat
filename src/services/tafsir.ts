/**
 * خدمة جلب تفسير الآيات والترجمات من AlQuran.cloud API.
 * مع كاش في الذاكرة + AsyncStorage (التفاسير ثابتة، تستحقّ الحفظ الدائم).
 *
 * مراجع التفاسير المتاحة:
 *  - ar.muyassar : التفسير الميسّر (الأسهل والأشهر)
 *  - ar.jalalayn : تفسير الجلالين (كلاسيكي)
 *  - ar.qurtubi  : تفسير القرطبي (موسوعي)
 *
 * الترجمات:
 *  - en.sahih      : Sahih International (إنجليزية شائعة)
 *  - en.pickthall  : Pickthall
 *  - fr.hamidullah : Hamidullah (فرنسية)
 *  - ur.maududi    : أردية - مودودي
 *
 * المرجع: https://alquran.cloud/api
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.alquran.cloud/v1';
const CACHE_PREFIX = '@nafahat/tafsir/';

export type TafsirEdition  = 'ar.muyassar' | 'ar.jalalayn' | 'ar.qurtubi';
export type TranslationEdition = 'en.sahih' | 'en.pickthall' | 'fr.hamidullah' | 'ur.maududi';
export type AyahTextEdition = TafsirEdition | TranslationEdition;

export interface TafsirMeta {
  id: TafsirEdition;
  nameAr: string;
  nameEn: string;
  description: string;
}

export const TAFSIR_OPTIONS: TafsirMeta[] = [
  { id: 'ar.muyassar', nameAr: 'الميسّر',  nameEn: 'Muyassar',  description: 'أسهل التفاسير وأكثرها وضوحاً' },
  { id: 'ar.jalalayn', nameAr: 'الجلالين', nameEn: 'Jalalayn', description: 'كلاسيكي مختصر، للسيوطي والمحلّي' },
  { id: 'ar.qurtubi',  nameAr: 'القرطبي',  nameEn: 'Qurtubi',  description: 'تفسير موسوعي شامل' },
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

// كاش الذاكرة (خلال الجلسة الواحدة)
const memoryCache = new Map<string, string>();

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
  const url = `${API_BASE}/ayah/${surahId}:${ayahNumber}/${edition}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tafsir fetch failed: HTTP ${res.status}`);
  const json = await res.json();
  const text: string = json?.data?.text ?? '';
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
