/**
 * 🎯 توقيت الآيات الدقيق - بديل علمي للحساب التقريبي بعدد الحروف.
 *
 * يستخدم API "Quran Developer Cloud" (qurancdn.com) الذي يوفّر:
 *   - توقيت كل آية (timestamp_from, timestamp_to) بالملي ثانية
 *   - segments للكلمات داخل الآية (للتظليل كلمة-بكلمة)
 *
 * يُحوّل توقيتات Alafasy إلى توقيتات تتناسب مع مدة أي قارئ آخر
 * بواسطة سُلَّم نسبي (scaling) - دقّة أعلى بكثير من تقدير الحروف.
 *
 * https://api.qurancdn.com/api/qdc/audio/reciters/{reciterId}/audio_files
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LruCache } from '@/utils/lruCache';

const API_BASE = 'https://api.qurancdn.com/api/qdc';
const CACHE_PREFIX = '@nafahat/timings/v2/';
/**
 * مُعرّف العفاسي على Quran.com - fallback لو القارئ مش معروف.
 */
const DEFAULT_RECITATION_ID = 7;

// ─────────────────────────────────────────────
// 🔤 الأنواع
// ─────────────────────────────────────────────

export interface WordSegment {
  /** موضع الكلمة في الآية (1-indexed). */
  position: number;
  /** متى تبدأ بالـ ms من بداية الـ MP3 المرجعي. */
  fromMs: number;
  /** متى تنتهي. */
  toMs: number;
}

export interface VerseTiming {
  verseKey: string;   // "2:1"
  verseNumber: number;
  fromMs: number;
  toMs: number;
  durationMs: number;
  /** segments الكلمات داخل الآية - أساس تظليل الكلمة الجارية. */
  words: WordSegment[];
}

export interface SurahTimings {
  surahId: number;
  /** مدة الـ MP3 المرجعي بالكامل بالملي ثانية. */
  totalDurationMs: number;
  /** آيات السورة بترتيب التلاوة. */
  verses: VerseTiming[];
  /** 🎯 رابط ملف الصوت اللي التوقيتات متظبوطة عليه بالظبط (للقفز الدقيق). */
  audioUrl?: string;
}

// ─────────────────────────────────────────────
// 💾 كاش (ذاكرة + AsyncStorage)
// ─────────────────────────────────────────────

// كاش بمفتاح مركّب (recitationId + surahId) لتجنّب الخلط بين قرّاء مختلفين
const memCache = new LruCache<string, SurahTimings>(40);
const inflight = new Map<string, Promise<SurahTimings | null>>();

function cacheKey(recitationId: number, surahId: number): string {
  return `${recitationId}:${surahId}`;
}

function storageKey(recitationId: number, surahId: number): string {
  return `${CACHE_PREFIX}${recitationId}:${surahId}`;
}

// ─────────────────────────────────────────────
// 📥 الجلب
// ─────────────────────────────────────────────

/**
 * يجلب توقيتات سورة كاملة لقارئ محدّد. يحاول الذاكرة، ثم AsyncStorage، ثم API.
 * لو فشل، يجرّب fallback لتوقيتات العفاسي (مع scaling) لتفادي العودة لـ char-count.
 * يُرجع null لو فشلت كل المحاولات.
 */
export async function getSurahTimings(
  surahId: number,
  recitationId: number = DEFAULT_RECITATION_ID,
): Promise<SurahTimings | null> {
  const key = cacheKey(recitationId, surahId);
  // 1) ذاكرة
  const hit = memCache.get(key);
  if (hit) return hit;

  // منع التحميل المكرّر إن كان الطلب جارياً
  const ip = inflight.get(key);
  if (ip) return ip;

  const promise = loadInternal(surahId, recitationId);
  inflight.set(key, promise);
  promise.finally(() => inflight.delete(key));
  return promise;
}

async function loadInternal(surahId: number, recitationId: number): Promise<SurahTimings | null> {
  const key = cacheKey(recitationId, surahId);
  // 2) AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(storageKey(recitationId, surahId));
    if (raw) {
      const stored = JSON.parse(raw) as SurahTimings;
      if (stored && Array.isArray(stored.verses) && stored.verses.length > 0) {
        memCache.set(key, stored);
        return stored;
      }
    }
  } catch {}

  // 3) API
  try {
    const url = `${API_BASE}/audio/reciters/${recitationId}/audio_files?chapter=${surahId}&segments=true`;
    const res = await fetch(url);
    if (!res.ok) {
      // 🛟 fallback: لو القارئ مش موجود في Quran.com، جرّب توقيتات العفاسي
      //    أحسن من char-count على الأقل (مع scaling خطّي).
      if (recitationId !== DEFAULT_RECITATION_ID) {
        return getSurahTimings(surahId, DEFAULT_RECITATION_ID);
      }
      return null;
    }
    const json = await res.json();
    const file = json?.audio_files?.[0];
    if (!file) {
      if (recitationId !== DEFAULT_RECITATION_ID) {
        return getSurahTimings(surahId, DEFAULT_RECITATION_ID);
      }
      return null;
    }

    const verses: VerseTiming[] = (file.verse_timings ?? []).map((v: any) => ({
      verseKey: String(v.verse_key),
      verseNumber: Number(v.verse_key?.split(':')[1] ?? 0),
      fromMs: Number(v.timestamp_from ?? 0),
      toMs:   Number(v.timestamp_to ?? 0),
      durationMs: Number(v.duration ?? 0),
      words: Array.isArray(v.segments)
        ? v.segments.map((seg: number[]) => ({
            position: seg[0] ?? 0,
            fromMs:   seg[1] ?? 0,
            toMs:     seg[2] ?? 0,
          }))
        : [],
    }));

    if (verses.length === 0) {
      if (recitationId !== DEFAULT_RECITATION_ID) {
        return getSurahTimings(surahId, DEFAULT_RECITATION_ID);
      }
      return null;
    }

    const result: SurahTimings = {
      surahId,
      totalDurationMs: Number(file.duration ?? 0),
      verses,
      audioUrl: typeof file.audio_url === 'string' ? file.audio_url : undefined,
    };

    memCache.set(key, result);
    AsyncStorage.setItem(storageKey(recitationId, surahId), JSON.stringify(result)).catch(() => {});
    return result;
  } catch {
    if (recitationId !== DEFAULT_RECITATION_ID) {
      return getSurahTimings(surahId, DEFAULT_RECITATION_ID);
    }
    return null;
  }
}

// ─────────────────────────────────────────────
// 🔍 الاستخدام
// ─────────────────────────────────────────────

/**
 * يجد الآية الجارية الآن باستخدام التوقيتات الدقيقة.
 *
 * @param positionMs الموضع الحالي في الـ MP3 الجاري تشغيله
 * @param audioDurationMs المدة الكلية لذلك الـ MP3 (قد تختلف عن totalDurationMs المرجعي)
 * @param timings التوقيتات المرجعية للسورة
 */
export function findVerseAtTime(
  positionMs: number,
  audioDurationMs: number,
  timings: SurahTimings,
): number | null {
  if (!timings.verses.length || audioDurationMs <= 0 || positionMs < 0) return null;

  // 📐 scaling: نحوّل موضع المستخدم إلى موضع مرجعي (Alafasy duration)
  // ثم نبحث عن الآية التي تحتوي هذا الموضع.
  const scale = timings.totalDurationMs / audioDurationMs;
  const scaledMs = positionMs * scale;

  for (const v of timings.verses) {
    if (scaledMs >= v.fromMs && scaledMs < v.toMs) return v.verseNumber;
  }
  // لو تخطّى الآخر، ارجع آخر آية
  const last = timings.verses[timings.verses.length - 1];
  if (scaledMs >= last.fromMs) return last.verseNumber;
  return timings.verses[0]?.verseNumber ?? null;
}

/**
 * يحسب موضع بداية آية معيّنة في الـ MP3 الحالي.
 */
export function getVerseStartMs(
  verseNumber: number,
  audioDurationMs: number,
  timings: SurahTimings,
): number {
  if (!timings.verses.length || audioDurationMs <= 0) return 0;
  const verse = timings.verses.find((v) => v.verseNumber === verseNumber);
  if (!verse) return 0;
  // عكس الـ scaling: نحوّل موضع Alafasy → موضع المستخدم
  const inverseScale = audioDurationMs / timings.totalDurationMs;
  return Math.floor(verse.fromMs * inverseScale);
}

/**
 * يجد الكلمة الجارية بالظبط (لتظليل كلمة-بكلمة).
 */
export function findWordAtTime(
  positionMs: number,
  audioDurationMs: number,
  timings: SurahTimings,
): { verseNumber: number; wordPosition: number } | null {
  if (!timings.verses.length || audioDurationMs <= 0) return null;
  const scale = timings.totalDurationMs / audioDurationMs;
  const scaledMs = positionMs * scale;

  for (const v of timings.verses) {
    if (scaledMs >= v.fromMs && scaledMs < v.toMs) {
      // ابحث عن الكلمة داخل الآية
      for (const w of v.words) {
        if (scaledMs >= w.fromMs && scaledMs < w.toMs) {
          return { verseNumber: v.verseNumber, wordPosition: w.position };
        }
      }
      // لو ما لقاش كلمة محدّدة، ارجع الآية بدون رقم كلمة
      return { verseNumber: v.verseNumber, wordPosition: 0 };
    }
  }
  return null;
}

/**
 * يحذف توقيتات سورة من الكاش (يستخدم في إعدادات التحميلات).
 */
export async function clearTimingsCache(): Promise<void> {
  try {
    memCache.clear();
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {}
}
