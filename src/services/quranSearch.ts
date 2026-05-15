/**
 * البحث في نصوص القرآن - يبحث في الآيات المخزَّنة في الكاش (AsyncStorage).
 * يدعم التطبيع: تجاهل التشكيل، الهمزات، والتاء المربوطة.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ayah } from '@/types/index';
import { SURAHS, getSurahById } from '@data/surahs';

const CACHE_PREFIX = '@nafahat/quran/';

export interface SearchResult {
  surahId: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  /** نص الآية بعد إبراز موضع التطابق - يُستخدم في UI للـ highlight. */
  matchStart: number;
  matchEnd: number;
}

/** يطبّع النص العربي للبحث: يحذف التشكيل والمسافات الزائدة وتطبيع الحروف. */
export function normalize(text: string): string {
  return text
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')         // إزالة التشكيل
    .replace(/[إأآا]/g, 'ا')                                       // توحيد الألف
    .replace(/ة/g, 'ه')                                             // التاء المربوطة → هاء
    .replace(/ى/g, 'ي')                                             // الألف المقصورة → ياء
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * يبحث في كل السور المخزَّنة في AsyncStorage.
 * يعيد أول maxResults نتائج (الافتراضي 50).
 */
export async function searchQuran(query: string, maxResults: number = 50): Promise<SearchResult[]> {
  const q = normalize(query);
  if (q.length < 2) return [];

  const results: SearchResult[] = [];

  try {
    const keys = await AsyncStorage.getAllKeys();
    const quranKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));

    for (const key of quranKeys) {
      if (results.length >= maxResults) break;
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      try {
        const cached = JSON.parse(raw);
        const ayahs: Ayah[] = cached.ayahs ?? cached;
        if (!Array.isArray(ayahs)) continue;

        for (const ayah of ayahs) {
          if (results.length >= maxResults) break;
          const normalizedText = normalize(ayah.text);
          const idx = normalizedText.indexOf(q);
          if (idx === -1) continue;

          const surah = getSurahById(ayah.surahId);
          results.push({
            surahId:    ayah.surahId,
            surahName:  surah?.nameAr ?? `سورة ${ayah.surahId}`,
            ayahNumber: ayah.number,
            text:       ayah.text,
            matchStart: idx,
            matchEnd:   idx + q.length,
          });
        }
      } catch {}
    }
  } catch {}

  return results;
}

/**
 * يبحث في أسماء السور.
 */
export function searchSurahs(query: string): typeof SURAHS {
  const q = normalize(query);
  return SURAHS.filter((s) =>
    normalize(s.nameAr).includes(q) ||
    s.nameEn.toLowerCase().includes(query.toLowerCase()),
  );
}
