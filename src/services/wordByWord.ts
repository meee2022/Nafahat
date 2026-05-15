/**
 * خدمة معاني الكلمات (Word-by-Word) من Quran.com API.
 *
 * تجلب لكل آية: قائمة كلمات، كل كلمة فيها:
 *  - النص العثماني
 *  - الترجمة الإنجليزية
 *  - الـ transliteration
 *  - حالة الكلمة (إعراب)
 *
 * المرجع: https://api-docs.quran.com (v4)
 * Endpoint: GET https://api.quran.com/api/v4/verses/by_key/{surahId}:{ayahNumber}?words=true&word_translation_language=en
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.quran.com/api/v4';
const CACHE_PREFIX = '@nafahat/wbw/';

export interface QuranWord {
  /** النص العثماني للكلمة. */
  text: string;
  /** الترجمة الإنجليزية للكلمة (Sahih أو الافتراضية). */
  translation: string;
  /** transliteration (نطق بحروف لاتينية). */
  transliteration: string;
  /** موقع الكلمة في الآية (1-indexed). */
  position: number;
}

const memoryCache = new Map<string, QuranWord[]>();

function cacheKey(surahId: number, ayahNumber: number): string {
  return `${surahId}:${ayahNumber}`;
}

/**
 * يجلب كلمات آية مع ترجمتها كلمة-كلمة.
 */
export async function getWordsByVerse(surahId: number, ayahNumber: number): Promise<QuranWord[]> {
  const key = cacheKey(surahId, ayahNumber);

  // الذاكرة
  if (memoryCache.has(key)) return memoryCache.get(key)!;

  // AsyncStorage
  try {
    const stored = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (stored) {
      const parsed: QuranWord[] = JSON.parse(stored);
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch {}

  // API
  const url = `${API_BASE}/verses/by_key/${surahId}:${ayahNumber}?words=true&word_translation_language=en&word_fields=text_uthmani,transliteration,translation`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Word-by-word fetch failed: HTTP ${res.status}`);
  const json = await res.json();

  const rawWords = json?.verse?.words ?? [];
  const words: QuranWord[] = rawWords
    .filter((w: any) => w.text_uthmani || w.text)
    .map((w: any, i: number) => ({
      text:            w.text_uthmani ?? w.text ?? '',
      translation:     w.translation?.text ?? '',
      transliteration: w.transliteration?.text ?? '',
      position:        i + 1,
    }))
    // نزيل الكلمة الأخيرة إذا كانت رقم آية فقط (مثل "1)" أو ۝)
    .filter((w: QuranWord) => !/^[\d۝]+$/.test(w.text.trim()));

  memoryCache.set(key, words);
  AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(words)).catch(() => {});

  return words;
}

/** يمسح كاش معاني الكلمات. */
export async function clearWordByWordCache(): Promise<void> {
  try {
    memoryCache.clear();
    const keys = await AsyncStorage.getAllKeys();
    const wbwKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(wbwKeys);
  } catch {}
}
