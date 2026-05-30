/**
 * 🕌 QPC v4 - نظام عرض مصحف المدينة الكامل.
 *
 * المصدر: npm package "quran-qcf4" عبر jsDelivr CDN.
 *  - 47 خط لكل ~13 صفحة + خط QCF4_QBSML لرؤوس السور والبسملات.
 *  - JSON لكل صفحة بترتيب 15 سطر مع كلمات تحوي char (PUA) + verse_key + font + type.
 *
 * 🎯 النتيجة: مطابق لمصحف المدينة 100%، مع كل كلمة قابلة للضغط.
 *
 * https://www.npmjs.com/package/quran-qcf4
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import * as LegacyFS from 'expo-file-system/legacy';

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/quran-qcf4@1.0.3';

/**
 * 🔤 مصدر خطوط TTF للموبايل (React Native لا يدعم woff2).
 * الخطوط محوَّلة من woff2 → ttf ومرفوعة على فرع `fonts` في مستودع المشروع،
 * و jsDelivr يخدمها كـ CDN. تُحمَّل حسب الصفحة وتُخزَّن محلياً للقراءة أوفلاين.
 */
const TTF_CDN_BASE = 'https://cdn.jsdelivr.net/gh/meee2022/Nafahat@fonts';

function getQpcTtfUrl(fontName: string): string {
  const suffix = fontName === 'QCF4_QBSML' ? '' : '_W';
  return `${TTF_CDN_BASE}/${fontName}${suffix}.ttf`;
}

/** Prefix لـ AsyncStorage keys - مفيد للحذف الجماعي عند مسح الكاش. */
const PAGE_CACHE_PREFIX = '@nafahat/qpcPage/';

/** نسخة كاش الصفحات - زدّها لو تغيّر الـ schema. */
const PAGE_CACHE_VERSION = 1;

function pageCacheKey(page: number): string {
  return `${PAGE_CACHE_PREFIX}v${PAGE_CACHE_VERSION}/${page}`;
}

/**
 * صوت كلمات Tarteel (احتياطي - لو احتجنا صوت كلمة).
 */
const AUDIO_CDN_BASE = 'https://audio.qurancdn.com';

// ─────────────────────────────────────────────
// 🔤 الأنواع
// ─────────────────────────────────────────────

export type QpcWordType = 'word' | 'end' | 'bismillah' | 'surah_header' | 'pause';

export interface QpcWord {
  /** PUA codepoint رقمي. */
  code: number;
  /** PUA character - يُرسم باستخدام الخط المخصّص. */
  char: string;
  /** اسم الخط المطلوب لهذه الكلمة. */
  font: string;
  /** النص بالرسم العثماني للقراءة الصوتية والبحث. */
  text: string;
  /** نوع الكلمة. */
  type: QpcWordType;
  /** "2:255" - متاح في كلمات الآيات. */
  verse_key?: string;
  /** موضع الكلمة في الآية. */
  position?: number;
  /** رقم السورة (للـ surah_header/bismillah). */
  sura?: number;
}

export interface QpcLine {
  line: number;
  words: QpcWord[];
}

export interface QpcSurahOnPage {
  id: number;
  name: string;
  name_arabic: string;
  verse_start: number;
  verse_end: number;
}

export interface QpcPageData {
  page: number;
  /** الخط الأساسي للصفحة (مفيد للتحميل المسبق). */
  font: string;
  surahs: QpcSurahOnPage[];
  lines: QpcLine[];
}

// ─────────────────────────────────────────────
// 🔤 الخطوط
// ─────────────────────────────────────────────

/** كل اسم خط في نظام QCF4. */
export function getQpcFontUrl(fontName: string): string {
  // الخطوط الأساسية (Hafs_01..47) عندها suffix "_W"
  // الخط الخاص QCF4_QBSML بدون suffix
  const suffix = fontName === 'QCF4_QBSML' ? '' : '_W';
  return `${CDN_BASE}/fonts-woff2/${fontName}${suffix}.woff2`;
}

export function getQpcFontFamily(fontName: string): string {
  return fontName; // نستخدم نفس الاسم كـ CSS font-family
}

// ─────────────────────────────────────────────
// 📥 جلب الصفحات
// ─────────────────────────────────────────────

const pageCache = new Map<number, Promise<QpcPageData>>();

export function fetchQpcPage(page: number): Promise<QpcPageData> {
  if (pageCache.has(page)) return pageCache.get(page)!;
  const p = fetchQpcPageInternal(page);
  pageCache.set(page, p);
  p.catch(() => pageCache.delete(page));
  return p;
}

async function fetchQpcPageInternal(page: number): Promise<QpcPageData> {
  // 📦 جرّب AsyncStorage أولاً - يعمل أوفلاين ويحفظ bandwidth
  try {
    const raw = await AsyncStorage.getItem(pageCacheKey(page));
    if (raw) {
      const stored = JSON.parse(raw) as QpcPageData;
      if (stored && Array.isArray(stored.lines) && stored.lines.length > 0) {
        return stored;
      }
    }
  } catch {}

  // 🌐 جلب من CDN
  const padded = String(page).padStart(3, '0');
  const url = `${CDN_BASE}/pages/${padded}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: QpcPageData = await res.json();

  // 💾 احفظ في AsyncStorage للقراءة الأوفلاين المستقبلية (غير محظور)
  AsyncStorage.setItem(pageCacheKey(page), JSON.stringify(data)).catch(() => {});

  return data;
}

/**
 * يمسح كل صفحات QPC المحفوظة (للاستخدام في إعدادات التحميلات).
 */
export async function clearQpcPagesCache(): Promise<void> {
  try {
    pageCache.clear();
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(PAGE_CACHE_PREFIX));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {}
}

// ─────────────────────────────────────────────
// 🌐 تحميل الخطوط (Web فقط)
// ─────────────────────────────────────────────

const loadedFonts = new Set<string>();
const loadingFonts = new Map<string, Promise<void>>();

/**
 * يحمّل خطاً واحداً:
 *  - Web: عبر @font-face في الـ DOM (woff2).
 *  - Native: يحمّل نسخة TTF من jsDelivr، يخزّنها في الكاش، ثم يسجّلها عبر expo-font.
 */
export function loadQpcFont(fontName: string): Promise<void> {
  if (loadedFonts.has(fontName)) return Promise.resolve();
  if (loadingFonts.has(fontName)) return loadingFonts.get(fontName)!;

  const promise = (Platform.OS === 'web' ? loadQpcFontWeb(fontName) : loadQpcFontNative(fontName))
    .then(() => { loadedFonts.add(fontName); });

  loadingFonts.set(fontName, promise);
  promise.catch(() => {}).finally(() => loadingFonts.delete(fontName));
  return promise;
}

/** Web: حقن @font-face في الـ DOM. */
async function loadQpcFontWeb(fontName: string): Promise<void> {
  if (typeof document === 'undefined') return;
  const family = getQpcFontFamily(fontName);
  const url    = getQpcFontUrl(fontName);

  const css = `
    @font-face {
      font-family: '${family}';
      src: url('${url}') format('woff2');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
  `;
  const style = document.createElement('style');
  style.dataset.qpcFont = family;
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  if (typeof (document as any).fonts?.load === 'function') {
    try { await (document as any).fonts.load(`16px '${family}'`); } catch {}
  } else {
    await new Promise((r) => setTimeout(r, 400));
  }
}

/** Native: حمّل TTF من jsDelivr (مع كاش محلي) ثم سجّله عبر expo-font. */
async function loadQpcFontNative(fontName: string): Promise<void> {
  const family = getQpcFontFamily(fontName);
  const url    = getQpcTtfUrl(fontName);
  const dir     = (LegacyFS.cacheDirectory ?? '') + 'qpc-fonts/';
  const localUri = dir + fontName + '.ttf';

  try {
    const info = await LegacyFS.getInfoAsync(localUri);
    if (!info.exists || ((info as any).size ?? 0) < 10_000) {
      try { await LegacyFS.makeDirectoryAsync(dir, { intermediates: true }); } catch {}
      await LegacyFS.downloadAsync(url, localUri);
    }
    await Font.loadAsync({ [family]: localUri });
  } catch {
    try { await Font.loadAsync({ [family]: url }); } catch {}
  }
}

/**
 * يحمّل كل الخطوط الفريدة الموجودة في صفحة معيّنة.
 */
export async function loadFontsForPage(pageData: QpcPageData): Promise<void> {
  const uniqueFonts = new Set<string>();
  uniqueFonts.add(pageData.font);
  for (const line of pageData.lines) {
    for (const word of line.words) {
      if (word.font) uniqueFonts.add(word.font);
    }
  }
  await Promise.all([...uniqueFonts].map((f) => loadQpcFont(f).catch(() => {})));
}

/**
 * pre-fetch الصفحات التالية للأداء.
 */
export function preloadQpcPages(pages: number[]): void {
  for (const p of pages) {
    if (p >= 1 && p <= 604) {
      fetchQpcPage(p)
        .then((data) => loadFontsForPage(data))
        .catch(() => {});
    }
  }
}

// تظل دالة قديمة باسمها لتجنّب كسر الواجهات
export function preloadQpcFonts(pages: number[]): void {
  preloadQpcPages(pages);
}

// ─────────────────────────────────────────────
// 🔊 روابط الصوت (احتياطية)
// ─────────────────────────────────────────────

export function getWordAudioUrl(location: string): string {
  const parts = location.split(':').map((n) => n.padStart(3, '0'));
  if (parts.length !== 3) return '';
  return `${AUDIO_CDN_BASE}/wbw/${parts.join('_')}.mp3`;
}

export function getAyahAudioUrl(verseKey: string, reciter: string = 'Alafasy'): string {
  const [sura, aya] = verseKey.split(':');
  if (!sura || !aya) return '';
  const s = sura.padStart(3, '0');
  const a = aya.padStart(3, '0');
  return `${AUDIO_CDN_BASE}/${reciter}/${s}${a}.mp3`;
}

// ─────────────────────────────────────────────
// 🔁 توافق خلفي (legacy aliases)
// ─────────────────────────────────────────────

/** للتوافق مع كود قديم - يرجّع الكلمات كمصفوفة مسطّحة مع line numbers. */
export interface QpcVerse {
  id: number;
  verse_key: string;
  verse_number: number;
  page_number: number;
  words: QpcWord[];
}
