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
import { QCF_LOCAL_FONTS } from './qcfLocalFonts';
import { getBundledQpcPage } from './qcfLocalPages';

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/quran-qcf4@1.0.3';
const FALLBACK_CDN_BASE = 'https://unpkg.com/quran-qcf4@1.0.3';
const PAGE_REQUEST_TIMEOUT_MS = 10_000;

/**
 * 🔤 مصدر خطوط TTF للموبايل (React Native لا يدعم woff2).
 * الخطوط محوَّلة من woff2 → ttf ومرفوعة على فرع `fonts` في مستودع المشروع،
 * و jsDelivr يخدمها كـ CDN. تُحمَّل حسب الصفحة وتُخزَّن محلياً للقراءة أوفلاين.
 */
// Immutable commit: Quran fonts must never change underneath an installed app.
const TTF_CDN_BASE = 'https://cdn.jsdelivr.net/gh/meee2022/Nafahat@a9ed0acca193d99ca0a2fcb3563c00ce9bfb4e4f';
const TTF_FALLBACK_BASE = 'https://raw.githubusercontent.com/meee2022/Nafahat/a9ed0acca193d99ca0a2fcb3563c00ce9bfb4e4f';

function getQpcTtfUrl(fontName: string): string {
  const suffix = fontName === 'QCF4_QBSML' ? '' : '_W';
  return `${TTF_CDN_BASE}/${fontName}${suffix}.ttf`;
}

function getQpcTtfFallbackUrl(fontName: string): string {
  const suffix = fontName === 'QCF4_QBSML' ? '' : '_W';
  return `${TTF_FALLBACK_BASE}/${fontName}${suffix}.ttf`;
}

/** Prefix لـ AsyncStorage keys - مفيد للحذف الجماعي عند مسح الكاش. */
const PAGE_CACHE_PREFIX = '@nafahat/qpcPage/';

/** نسخة كاش الصفحات - زدّها لو تغيّر الـ schema. */
const PAGE_CACHE_VERSION = 2;

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

export type QpcWordType = 'word' | 'end' | 'bismillah' | 'surah_header' | 'quarter' | 'pause';

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

export function validateQpcPage(data: unknown, expectedPage?: number): data is QpcPageData {
  if (!data || typeof data !== 'object') return false;
  const page = data as QpcPageData;
  if (!Number.isInteger(page.page) || page.page < 1 || page.page > 604) return false;
  if (expectedPage != null && page.page !== expectedPage) return false;
  if (typeof page.font !== 'string' || !/^QCF4_(Hafs_\d{2}|QBSML)$/.test(page.font)) return false;
  const expectedLineCount = page.page <= 2 ? 8 : 15;
  if (!Array.isArray(page.lines) || page.lines.length !== expectedLineCount) return false;
  return page.lines.every((line, index) =>
    line?.line === index + 1 &&
    Array.isArray(line.words) &&
    line.words.every((word) =>
      Number.isInteger(word?.code) &&
      typeof word?.char === 'string' && word.char.length > 0 &&
      typeof word?.font === 'string' && /^QCF4_(Hafs_\d{2}|QBSML)$/.test(word.font) &&
      ['word', 'end', 'bismillah', 'surah_header', 'quarter', 'pause'].includes(word.type),
    ),
  );
}

export function fetchQpcPage(page: number): Promise<QpcPageData> {
  if (pageCache.has(page)) return pageCache.get(page)!;
  const p = fetchQpcPageInternal(page);
  pageCache.set(page, p);
  p.catch(() => pageCache.delete(page));
  return p;
}

/** Retry transient CDN/network failures without leaving a blank Mushaf page. */
export async function fetchQpcPageWithRetry(page: number, attempts = 3): Promise<QpcPageData> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchQpcPage(page);
    } catch (error) {
      lastError = error;
      pageCache.delete(page);
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function fetchQpcPageInternal(page: number): Promise<QpcPageData> {
  // Native builds ship all 604 verified pages, so reading never depends on
  // connectivity. Web returns null and continues to cache/CDN below.
  const bundled = getBundledQpcPage(page);
  if (validateQpcPage(bundled, page)) return bundled;

  // 📦 جرّب AsyncStorage أولاً - يعمل أوفلاين ويحفظ bandwidth
  try {
    const raw = await AsyncStorage.getItem(pageCacheKey(page));
    if (raw) {
      const stored = JSON.parse(raw) as QpcPageData;
      if (validateQpcPage(stored, page)) {
        return stored;
      }
    }
  } catch {}

  // 🌐 جلب من CDN
  const padded = String(page).padStart(3, '0');
  const fetchSource = async (baseUrl: string): Promise<QpcPageData> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PAGE_REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${baseUrl}/pages/${padded}.json`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload: unknown = await res.json();
      if (!validateQpcPage(payload, page)) throw new Error(`Invalid QCF page payload: ${page}`);
      return payload;
    } finally {
      clearTimeout(timer);
    }
  };

  // Race two independent CDNs. Page JSON is tiny, and this prevents a stalled
  // provider from leaving the Mushaf spinner running forever on mobile.
  const data = await Promise.any([
    fetchSource(CDN_BASE),
    fetchSource(FALLBACK_CDN_BASE),
  ]);

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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

async function downloadFontFile(url: string, tempUri: string, localUri: string): Promise<void> {
  await LegacyFS.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
  await withTimeout(LegacyFS.downloadAsync(url, tempUri), 15_000, 'QCF font download');
  const info = await LegacyFS.getInfoAsync(tempUri);
  if (!info.exists || ((info as any).size ?? 0) < 100_000) {
    throw new Error('Incomplete QCF font download');
  }
  await LegacyFS.deleteAsync(localUri, { idempotent: true }).catch(() => {});
  await LegacyFS.moveAsync({ from: tempUri, to: localUri });
}

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
  const bundledFont = QCF_LOCAL_FONTS[fontName];
  if (bundledFont) {
    await withTimeout(
      Font.loadAsync({ [family]: bundledFont }),
      15_000,
      `Bundled QCF font ${fontName}`,
    );
    return;
  }
  const url    = getQpcTtfUrl(fontName);
  const fallbackUrl = getQpcTtfFallbackUrl(fontName);
  const dir     = (LegacyFS.cacheDirectory ?? '') + 'qpc-fonts/';
  const localUri = dir + fontName + '.ttf';
  const primaryTempUri = dir + fontName + '.primary.tmp.ttf';
  const fallbackTempUri = dir + fontName + '.fallback.tmp.ttf';

  try {
    const info = await LegacyFS.getInfoAsync(localUri);
    if (!info.exists || ((info as any).size ?? 0) < 10_000) {
      try { await LegacyFS.makeDirectoryAsync(dir, { intermediates: true }); } catch {}
      await downloadFontFile(url, primaryTempUri, localUri);
    }
    await withTimeout(Font.loadAsync({ [family]: localUri }), 10_000, 'QCF font registration');
  } catch (firstError) {
    // A cancelled download may leave a partial file behind. Remove it so the
    // next retry downloads a clean font instead of repeatedly loading it.
    await LegacyFS.deleteAsync(localUri, { idempotent: true }).catch(() => {});
    try {
      await LegacyFS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      await downloadFontFile(fallbackUrl, fallbackTempUri, localUri);
      await withTimeout(Font.loadAsync({ [family]: localUri }), 10_000, 'QCF fallback font registration');
    } catch {
      await LegacyFS.deleteAsync(localUri, { idempotent: true }).catch(() => {});
      try {
        await withTimeout(Font.loadAsync({ [family]: fallbackUrl }), 10_000, 'QCF remote font registration');
      } catch {
        throw firstError;
      }
    }
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
  await Promise.all([...uniqueFonts].map((f) => loadQpcFont(f)));
}

/**
 * pre-fetch الصفحات التالية للأداء.
 */
export function preloadQpcPages(pages: number[]): void {
  for (const p of pages) {
    if (p >= 1 && p <= 604) {
      fetchQpcPageWithRetry(p, 2)
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
