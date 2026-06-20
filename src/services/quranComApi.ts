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

// 🔤 خط مصحف المدينة v1 (الكلاسيكي) — TTF لكل صفحة.
const V1_TTF_BASE = 'https://cdn.jsdelivr.net/gh/quran/quran.com-images/res/fonts';
const isV1Font = (name: string): boolean => name.startsWith('QCF_P');
export const v1FontForPage = (page: number): string => `QCF_P${String(page).padStart(3, '0')}`;

// 🔤 خط مصحف المدينة v2 (الأشهر — نقطه أوضح من v4). TTF لكل صفحة.
const V2_TTF_BASE = 'https://cdn.jsdelivr.net/gh/mustafa0x/qpc-fonts/mushaf-v2';
const isV2Font = (name: string): boolean => name.startsWith('QCF2_');
export const v2FontForPage = (page: number): string => `QCF2_${String(page).padStart(3, '0')}`;

// 🔤 خط KFGQPC Uthmanic Hafs — خط نصّي حقيقي (يرسم النص العثماني مباشرة، خط واحد لكل المصحف).
const HAFS_FONT = 'KFGQPCHafs';
const HAFS_TTF_URL = 'https://cdn.jsdelivr.net/gh/quran/quran.com-frontend-next/public/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.ttf';

function getQpcTtfUrl(fontName: string): string {
  if (fontName === HAFS_FONT) return HAFS_TTF_URL;
  if (isV2Font(fontName)) return `${V2_TTF_BASE}/QCF2${fontName.slice(5)}.ttf`;
  if (isV1Font(fontName)) return `${V1_TTF_BASE}/${fontName}.TTF`;
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
/** كاش متزامن للصفحات المحمّلة بالفعل — يتيح عرضها فوراً وقت الـ render بدون تفريغ/وميض أسود. */
const resolvedPages = new Map<number, QpcPageData>();

/** يرجّع بيانات الصفحة فوراً لو محمّلة بالفعل (متزامن)، وإلا null. */
export function getQpcPageSync(page: number): QpcPageData | null {
  return resolvedPages.get(page) ?? null;
}

export function fetchQpcPage(page: number): Promise<QpcPageData> {
  if (pageCache.has(page)) return pageCache.get(page)!;
  const p = fetchQpcPageInternal(page);
  pageCache.set(page, p);
  p.then((data) => { resolvedPages.set(page, data); }).catch(() => pageCache.delete(page));
  return p;
}

async function fetchQpcPageInternal(page: number): Promise<QpcPageData> {
  let data: QpcPageData | null = null;
  try {
    const raw = await AsyncStorage.getItem(pageCacheKey(page));
    if (raw) {
      const stored = JSON.parse(raw) as QpcPageData;
      if (stored && Array.isArray(stored.lines) && stored.lines.length > 0) data = stored;
    }
  } catch {}

  if (!data) {
    const padded = String(page).padStart(3, '0');
    const res = await fetch(`${CDN_BASE}/pages/${padded}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = (await res.json()) as QpcPageData;
    AsyncStorage.setItem(pageCacheKey(page), JSON.stringify(data)).catch(() => {});
  }

  // ✅ خط QCF v2 لكل المصحف — كل الحروف والتشكيل والنقط واضحة، متجانس، ومطابق للرسمي.
  await applyV2Layer(data, page).catch(() => {});

  return data;
}

// ─────── طبقة خط QCF v1 (الكلاسيكي) — للمقارنة على صفحتي 440/441 ───────
const V1_MAP_PREFIX = '@nafahat/qpcV1map/';
async function fetchV1CodeMap(page: number): Promise<Record<string, string>> {
  const key = `${V1_MAP_PREFIX}${page}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) { const m = JSON.parse(raw); if (m && Object.keys(m).length) return m; }
  } catch {}
  const url = `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=code_v1&per_page=300`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`v1 HTTP ${res.status}`);
  const json: any = await res.json();
  const map: Record<string, string> = {};
  for (const v of json.verses ?? []) {
    for (const w of v.words ?? []) {
      if (w.code_v1 && w.position != null) map[`${v.verse_key}:${w.position}`] = w.code_v1;
    }
  }
  if (Object.keys(map).length) AsyncStorage.setItem(key, JSON.stringify(map)).catch(() => {});
  return map;
}
/** يستبدل أكواد الكلمات بأكواد v1 + خط v1 (الكلاسيكي). */
async function applyV1Layer(data: QpcPageData, page: number): Promise<void> {
  const map = await fetchV1CodeMap(page);
  if (!map || !Object.keys(map).length) return;
  const v1font = v1FontForPage(page);
  const quarterKeys = new Set<string>();
  for (const line of data.lines) {
    for (const w of line.words) {
      if ((w.type as string) === 'quarter' && w.verse_key) quarterKeys.add(w.verse_key);
    }
  }
  for (const line of data.lines) {
    for (const w of line.words) {
      if ((w.type === 'word' || w.type === 'end') && w.verse_key && (w as any).position != null) {
        let code = map[`${w.verse_key}:${(w as any).position}`];
        if (code) {
          if (code.includes(' ') && quarterKeys.has(w.verse_key)) {
            const parts = code.split(' ');
            code = parts[parts.length - 1];
          }
          w.char = code; (w as any).code = code.codePointAt(0) ?? (w as any).code; w.font = v1font;
        }
      }
    }
  }
}

// ─────── طبقة خط KFGQPC Uthmanic Hafs (نصّي عثماني) — تجربة على 440/441 ───────
const HAFS_MAP_PREFIX = '@nafahat/qpcHafsmap/';
async function fetchHafsTextMap(page: number): Promise<Record<string, string>> {
  const key = `${HAFS_MAP_PREFIX}${page}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) { const m = JSON.parse(raw); if (m && Object.keys(m).length) return m; }
  } catch {}
  const url = `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=text_uthmani,char_type_name&per_page=300`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`hafs HTTP ${res.status}`);
  const json: any = await res.json();
  const map: Record<string, string> = {};
  for (const v of json.verses ?? []) {
    for (const w of v.words ?? []) {
      if (w.position == null) continue;
      // علامة آخر الآية: U+06DD + رقم الآية بالعربي ليرسمها الخط داخل دائرة مزخرفة.
      const txt = w.char_type_name === 'end'
        ? `۝${w.text_uthmani ?? ''}`
        : w.text_uthmani;
      if (txt) map[`${v.verse_key}:${w.position}`] = txt;
    }
  }
  if (Object.keys(map).length) AsyncStorage.setItem(key, JSON.stringify(map)).catch(() => {});
  return map;
}
/** يستبدل أكواد الكلمات بالنص العثماني الحقيقي + خط KFGQPC Hafs (خط نصّي واضح). */
async function applyHafsLayer(data: QpcPageData, page: number): Promise<void> {
  const map = await fetchHafsTextMap(page);
  if (!map || !Object.keys(map).length) return;
  for (const line of data.lines) {
    for (const w of line.words) {
      if ((w.type === 'word' || w.type === 'end') && w.verse_key && (w as any).position != null) {
        const txt = map[`${w.verse_key}:${(w as any).position}`];
        if (txt) {
          // مسافة بعد كل كلمة (الخط النصّي مفهوش مسافات مدمجة زي جليفات QCF).
          const spaced = txt + ' ';
          w.char = spaced; (w as any).code = txt.codePointAt(0) ?? (w as any).code; w.font = HAFS_FONT;
        }
      }
    }
  }
}

// ─────── طبقة خط QCF v2 (تجربة وضوح النقط مع الحفاظ على شكل الصفحة) ───────
const V2_MAP_PREFIX = '@nafahat/qpcV2map/';
async function fetchV2CodeMap(page: number): Promise<Record<string, string>> {
  const key = `${V2_MAP_PREFIX}${page}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) { const m = JSON.parse(raw); if (m && Object.keys(m).length) return m; }
  } catch {}
  const url = `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&word_fields=code_v2&per_page=300`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`v2 HTTP ${res.status}`);
  const json: any = await res.json();
  const map: Record<string, string> = {};
  for (const v of json.verses ?? []) {
    for (const w of v.words ?? []) {
      if (w.code_v2 && w.position != null) map[`${v.verse_key}:${w.position}`] = w.code_v2;
    }
  }
  if (Object.keys(map).length) AsyncStorage.setItem(key, JSON.stringify(map)).catch(() => {});
  return map;
}
/** يستبدل أكواد الكلمات بأكواد v2 + خط v2 (نقطه أوضح). */
async function applyV2Layer(data: QpcPageData, page: number): Promise<void> {
  const map = await fetchV2CodeMap(page);
  if (!map || !Object.keys(map).length) return;
  const v2font = v2FontForPage(page);
  // 🔑 آيات فيها علامة ربع الحزب (۞) كـ كلمة v4 منفصلة. نحتفظ بعلامة v4 الأنيقة،
  //    ونشيل علامة الربع المدمجة في كود v2 (التي تظهر كنجمة صغيرة "٭") حتى لا تتكرر.
  const quarterKeys = new Set<string>();
  for (const line of data.lines) {
    for (const w of line.words) {
      if ((w.type as string) === 'quarter' && w.verse_key) quarterKeys.add(w.verse_key);
    }
  }
  for (const line of data.lines) {
    for (const w of line.words) {
      // 🕌 كلمات الرموز المنفصلة في v4 (مثل علامة السجدة ۩) نصّها يبدأ بـ '#'.
      //    خط v2 يدمج هذه العلامة داخل الكلمة المجاورة ("وَأَنَابَ ۩")، فالنسخة
      //    المنفصلة تتطابق غلط مع رقم الآية وتظهر كميدالية مكرّرة → نتخطّاها ونشيلها.
      if (typeof (w as any).text === 'string' && (w as any).text.startsWith('#')) continue;
      if ((w.type === 'word' || w.type === 'end') && w.verse_key && (w as any).position != null) {
        let code = map[`${w.verse_key}:${(w as any).position}`];
        if (code) {
          // v2 يدمج علامة الربع قبل أول كلمة (code_v2 = "ﳄ ﳅ"). نأخذ الكلمة فقط
          //    (آخر مقطع) ونترك علامة v4 المنفصلة تظهر بشكلها الأنيق ۞.
          if (code.includes(' ') && quarterKeys.has(w.verse_key)) {
            const parts = code.split(' ');
            code = parts[parts.length - 1];
          }
          w.char = code; (w as any).code = code.codePointAt(0) ?? (w as any).code; w.font = v2font;
        }
      }
    }
    // نشيل كلمات الرموز المنفصلة (السجدة..) — v2 ضمّنها بالفعل في الكلمة المجاورة.
    line.words = line.words.filter((w) => !(typeof (w as any).text === 'string' && (w as any).text.startsWith('#')));
  }
}

/**
 * 🔀 هجين انتقائي: المصحف كله v4، ويبدّل فقط الكلمات المُدرَجة في WORDS_TO_V2
 *    (اللي المستخدم يحدّدها كغير واضحة) إلى خط v2. القائمة الفاضية = كل المصحف v4.
 */
// قائمة الكلمات (بدون تشكيل) اللي نحوّلها v2 بناءً على طلب المستخدم. تُطابَق في كل المصحف.
const WORDS_TO_V2: string[] = [];
// إزالة التشكيل والتطويل للمقارنة (نطابق الحروف الأساسية فقط).
const stripTashkeel = (s: string): string =>
  s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '');
const WORDS_TO_V2_NORM = new Set(WORDS_TO_V2.map(stripTashkeel));

async function applyV2ToYaaWords(data: QpcPageData, page: number): Promise<void> {
  if (WORDS_TO_V2_NORM.size === 0) return; // القائمة فاضية → كل المصحف v4
  const map = await fetchV2CodeMap(page);
  if (!map || !Object.keys(map).length) return;
  const v2font = v2FontForPage(page);
  for (const line of data.lines) {
    for (const w of line.words) {
      if ((w.type === 'word' || w.type === 'end') && w.verse_key && (w as any).position != null) {
        const txt = stripTashkeel(w.text ?? '');
        if (!WORDS_TO_V2_NORM.has(txt)) continue; // مش في قائمة المستخدم → يفضل v4
        let code = map[`${w.verse_key}:${(w as any).position}`];
        if (code) {
          if (code.includes(' ')) code = code.split(' ').pop() as string;
          w.char = code; (w as any).code = code.codePointAt(0) ?? (w as any).code; w.font = v2font;
        }
      }
    }
  }
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

/** هل كل خطوط الصفحة محمّلة بالفعل؟ (متزامن) — عشان نعرف نعرضها فوراً بدون وميض. */
export function arePageFontsLoaded(pageData: QpcPageData): boolean {
  if (pageData.font && !loadedFonts.has(pageData.font)) return false;
  for (const line of pageData.lines) {
    for (const word of line.words) {
      if (word.font && !loadedFonts.has(word.font)) return false;
    }
  }
  return true;
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
