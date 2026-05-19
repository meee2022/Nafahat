/**
 * طبقة جلب نصوص القرآن من AlQuran.cloud API (مجاني وعام)
 * مع كاش متعدد المستويات:
 *   1) كاش في الذاكرة (يدوم طوال الجلسة)
 *   2) كاش في AsyncStorage (يدوم بين الجلسات - نصوص القرآن ثابتة)
 *   3) Fallback محلي إن فشلت الشبكة
 *
 * المرجع: https://alquran.cloud/api
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Ayah } from '@/types/index';

const API_BASE = 'https://api.alquran.cloud/v1';
const EDITION = 'quran-uthmani';
const CACHE_PREFIX = '@nafahat/quran/';
const CACHE_VERSION = 'v1';

interface ApiAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

interface ApiResponse {
  code: number;
  status: string;
  data: {
    number: number;
    name: string;
    englishName: string;
    ayahs: ApiAyah[];
  };
}

interface CachedSurah {
  version: string;
  surahId: number;
  ayahs: Array<{ number: number; text: string; juz: number; page: number }>;
  cachedAt: number;
}

const memoryCache = new Map<number, CachedSurah>();
const inflight = new Map<number, Promise<CachedSurah>>();

/**
 * يزيل البسملة من بداية أول آية لكل السور (ما عدا الفاتحة والتوبة)،
 * لأنها تُعرَض كعنوان منفصل في صفحة السورة.
 */
const BISMILLAH_PATTERNS: RegExp[] = [
  /^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَـٰنِ\s+ٱلرَّحِيمِ\s*/u,
  /^بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*/u,
  /^بِسْمِ\s+اللَّهِ\s+الرَّحْمَنِ\s+الرَّحِيمِ\s*/u,
  /^بِسۡمِ\s+ٱللَّهِ\s+ٱلرَّحۡمَٰنِ\s+ٱلرَّحِيمِ\s*/u,
];

function stripBismillah(text: string): string {
  for (const re of BISMILLAH_PATTERNS) {
    if (re.test(text)) return text.replace(re, '').trim();
  }
  return text;
}

async function loadFromDisk(surahId: number): Promise<CachedSurah | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + surahId);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedSurah;
    if (data.version !== CACHE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

function saveToDisk(surahId: number, data: CachedSurah): void {
  AsyncStorage.setItem(CACHE_PREFIX + surahId, JSON.stringify(data)).catch(() => {});
}

async function fetchFromAlQuranCloud(surahId: number): Promise<CachedSurah> {
  const url = `${API_BASE}/surah/${surahId}/${EDITION}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AlQuran.cloud HTTP ${res.status}`);
  const json = (await res.json()) as ApiResponse;
  if (json.code !== 200) throw new Error('AlQuran.cloud response not OK');

  const ayahs = json.data.ayahs.map((a, idx) => ({
    number: a.numberInSurah,
    // أزل البسملة من أول آية باستثناء الفاتحة (1) والتوبة (9)
    text: idx === 0 && surahId !== 1 && surahId !== 9 ? stripBismillah(a.text) : a.text,
    juz: a.juz,
    page: a.page,
  }));

  return { version: CACHE_VERSION, surahId, ayahs, cachedAt: Date.now() };
}

/**
 * 🆕 Fallback ثاني: Quran.com API.
 *   يدعم CORS من المتصفح، فبيشتغل على الـ web بدون مشاكل.
 *   لو AlQuran.cloud فشل (CORS أو network)، نجرّب ده تلقائياً.
 *
 *   مرجع: https://api-docs.quran.com/docs/api/quranic-info/verses
 *   Endpoint: GET https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=N
 */
const QURAN_COM_BASE = 'https://api.quran.com/api/v4';

interface QuranComVerse {
  id: number;
  verse_key: string; // "1:1"
  verse_number: number;
  juz_number?: number;
  page_number?: number;
  text_uthmani: string;
}

async function fetchFromQuranCom(surahId: number): Promise<CachedSurah> {
  // النصّ العثماني + بيانات الـ verses (juz_number + page_number)
  const textUrl   = `${QURAN_COM_BASE}/quran/verses/uthmani?chapter_number=${surahId}`;
  const metaUrl   = `${QURAN_COM_BASE}/verses/by_chapter/${surahId}?fields=juz_number,page_number&per_page=300`;

  const [textRes, metaRes] = await Promise.all([fetch(textUrl), fetch(metaUrl)]);
  if (!textRes.ok) throw new Error(`Quran.com text HTTP ${textRes.status}`);
  const textJson = await textRes.json();
  const verses: QuranComVerse[] = textJson?.verses ?? [];
  if (verses.length === 0) throw new Error('Quran.com: empty verses');

  // ادمج meta لو متاحة، وإلا نستخدم 0 (آيات بدون juz/page صحيحة - السورة هتشتغل
  // في الكويز بس مش هتكون فلترة دقيقة بالـ juz من جانب الـ ayah - والـ surah.juzStart
  // كافي للأغراض العامة)
  let metaMap = new Map<number, { juz: number; page: number }>();
  if (metaRes.ok) {
    const metaJson = await metaRes.json();
    const metaVerses: QuranComVerse[] = metaJson?.verses ?? [];
    for (const v of metaVerses) {
      metaMap.set(v.verse_number, {
        juz: v.juz_number ?? 0,
        page: v.page_number ?? 0,
      });
    }
  }

  const ayahs = verses.map((v, idx) => {
    const meta = metaMap.get(v.verse_number);
    const text = v.text_uthmani || '';
    return {
      number: v.verse_number,
      text: idx === 0 && surahId !== 1 && surahId !== 9 ? stripBismillah(text) : text,
      juz: meta?.juz ?? 0,
      page: meta?.page ?? 0,
    };
  });

  return { version: CACHE_VERSION, surahId, ayahs, cachedAt: Date.now() };
}

/**
 * يختار الـ API الصحيح حسب الـ platform:
 *  - على web: Quran.com مباشرة (AlQuran.cloud ما عندوش CORS فبيفشل وبيلوّث الـ console)
 *  - على native (iOS/Android): AlQuran.cloud أولاً، ثم Quran.com كـ fallback
 *
 * ده بيمنع spam الـ CORS errors في browser console أثناء dev، ويحافظ على
 * نفس الـ behavior على native (الـ AlQuran.cloud عادة أسرع وفيه edition تاني).
 */
async function fetchFromApi(surahId: number): Promise<CachedSurah> {
  // 🌐 على web: ابدأ بـ Quran.com مباشرة (CORS-friendly)
  if (Platform.OS === 'web') {
    try {
      return await fetchFromQuranCom(surahId);
    } catch (webErr) {
      // لو حتى Quran.com فشل، خلاص ارمِ الخطأ
      throw webErr;
    }
  }

  // 📱 على native: AlQuran.cloud أولاً، ثم Quran.com fallback
  try {
    return await fetchFromAlQuranCloud(surahId);
  } catch (primaryErr) {
    try {
      return await fetchFromQuranCom(surahId);
    } catch (fallbackErr) {
      throw primaryErr;
    }
  }
}

/**
 * يُعيد آيات سورة كاملة - من الذاكرة، أو القرص، أو الشبكة.
 * يرمي خطأً فقط إذا فشل كل شيء (لا شبكة ولا كاش).
 */
export async function getSurahAyahs(surahId: number): Promise<Ayah[]> {
  // 1) memory
  const mem = memoryCache.get(surahId);
  if (mem) return toAyahs(mem);

  // 2) inflight - تجنب الطلبات المكررة لنفس السورة
  if (inflight.has(surahId)) {
    const data = await inflight.get(surahId)!;
    return toAyahs(data);
  }

  const promise = (async () => {
    // 3) disk
    const disk = await loadFromDisk(surahId);
    if (disk) {
      memoryCache.set(surahId, disk);
      return disk;
    }

    // 4) network
    const fresh = await fetchFromApi(surahId);
    memoryCache.set(surahId, fresh);
    saveToDisk(surahId, fresh);
    return fresh;
  })();

  inflight.set(surahId, promise);
  try {
    const data = await promise;
    return toAyahs(data);
  } finally {
    inflight.delete(surahId);
  }
}

function toAyahs(cached: CachedSurah): Ayah[] {
  return cached.ayahs.map((a) => ({
    surahId: cached.surahId,
    number: a.number,
    text: a.text,
    page: a.page,
    juz: a.juz,
  }));
}

/**
 * يمسح كاش سورة معينة (للتشخيص أو لإعادة التحميل).
 */
export async function clearSurahCache(surahId: number): Promise<void> {
  memoryCache.delete(surahId);
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + surahId);
  } catch {}
}

/**
 * يُحضّر مسبقًا سورًا في الخلفية (مثل آخر موضع قراءة وما حوله).
 */
export function prefetchSurahs(ids: number[]): void {
  for (const id of ids) {
    if (!memoryCache.has(id) && !inflight.has(id)) {
      getSurahAyahs(id).catch(() => {});
    }
  }
}
