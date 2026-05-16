/**
 * البحث في نصوص القرآن.
 *
 * استراتيجية:
 *   ١. عند الإقلاع/أول بحث، نبني فهرس in-memory من كل السور المحفوظة في AsyncStorage.
 *   ٢. كل بحث لاحق يفحص الفهرس مباشرة - زمن O(N) لكن بدون أي I/O.
 *   ٣. النص مُطبَّع مسبقاً (التشكيل/الألف/الياء)، فالمقارنة سريعة جداً.
 *
 * الميزة: لم نعد نعمل getAllKeys + getItem لكل ضغطة زرّ.
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

// ─────────────────────────────────────────────
// 📚 فهرس بحث في الذاكرة (in-memory index)
// ─────────────────────────────────────────────

interface IndexedAyah {
  surahId: number;
  ayahNumber: number;
  /** النص الأصلي للعرض. */
  text: string;
  /** النص المُطبَّع للمقارنة. */
  normalizedText: string;
}

let searchIndex: IndexedAyah[] | null = null;
let buildIndexPromise: Promise<IndexedAyah[]> | null = null;

/** يبني الفهرس مرة واحدة من كل السور المخزَّنة في AsyncStorage. */
async function buildIndex(): Promise<IndexedAyah[]> {
  if (searchIndex) return searchIndex;
  if (buildIndexPromise) return buildIndexPromise;

  buildIndexPromise = (async () => {
    const out: IndexedAyah[] = [];
    try {
      const keys = await AsyncStorage.getAllKeys();
      const quranKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      // multiGet دفعة واحدة - أسرع بكثير من getItem لكل مفتاح
      const entries = await AsyncStorage.multiGet(quranKeys);
      for (const [, raw] of entries) {
        if (!raw) continue;
        try {
          const cached = JSON.parse(raw);
          const ayahs: Ayah[] = cached.ayahs ?? cached;
          if (!Array.isArray(ayahs)) continue;
          for (const a of ayahs) {
            out.push({
              surahId:    a.surahId,
              ayahNumber: a.number,
              text:       a.text,
              normalizedText: normalize(a.text),
            });
          }
        } catch {}
      }
    } catch {}
    searchIndex = out;
    return out;
  })();

  return buildIndexPromise;
}

/** يُلغي الفهرس - يُستدعى عند تحديث الكاش (مثلاً عند تحميل سورة جديدة). */
export function invalidateSearchIndex(): void {
  searchIndex = null;
  buildIndexPromise = null;
}

/**
 * يبحث في كل السور المخزَّنة - يستخدم فهرس in-memory.
 * يعيد أول maxResults نتائج (الافتراضي 50).
 */
export async function searchQuran(query: string, maxResults: number = 50): Promise<SearchResult[]> {
  const q = normalize(query);
  if (q.length < 2) return [];

  const index = await buildIndex();
  const results: SearchResult[] = [];

  for (const item of index) {
    if (results.length >= maxResults) break;
    const idx = item.normalizedText.indexOf(q);
    if (idx === -1) continue;
    const surah = getSurahById(item.surahId);
    results.push({
      surahId:    item.surahId,
      surahName:  surah?.nameAr ?? `سورة ${item.surahId}`,
      ayahNumber: item.ayahNumber,
      text:       item.text,
      matchStart: idx,
      matchEnd:   idx + q.length,
    });
  }

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
