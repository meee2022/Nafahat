/**
 * شاشة قراءة السورة - تصميم المصحف الشريف الكلاسيكي:
 *  - إطار ذهبي مزخرف بنقش هندسي إسلامي على الحواف الأربع
 *  - ترويسة بأزرار بيج + اسم السورة + الجزء + زخرفات معيّن
 *  - نص قرآني متتابع بالرسم العثماني + رصائع آيات ذهبية
 *  - شريط سفلي برقم الصفحة وزر القراءة
 *  - بطاقة إجراءات تظهر عند تحديد آية (مرجعية، مفضّلة، نسخ، مشاركة، استمع)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Modal, FlatList, TextInput, Platform, I18nManager, useWindowDimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Play, Pause, AlertCircle, RotateCcw, X, CheckCircle2,
  Menu, ArrowLeft, Languages, X as XIcon, ChevronsLeft, ChevronsRight,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { getSurahById, arabicNumber, SURAHS, JUZ_LIST, JUZ_PAGE_STARTS } from '@data/surahs';
import { describeHizbProgress } from '@data/hizb';
import { getAyahs as getAyahsFallback } from '@data/ayahs';
import { getSurahAyahs, prefetchSurahs } from '@services/quranApi';
import { useReadingStore, useAudioStore, useSettingsStore, useStatsStore } from '@store/index';
import { RECITERS, getReciterById } from '@data/reciters';
import { Ayah } from '@/types/index';
import { useT } from '@store/languageStore';
import {
  MushafBorder,
  MushafHeader,
  MushafFooter,
  AyahDetailSheet,
  AyahListSheet,
  MushafQpcPage,
  landscapeFontSize,
} from '@components/mushaf';
import { getCurrentAyah, getAyahStartTimeMs } from '@services/verseSync';
import { getWordsByVerse, type QuranWord } from '@services/wordByWord';
import { getSurahTimings, type SurahTimings } from '@services/audioTimings';

// Removed DEFAULT_RECITER; now fetched dynamically.

/**
 * لوحة ألوان المصحف - مرتبطة بهوية التطبيق (parchment + gold + emerald).
 * تُحسَب ديناميكياً من theme.colors لتدعم light/dark mode.
 */
function buildMushafPalette(t: ReturnType<typeof useTheme>) {
  // detect dark theme: أي خلفية تبدأ بـ #0X-#1X (لون داكن)
  const bg = t.colors.background.toLowerCase();
  const isDark = bg === '#000000' || /^#(0[0-9a-f]|1[0-5])/i.test(bg);

  if (isDark) {
    // 🌙 الثيم الداكن — أنيق ومريح للعين (Charcoal Emerald)
    //    خليط بين الفحمي الدافئ والزمردي لتباين أنعم بدون تشبّع
    return {
      page:     '#0A1612',   // فحمي مع لمسة زمردية خفيفة جداً
      pageWarm: '#101F1A',   // أعمق قليلاً للـ chrome
      ink:      '#EAE0CC',   // عاجي دافئ للنص (يريح العين)
      inkSoft:  '#A89B7E',   // عاجي خافت
      gold:     '#C9A961',   // ذهبي معتدل
      goldDeep: '#A88641',
      buttonBg: '#15251F',   // خلفية الأزرار - فحمي زمردي خفيف
      selected: 'rgba(201, 169, 97, 0.25)',
      ruby:     '#D97560',
      // 🟢 خلفية المودالات
      modalBg:  '#0E2520',
      modalText:'#EAE0CC',
      // 🪙 لون نصوص الـ cartouches + رقم الصفحة في الـ dark mode
      //    ذهبي (مش زمردي) يطابق الهوية ويلمع جميلاً على الفحمي
      accentText: '#C9A961',
      emerald:  '#3F8F7A',
      // 🎯 زر CTA الأساسي (التشغيل): ذهبي ممتلئ + أيقونة داكنة في dark
      //    عشان الأخضر الفاتح كان مزعج على الفحمي - الذهبي يطابق الهوية ويبرز كـ CTA
      ctaBg:    '#C9A961',
      ctaFg:    '#0A1815',
      ctaShadow:'#000000',
    };
  }

  // الثيم الفاتح — لوحة ألوان عثمانية (Soft Ottoman / Tezhip)
  //   مع لمسة زمردية في الـ inkSoft + accents لربط هوية التطبيق
  return {
    page:     '#FBF8F2',                            // عاجي دافئ - خلفية الصفحة
    pageWarm: '#F7F1E6',                            // كريمي أعمق - الهيدر/الفوتر
    ink:      '#0A1815',                            // ✨ حبر بتدرّج زمردي خفيف بدل الأسود الميت
    inkSoft:  '#0A3D38',                            // ✨ زمردي للنصوص الثانوية - لمسة هوية واضحة
    gold:     '#BFA178',                            // ذهبي بيج - الإطار
    goldDeep: '#9E7D4F',                            // ذهبي عميق
    buttonBg: '#FBF8F2',                            // خلفية الأزرار
    selected: 'rgba(10, 61, 56, 0.12)',             // ✨ تظليل الآية المختارة بلمسة زمردية
    ruby:     '#B84A3E',
    modalBg:  '#0A3D38',                            // المودالات - زمردي عميق
    modalText:'#FDFBF7',
    // 🪙 لون نصوص الـ cartouches + رقم الصفحة في light mode = زمردي (يبرز على الكريمي)
    accentText: '#0A3D38',
    emerald:  '#0A3D38',                            // الزمردي الأساسي
    // 🎯 زر CTA الأساسي (التشغيل) في light: زمردي ممتلئ + أيقونة ذهبية
    ctaBg:    '#0A3D38',
    ctaFg:    '#BFA178',
    ctaShadow:'#0A3D38',
  };
}

export default function SurahDetail() {
  const t = useTheme();
  const MUSHAF = useMemo(() => buildMushafPalette(t), [t]);
  const tr = useT();
  const router = useRouter();
  const { id, ayah: ayahQuery, page: pageQuery } = useLocalSearchParams<{ id: string; ayah?: string; page?: string }>();
  const surah = useMemo(() => getSurahById(Number(id)), [id]);
  const targetAyahNum = ayahQuery ? Number(ayahQuery) : null;
  const targetPageNum = pageQuery ? Number(pageQuery) : null;

  const { toggleBookmark, toggleFavorite, bookmarks, favorites, setLastRead } = useReadingStore();
  // 🎯 اشتراك انتقائي: نقرأ كل حقل من الـ store بمفرده عشان positionMs ما يجبرش
  //   كل الشاشة تعمل re-render كل 100ms. الـ Zustand بيستخدم strict equality
  //   على كل selector، فالـ scalar fields ما بتسببش re-renders بدون داعي.
  const play       = useAudioStore((s) => s.play);
  const toggle     = useAudioStore((s) => s.toggle);
  const current    = useAudioStore((s) => s.current);
  const isPlaying  = useAudioStore((s) => s.isPlaying);
  const seek       = useAudioStore((s) => s.seek);
  // 🚫 لاحظ: لم نعد نشترك في positionMs/durationMs مباشرة لتجنّب re-render كل 100ms.
  //    بدلاً من ذلك، playingAyahNumber selector يعمل subscription نخصّصي.
  //    عند الحاجة لقيمة لحظية (مثل seek من زر) نستخدم useAudioStore.getState().
  const { preferredReciterId, setPreferredReciterId } = useSettingsStore();
  const incrementPages = useStatsStore((s) => s.incrementPages);
  const visitedPagesRef = React.useRef<Set<number>>(new Set());
  const activeReciter = useMemo(() => getReciterById(preferredReciterId) ?? RECITERS[0], [preferredReciterId]);

  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [fontSize] = useState(32); // 📖 حجم خط مصحف كبير للقراءة المريحة
  // ملحوظة: tajweedColored تم حذفه - الـ feature لم يكن مُطبَّقاً (انظر روادمب الإصلاحات).

  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  // 🎯 توقيتات دقيقة للآيات (من Quran Foundation API) - بديل الـ char-count heuristic
  const [timings, setTimings] = useState<SurahTimings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showRecitersModal, setShowRecitersModal] = useState(false);
  const [showAyahList, setShowAyahList] = useState(false);
  const [showPageJump, setShowPageJump] = useState(false);
  const [jumpPageNum, setJumpPageNum] = useState('');
  const [showSurahJump, setShowSurahJump] = useState(false);
  const [showJuzJump, setShowJuzJump] = useState(false);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  // 🌐 Word-by-word translation mode — tap word shows translation banner instead of opening AyahSheet
  const [wbwMode, setWbwMode] = useState(false);
  const [wbwInfo, setWbwInfo] = useState<{ arabic: string; english: string; translit: string } | null>(null);
  const [wbwLoading, setWbwLoading] = useState(false);

  // 💡 تلميح تقليب الصفحات — يظهر أول مرّة فقط ثم يُحفَظ أنه شوهد
  const [showPageHint, setShowPageHint] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // v3: تغيّر التنقل من لمس → سحب، فنعيد إظهار التلميح المحدَّث للجميع مرة.
        const seen = await AsyncStorage.getItem('@nafahat/mushaf/pageHintSeen_v3');
        if (alive && !seen) {
          setShowPageHint(true);
          AsyncStorage.setItem('@nafahat/mushaf/pageHintSeen_v3', '1').catch(() => {});
          setTimeout(() => { if (alive) setShowPageHint(false); }, 4500);
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  // 📄 تجميع الآيات حسب رقم الصفحة (المصحف الحقيقي)
  const pages = useMemo(() => {
    if (!ayahs || ayahs.length === 0) return null;
    const map = new Map<number, Ayah[]>();
    for (const ayah of ayahs) {
      const pageNum = ayah.page ?? surah?.pageStart ?? 1;
      const arr = map.get(pageNum) ?? [];
      arr.push(ayah);
      map.set(pageNum, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([page, ayahsList]) => ({ page, ayahs: ayahsList }));
  }, [ayahs, surah?.pageStart]);

  const totalPages = pages?.length ?? 0;
  const currentPage = pages?.[currentPageIdx] ?? null;

  // 🏗️ Layout architecture: SafeArea > [Header] > [PageArea] > [Footer]
  //   الهيدر والفوتر عناصر flex عادية (مش absolute). الإطار يعيش داخل PageArea فقط
  //   فلا يحدث overlap أبداً. الصفحة دايماً مرتّبة - بدون immersive mode.
  const insets = useSafeAreaInsets();

  // عند تحميل سورة جديدة - ابدأ من الصفحة المطلوبة (أو الأولى)
  useEffect(() => {
    if (!pages || pages.length === 0) return;

    // أولوية 1: لو فيه page query
    if (targetPageNum) {
      const idx = pages.findIndex((p) => p.page === targetPageNum);
      if (idx >= 0) { setCurrentPageIdx(idx); return; }
    }
    // أولوية 2: لو فيه ayah query - دور على الصفحة اللي فيها الآية
    if (targetAyahNum) {
      const idx = pages.findIndex((p) => p.ayahs.some((a) => a.number === targetAyahNum));
      if (idx >= 0) {
        setCurrentPageIdx(idx);
        setSelectedAyah(targetAyahNum);
        return;
      }
    }
    // الافتراضي: أول صفحة من السورة
    setCurrentPageIdx(0);
    setSelectedAyah(null);
  }, [surah?.id, pages, targetAyahNum, targetPageNum]);

  // عند تغيير الصفحة - حدّث آخر موضع قراءة + احسبها كصفحة مقروءة
  useEffect(() => {
    if (!currentPage || !surah) return;
    const firstAyah = currentPage.ayahs[0];
    setLastRead({
      surahId: surah.id,
      surahName: surah.nameAr,
      ayahNumber: firstAyah.number,
      page: currentPage.page,
      updatedAt: Date.now(),
    });

    // احسب الصفحة مرة واحدة فقط في الجلسة (لمنع تضخّم الإحصائيات)
    if (!visitedPagesRef.current.has(currentPage.page)) {
      visitedPagesRef.current.add(currentPage.page);
      incrementPages(1);
    }
  }, [currentPage?.page, surah?.id]);

  const goToNextPage = () => {
    if (pages && currentPageIdx < pages.length - 1) {
      setCurrentPageIdx((i) => i + 1);
      setSelectedAyah(null);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (currentPage && currentPage.page < 604) {
      // 📖 آخر صفحة في السورة → كمّل للسورة التالية تلقائياً (تصفّح متواصل للمصحف)
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      executePageJump(currentPage.page + 1);
    }
  };
  const goToPrevPage = () => {
    if (currentPageIdx > 0) {
      setCurrentPageIdx((i) => i - 1);
      setSelectedAyah(null);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (currentPage && currentPage.page > 1) {
      // 📖 أول صفحة في السورة → ارجع للسورة السابقة تلقائياً
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      executePageJump(currentPage.page - 1);
    }
  };

  const executePageJump = (targetPage: number) => {
    const targetSurah = [...SURAHS].reverse().find(s => s.pageStart <= targetPage);
    if (targetSurah) {
      if (targetSurah.id === surah?.id && pages) {
        const newIdx = pages.findIndex(p => p.page === targetPage);
        if (newIdx >= 0) {
          setCurrentPageIdx(newIdx);
          setSelectedAyah(null);
          return;
        }
      }
      router.replace(`/surah/${targetSurah.id}?page=${targetPage}`);
    }
  };

  const handlePageJump = () => {
    const targetPage = Number(jumpPageNum);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= 604) {
      setShowPageJump(false);
      setJumpPageNum('');
      executePageJump(targetPage);
    }
  };

  // JUZ_PAGE_STARTS الآن مستورد من @data/surahs (مرجع موحّد - منع التكرار)

  useEffect(() => {
    if (!surah) return;
    let mounted = true;
    setAyahs(null);
    setLoadError(null);
    setTimings(null);

    getSurahAyahs(surah.id)
      .then((data) => {
        if (!mounted) return;
        setAyahs(data);
        prefetchSurahs([surah.id - 1, surah.id + 1].filter((n) => n >= 1 && n <= 114));
      })
      .catch(() => {
        if (!mounted) return;
        setAyahs(getAyahsFallback(surah.id, surah.versesCount));
        setLoadError(tr('mushaf.loadError'));
      });

    // 🎯 حمّل توقيتات الآيات بالتوازي لقارئ المستخدم الحالي - لا يحجب الرسم لو فشل
    //    لو القارئ ليس له qcfRecitationId، الـ service بيـ fallback للعفاسي.
    getSurahTimings(surah.id, activeReciter.qcfRecitationId)
      .then((t) => { if (mounted && t) setTimings(t); })
      .catch(() => {});

    return () => { mounted = false; };
  }, [surah?.id, retryKey, activeReciter.qcfRecitationId]);

  if (!surah) {
    return (
      <View style={{ flex: 1, backgroundColor: MUSHAF.page, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: MUSHAF.ink }}>{tr('mushaf.surahNotFound')}</Text>
      </View>
    );
  }

  const isCurrentlyPlaying = current?.surahId === surah.id && isPlaying;

  // 🎯 selector ينتج رقم الآية الجارية فقط - بدون اشتراك مباشر في positionMs/durationMs.
  //   Zustand يستخدم Object.is على القيمة المُرجَعة، فلو الآية لم تتغيّر، لا يحدث re-render
  //   حتى لو positionMs تغيّر في كل tick. هذا يقطع dozens من re-renders كل ثانية.
  const playingAyahNumber = useAudioStore((s) => {
    const playingThisSurah = s.current?.surahId === surah.id && s.isPlaying;
    if (!playingThisSurah || !ayahs) return null;
    // 🎯 وضع ملف الآية المنفصل: نعرف الآية الجارية بدقّة من الـ store مباشرةً.
    if (s.liveAyah != null) return s.liveAyah;
    if (s.durationMs === 0) return null;
    return getCurrentAyah(s.positionMs, s.durationMs, ayahs, surah.id, timings);
  });

  // 🔄 Auto-advance الصفحة لما الصوت يعدّي آخر آية في الصفحة الحالية.
  //   نتأكّد إن playingAyahNumber موجود في صفحة لاحقة بالفعل، عشان ما نقفزش
  //   لأماكن غلط لو حساب الـ getCurrentAyah كان قبل آية الصفحة (مثلاً اليوزر
  //   عمل seek يدوي لورا).
  useEffect(() => {
    if (!playingAyahNumber || !pages || !currentPage) return;
    const isOnCurrentPage = currentPage.ayahs.some((a) => a.number === playingAyahNumber);
    if (isOnCurrentPage) return;
    const newIdx = pages.findIndex((p) => p.ayahs.some((a) => a.number === playingAyahNumber));
    if (newIdx > currentPageIdx) {
      setCurrentPageIdx(newIdx);
      setSelectedAyah(null);
    }
  }, [playingAyahNumber, currentPageIdx, pages, currentPage]);
  const showBismillah = surah.id !== 1 && surah.id !== 9;
  // 🎯 الجزء يتحدّث حسب الصفحة الحالية - لا يبقى ثابتاً على juzStart للسورة.
  //    سورة البقرة مثلاً تمتدّ عبر 3 أجزاء، فالـ header لازم يعكس الجزء الفعلي.
  const currentPageNumber = currentPage?.page ?? surah.pageStart;
  const currentJuz = useMemo(() => {
    // ابحث عن آخر juz بداية صفحتها <= الصفحة الحالية
    let juz = 1;
    for (let i = 0; i < JUZ_PAGE_STARTS.length; i++) {
      if (JUZ_PAGE_STARTS[i] <= currentPageNumber) juz = i + 1;
      else break;
    }
    return juz;
  }, [currentPageNumber]);
  const juzLabel = `الجزء ${juzNameAr(currentJuz)}`;
  const surahNameWithPrefix = `سورة ${surah.nameAr}`;
  const subInfo = `${surah.revelationType === 'meccan' ? 'مكية' : 'مدنية'}  ·  ${arabicNumber(surah.versesCount)} آية`;

  const handlePlay = () => {
    const pageAyahs = currentPage?.ayahs ?? [];
    const firstAyahOfPage = pageAyahs[0]?.number ?? 1;

    // هل الـ context الحالي محمّل بالفعل؟ (نفس السورة + التشغيل بدأ من أي آية
    //   في الصفحة الحالية — مش لازم الأولى). كده لو اخترت آية في نص الصفحة
    //   وعملت pause، الزرار يعمل resume من نفس المكان بدل ما يبدأ من أول الصفحة.
    const isCurrentPageLoaded =
      current?.surahId === surah.id &&
      current?.startAtAyah != null &&
      pageAyahs.some((a) => a.number === current.startAtAyah);

    if (isCurrentPageLoaded) {
      // 🟡 نفس الصفحة محمّلة → toggle (pause/resume) من نفس الموضع
      toggle();
    } else {
      // 🎵 سياق جديد (سورة مختلفة أو صفحة مختلفة) → ابدأ من الصفحة الحالية
      play({
        reciter: activeReciter,
        surahId: surah.id,
        surahName: surah.nameAr,
        ayahs: ayahs ?? [],
        startAtAyah: firstAyahOfPage,
        timings,
      });
    }

    setLastRead({
      surahId: surah.id,
      ayahNumber: firstAyahOfPage,
      surahName: surah.nameAr,
      page: currentPage?.page ?? surah.pageStart,
      updatedAt: Date.now(),
    });
  };

  /**
   * 🕌 خط القرآن:
   * - على web: نستخدم KFGQPC Uthmanic Hafs (الخط الرسمي لمجمع الملك فهد!)
   *   مع fallbacks لـ Scheherazade New و Amiri Quran.
   * - على native: نستخدم Amiri Quran المحمّل عبر expo-font.
   */
  const quranFont = Platform.OS === 'web'
    ? '"KFGQPC Uthmanic Hafs", "Scheherazade New", "Amiri Quran", serif'
    : t.fontFamilies.arabicQuran;

  // 🔑 callbacks ثابتة الهوية - تمنع MushafQpcPage من re-render على كل state tick
  const handleWordPress = useCallback((w: any) => {
    const [, aya] = (w.verse_key ?? '').split(':');
    const ayahNum = Number(aya);
    if (!ayahNum) return;
    // 🌐 WBW mode: tap على الكلمة يجيب ترجمتها ويعرضها في الـ banner
    if (wbwMode && w.position && surah) {
      setWbwLoading(true);
      getWordsByVerse(surah.id, ayahNum)
        .then((words: QuranWord[]) => {
          const word = words.find((wo) => wo.position === w.position);
          if (word) {
            setWbwInfo({
              arabic: word.text || w.char || '',
              english: word.translation || '',
              translit: word.transliteration || '',
            });
          }
        })
        .catch(() => {})
        .finally(() => setWbwLoading(false));
      return;
    }
    setSelectedAyah((cur) => (cur === ayahNum ? null : ayahNum));
  }, [wbwMode, surah]);

  const handleWordLongPress = useCallback((w: { verse_key?: string }) => {
    const [, aya] = (w.verse_key ?? '').split(':');
    const ayahNum = Number(aya);
    if (!ayahNum || !surah || !ayahs) return;
    setSelectedAyah(null);
    play({
      reciter: activeReciter,
      surahId: surah.id,
      surahName: surah.nameAr,
      ayahNumber: ayahNum,
      ayahs: ayahs,
      startAtAyah: ayahNum,
      timings,
      exactAyah: true,
    });
  }, [activeReciter, ayahs, play, surah, timings]);

  // وضع QPC دائماً يستخدم الإطار الزخرفي
  const useDecoFrame = true;

  // 🖐️ PanResponder للـ swipe gesture الكامل على الصفحة بدل swipe zones صغيرة.
  //   شرط الـ swipe: حركة أفقية > 60px مع dx مهيمن على dy (مش scroll عمودي).
  //   كده تـ taps العادية على الكلمات بتشتغل بدون تداخل، والـ horizontal swipe
  //   ينقل بين الصفحات بسلاسة.
  // 🔑 ref بيحمل أحدث نسخة من دوال التنقل — يمنع الـ stale closure داخل الـ
  //   PanResponder (اللي بيتعمل مرة واحدة فقط).
  const navRef = React.useRef<{ next: () => void; prev: () => void }>({ next: () => {}, prev: () => {} });
  navRef.current.next = goToNextPage;
  navRef.current.prev = goToPrevPage;

  // 🖐️ السحب الأفقي بـ gesture-handler (أضمن من PanResponder ولا يتعارض مع ضغط الكلمات).
  const goPrevJS = React.useCallback(() => navRef.current.prev(), []);
  const goNextJS = React.useCallback(() => navRef.current.next(), []);

  // 📐 الوضع الأفقي (landscape/iPad): نحطّ الصفحة في النص بنسبة المصحف (بهوامش على
  //    الجنبين) بدل ما تتمدّد عريضة-قصيرة، فالخط يفضل واضح ومتناسق.
  const { width: winW, height: winH } = useWindowDimensions();
  const isLandscape = winW > winH;
  const [areaW, setAreaW] = useState(0);
  const [areaH, setAreaH] = useState(0);
  // الصفحة بعرض الشاشة الكامل (في الأفقي الخط بيكبر والمحتوى يـ scroll داخل MushafQpcPage).
  const pageW = areaW || winW;
  const sideMargin = 0;
  // 🖥️ نحسب خط الأفقي مرة واحدة من أبعاد الشاشة (ثابتة لكل الصفحات) ونمرّره جاهزاً لكل
  //    صفحة → الصفحة الجديدة تظهر بالحجم الصح فوراً بدل ما تبدأ صغيرة وتكبر وقت السحب.
  const landscapeFont = isLandscape && areaW > 0 ? landscapeFontSize(areaW, areaH || winH) : undefined;

  // 🎞️ سحب على شكل pager: الصفحة المجاورة ملزوقة جنب الحالية وتتحرك معاها (من غير فراغ).
  const SCREEN_W = pageW || winW; // مسافة الانزلاق = عرض الصفحة الفعلي (يشمل الأفقي)
  const dragX = useSharedValue(0);
  const [dragging, setDragging] = useState(false); // نركّب الصفحات المجاورة وقت السحب فقط
  const pageAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.value }] }));
  const commitSwap = React.useCallback((dir: number) => {
    if (dir > 0) navRef.current.next();
    else navRef.current.prev();
    dragX.value = 0;
    setDragging(false);
  }, [dragX]);
  const endDrag = React.useCallback(() => setDragging(false), []);
  const swipeGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15]) // يُفعَّل فقط مع حركة أفقية > 15px (الضغط/العمودي يمرّ)
        .failOffsetY([-25, 25]) // يفشل لو الحركة عمودية (مايتعارضش مع scroll)
        .onStart(() => {
          'worklet';
          runOnJS(setDragging)(true);
        })
        .onUpdate((e) => {
          'worklet';
          dragX.value = e.translationX;
        })
        .onEnd((e) => {
          'worklet';
          const tx = e.translationX;
          if (Math.abs(tx) < 55) {
            dragX.value = withTiming(0, { duration: 150 }, () => {
              'worklet';
              runOnJS(endDrag)();
            });
            return;
          }
          const dir = tx > 0 ? 1 : -1;
          dragX.value = withTiming(dir * SCREEN_W, { duration: 180 }, (finished) => {
            'worklet';
            if (finished) runOnJS(commitSwap)(dir);
            else runOnJS(endDrag)();
          });
        }),
    [SCREEN_W, dragX, commitSwap, endDrag],
  );

  // Use an inline JSX element instead of a component to prevent remounting/flickering
  const pageContentNode = (
    <View style={styles.pageWrap}>
      {/* رسالة خطأ */}
      {loadError ? (
        <View style={[styles.errBox, { borderColor: MUSHAF.gold, backgroundColor: 'rgba(184,148,86,0.10)' }]}>
          <AlertCircle size={16} color={MUSHAF.goldDeep} />
          <Text style={{ flex: 1, color: MUSHAF.goldDeep, fontSize: 13, marginHorizontal: 8 }}>
            {loadError}
          </Text>
          <Pressable onPress={() => setRetryKey((k) => k + 1)} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <RotateCcw size={14} color={MUSHAF.goldDeep} />
            <Text style={{ color: MUSHAF.goldDeep, fontSize: 13 }}>{tr('common.retry')}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Loading */}
      {!ayahs ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={MUSHAF.gold} size="large" />
          <Text style={{ color: MUSHAF.inkSoft, marginTop: 14, fontFamily: quranFont, fontSize: 14 }}>
            {tr('mushaf.loadingScripture')}
          </Text>
        </View>
      ) : null}

      {/* 🎯 مصحف المدينة QPC — تخطيط سطر-بسطر مطابق للمصحف المطبوع على كل المنصّات.
          الخطوط: woff2 على الويب، و TTF تُحمَّل من jsDelivr وتُخزَّن محلياً على الموبايل. */}
      {currentPage ? (
        <MushafQpcPage
          pageNumber={currentPage.page}
          goldColor={MUSHAF.gold}
          inkColor={MUSHAF.ink}
          pageColor={MUSHAF.page}
          landscape={isLandscape}
          fontSize={landscapeFont}
          selectedVerseKey={selectedAyah ? `${surah.id}:${selectedAyah}` : null}
          playingVerseKey={playingAyahNumber ? `${surah.id}:${playingAyahNumber}` : null}
          onWordPress={handleWordPress}
          onWordLongPress={handleWordLongPress}
        />
      ) : null}

      {/* 📖 التنقّل بين الصفحات بالسحب (swipe) فقط — مفيش مناطق لمس.
          الـ PanResponder على الصفحة بيتكفّل بالسحب الأفقي، والضغط العادي يفضل
          للكلمات (تفسير). swipe يمين = صفحة سابقة، swipe شمال = صفحة تالية. */}

      {/* Bottom Sheet: تفسير */}
      {selectedAyah !== null && ayahs ? (
        <AyahDetailSheet
          visible={selectedAyah !== null}
          onClose={() => setSelectedAyah(null)}
          surahId={surah.id}
          ayahNumber={selectedAyah}
          ayahText={ayahs.find((a) => a.number === selectedAyah)?.text ?? ''}
          surahName={surah.nameAr}
          isBookmarked={bookmarks.some((b) => b.surahId === surah.id && b.ayahNumber === selectedAyah)}
          isFavorite={favorites.includes(`${surah.id}:${selectedAyah}`)}
          onToggleBookmark={() => toggleBookmark(surah.id, selectedAyah, surah.pageStart)}
          onToggleFavorite={() => toggleFavorite(surah.id, selectedAyah)}
          onPlay={() => {
            setSelectedAyah(null);
            // 🎯 شغّل من الآية المختارة بـ "ملف الآية المنفصل" (بداية مضبوطة).
            //   للقرّاء غير المدعومين، الـ store بيرجع تلقائياً لملف السورة + القفز.
            play({ reciter: activeReciter, surahId: surah.id, surahName: surah.nameAr, ayahNumber: selectedAyah, ayahs: ayahs ?? [], startAtAyah: selectedAyah, timings, exactAyah: true });
          }}
        />
      ) : null}
    </View>
  );
  // فكل render كان بيعمل remount لكل الـ tree تحته (بما فيها MushafQpcPage).
  // التحويل لـ inline ternary بيحلّ flicker كامل عند اختيار الآيات.
  // Remove wrappedChildren function since we will apply MushafBorder directly to the page content.

  // 📄 الصفحات المجاورة (لسحب الـ pager بدون فراغ) — تُركَّب وقت السحب فقط.
  const prevPageNum = currentPage && currentPage.page > 1 ? currentPage.page - 1 : null;
  const nextPageNum = currentPage && currentPage.page < 604 ? currentPage.page + 1 : null;
  // رسم صفحة مجاورة بإطارها (قراءة فقط — بدون مُعالِجات ضغط، للمعاينة أثناء السحب).
  const framedPage = (pn: number) =>
    useDecoFrame && !isLandscape ? (
      <MushafBorder
        goldColor={MUSHAF.gold}
        goldDeep={MUSHAF.goldDeep}
        pageColor={MUSHAF.page}
        ornamentBg={MUSHAF.pageWarm}
      >
        <View style={styles.pageWrap}>
          <MushafQpcPage pageNumber={pn} goldColor={MUSHAF.gold} inkColor={MUSHAF.ink} pageColor={MUSHAF.page} landscape={isLandscape} fontSize={landscapeFont} />
        </View>
      </MushafBorder>
    ) : (
      <View style={{ flex: 1, backgroundColor: MUSHAF.page }}>
        <View style={styles.pageWrap}>
          <MushafQpcPage pageNumber={pn} goldColor={MUSHAF.gold} inkColor={MUSHAF.ink} pageColor={MUSHAF.page} landscape={isLandscape} fontSize={landscapeFont} />
        </View>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: MUSHAF.pageWarm }}>
      {/* Safe-area top - شريط حماية للستاتس بار بنفس لون الـ chrome */}
      <View style={{ height: insets.top, backgroundColor: MUSHAF.pageWarm }} />

      {/* ════ الحاوية الرئيسية - flex column ════ */}
      <View style={{ flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center' }}>

        {/* ── HEADER AREA ── */}
        <View
          style={{
            backgroundColor: MUSHAF.pageWarm,
            borderBottomColor: MUSHAF.gold + '40',
            borderBottomWidth: StyleSheet.hairlineWidth,
          }}
        >
          {/* شريط التنقل - رجوع + قائمة */}
          <View style={styles.navBar}>
            <Pressable
              onPress={() => router.push('/mushaf')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="القائمة"
              style={({ pressed }) => [
                styles.navBtn,
                { backgroundColor: MUSHAF.buttonBg, borderColor: MUSHAF.gold, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Menu size={18} color={MUSHAF.goldDeep} strokeWidth={2} />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* 🌐 Word-by-word translation toggle */}
              <Pressable
                onPress={() => { setWbwMode((v) => !v); setWbwInfo(null); }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={wbwMode ? 'إيقاف ترجمة الكلمات' : 'تفعيل ترجمة الكلمات'}
                style={({ pressed }) => [
                  styles.navBtn,
                  {
                    backgroundColor: wbwMode ? MUSHAF.gold : MUSHAF.buttonBg,
                    borderColor: MUSHAF.gold,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Languages size={18} color={wbwMode ? MUSHAF.page : MUSHAF.goldDeep} strokeWidth={2} />
              </Pressable>
              <Pressable
                onPress={() => { if (router.canGoBack?.()) router.back(); else router.replace('/mushaf'); }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="رجوع"
                style={({ pressed }) => [
                  styles.navBtn,
                  { backgroundColor: MUSHAF.buttonBg, borderColor: MUSHAF.gold, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <ArrowLeft size={18} color={MUSHAF.goldDeep} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* شريط الجزء + السورة */}
          <MushafHeader
            juzLabel={juzLabel}
            surahName={surahNameWithPrefix}
            goldColor={MUSHAF.gold}
            goldDeep={MUSHAF.goldDeep}
            pageColor={MUSHAF.pageWarm}
            textColor={MUSHAF.accentText}
            quranFont={quranFont}
            onSurahPress={() => setShowSurahJump(true)}
            onJuzPress={() => setShowJuzJump(true)}
          />
        </View>

        {/* ── PAGE AREA ── الإطار يعيش هنا فقط، لا overlap. السحب يلفّه GestureDetector */}
        <GestureDetector gesture={swipeGesture}>
        <View
          style={[styles.pageArea, { overflow: 'hidden' }]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (Math.abs(width - areaW) > 1) setAreaW(width);
            if (Math.abs(height - areaH) > 1) setAreaH(height);
          }}
        >
          {/* 🎞️ pager حقيقي زي البرامج التانية: الحالية + المجاورتين **مُركّبة دايماً** (مش
              وقت السحب بس) — فبتقيس نفسها وهي برّه الشاشة وتظهر مستقرة فوراً عند السحب،
              من غير تحميل/قياس/تظليل. في الأفقي: الصفحة بعرض pageW متوسّطة (sideMargin). */}
          <Animated.View style={[{ flex: 1 }, pageAnimStyle]}>
          {/* الصفحة التالية (overlay وقت السحب فقط) — على يسار الحالية، تظهر مع السحب لليمين */}
          {dragging && nextPageNum ? (
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: pageW, transform: [{ translateX: -SCREEN_W }] }}>
              {framedPage(nextPageNum)}
            </View>
          ) : null}
          {/* الصفحة السابقة (overlay وقت السحب فقط) — على يمين الحالية، تظهر مع السحب لليسار */}
          {dragging && prevPageNum ? (
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: pageW, transform: [{ translateX: SCREEN_W }] }}>
              {framedPage(prevPageNum)}
            </View>
          ) : null}
          {/* 🎯 الصفحة الحالية = flex عادي بالظبط زي نسخة اللمس (مفيش تموضع absolute يلخبط القياس) */}
          {useDecoFrame && !isLandscape ? (
            <MushafBorder
              goldColor={MUSHAF.gold}
              goldDeep={MUSHAF.goldDeep}
              pageColor={MUSHAF.page}
              ornamentBg={MUSHAF.pageWarm}
            >
              {pageContentNode}
            </MushafBorder>
          ) : (
            <View style={{ flex: 1, backgroundColor: MUSHAF.page }}>
              {pageContentNode}
            </View>
          )}
          </Animated.View>

          {/* 💡 تلميح تقليب الصفحات (أول مرّة فقط) */}
          {showPageHint && pages && pages.length > 1 ? (
            <Pressable
              onPress={() => setShowPageHint(false)}
              pointerEvents="box-only"
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,24,21,0.55)', zIndex: 200 }}
            >
              {/* صف مفروض LTR: يسار = السابقة (سحب لليسار)، يمين = التالية (سحب لليمين) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 24, direction: 'ltr' } as any}>
                <View style={{ alignItems: 'center' }}>
                  <ChevronsLeft size={40} color={MUSHAF.gold} />
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700', marginTop: 4 }}>السابقة</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <ChevronsRight size={40} color={MUSHAF.gold} />
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700', marginTop: 4 }}>التالية</Text>
                </View>
              </View>
              <View style={{ marginTop: 28, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 }}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 24 }}>
                  اسحب الصفحة يميناً أو يساراً لتقليب الصفحات
                </Text>
              </View>
            </Pressable>
          ) : null}

          {/* 🌐 Word-by-word translation banner — يطفو فوق المصحف لما WBW mode شغّال */}
          {wbwMode ? (
            <View
              pointerEvents="box-none"
              style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}
            >
              <View style={[styles.wbwBanner, { backgroundColor: MUSHAF.pageWarm, borderColor: MUSHAF.gold, shadowColor: MUSHAF.gold }]}>
                {wbwLoading ? (
                  <Text style={{ color: MUSHAF.inkSoft, fontSize: 12, textAlign: 'center' }}>
                    جاري تحميل الترجمة...
                  </Text>
                ) : wbwInfo ? (
                  <View>
                    <View style={styles.wbwHeader}>
                      <Text style={{ color: MUSHAF.goldDeep, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                        ترجمة الكلمة
                      </Text>
                      <Pressable
                        onPress={() => setWbwInfo(null)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel="إغلاق الترجمة"
                      >
                        <XIcon size={14} color={MUSHAF.inkSoft} />
                      </Pressable>
                    </View>
                    <Text style={{ color: MUSHAF.ink, fontSize: 22, fontWeight: '700', textAlign: 'center', fontFamily: quranFont, marginTop: 6 }}>
                      {wbwInfo.arabic}
                    </Text>
                    {wbwInfo.translit ? (
                      <Text style={{ color: MUSHAF.inkSoft, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 2 }}>
                        {wbwInfo.translit}
                      </Text>
                    ) : null}
                    <View style={[styles.wbwDivider, { backgroundColor: MUSHAF.gold + '40' }]} />
                    <Text style={{ color: MUSHAF.ink, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                      {wbwInfo.english || '—'}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: MUSHAF.inkSoft, fontSize: 12, textAlign: 'center', fontWeight: '600' }}>
                    اضغط على أي كلمة في المصحف لعرض ترجمتها
                  </Text>
                )}
              </View>
            </View>
          ) : null}
        </View>
        </GestureDetector>

        {/* ── FOOTER AREA ── */}
        <View
          style={{
            backgroundColor: MUSHAF.pageWarm,
            borderTopColor: MUSHAF.gold + '40',
            borderTopWidth: StyleSheet.hairlineWidth,
          }}
        >
          {/* رقم الصفحة */}
          <MushafFooter
            pageNumber={currentPage?.page ?? surah.pageStart}
            hizbLabel={describeHizbProgress(currentPage?.page ?? surah.pageStart)}
            onPagePress={() => setShowPageJump(true)}
            goldColor={MUSHAF.gold}
            goldDeep={MUSHAF.goldDeep}
            pageColor={MUSHAF.pageWarm}
            textColor={MUSHAF.accentText}
            amiriFont={quranFont}
          />
          {/* شريط الصوت */}
          <View style={styles.audioBar}>
            {/* 🌿 زر التشغيل: زمردي ممتلئ + أيقونة ذهبية - أهم CTA في الصفحة
                يبرز هوية التطبيق ويستحق الانتباه (Spotify/Apple Music style) */}
            <Pressable
              onPress={handlePlay}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isCurrentlyPlaying ? 'إيقاف التلاوة' : 'تشغيل التلاوة'}
              style={({ pressed }) => [
                styles.audioBarPlayBtn,
                {
                  backgroundColor: MUSHAF.ctaBg,
                  borderColor: MUSHAF.gold,
                  borderWidth: 1.5,
                  shadowColor: MUSHAF.ctaShadow,
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              {isCurrentlyPlaying
                ? <Pause size={18} color={MUSHAF.ctaFg} fill={MUSHAF.ctaFg} />
                : <Play size={18} color={MUSHAF.ctaFg} fill={MUSHAF.ctaFg} style={{ marginLeft: 2 }} />}
            </Pressable>

            <Pressable
              onPress={() => setShowRecitersModal(true)}
              accessibilityRole="button"
              accessibilityLabel={`القارئ الحالي: ${activeReciter.nameAr}. اضغط لتغييره`}
              style={({ pressed }) => [
                styles.reciterChip,
                { backgroundColor: MUSHAF.buttonBg, borderColor: MUSHAF.gold, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text
                style={{ color: MUSHAF.goldDeep, fontSize: 11, fontWeight: '700' }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                بصوت: {activeReciter.nameAr}
              </Text>
            </Pressable>

          </View>
        </View>
      </View>

      {/* Safe-area bottom */}
      <View style={{ height: insets.bottom, backgroundColor: MUSHAF.pageWarm }} />

      {/* ───── قائمة الآيات للوصول السريع للتفسير ───── */}
      {currentPage ? (
        <AyahListSheet
          visible={showAyahList}
          onClose={() => setShowAyahList(false)}
          pageNumber={currentPage.page}
          surahName={surah.nameAr}
          ayahs={currentPage.ayahs}
          onAyahPress={(ayahNumber) => {
            setShowAyahList(false);
            setSelectedAyah(ayahNumber);
          }}
          quranFont={quranFont}
        />
      ) : null}

      {/* ───── Modal اختيار القارئ ───── */}
      <Modal
        visible={showRecitersModal}
        animationType="slide"
        transparent={true}
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => setShowRecitersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: t.colors.textPrimary }}>اختر القارئ</Text>
              <Pressable onPress={() => setShowRecitersModal(false)} style={{ padding: 4 }}>
                <X size={24} color={t.colors.textSecondary} />
              </Pressable>
            </View>

            <FlatList
              data={RECITERS}
              keyExtractor={(r) => r.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const isSelected = item.id === preferredReciterId;
                return (
                  <Pressable
                    onPress={() => {
                      setPreferredReciterId(item.id);
                      setShowRecitersModal(false);
                      // إعادة تشغيل الصوت بالقارئ الجديد إذا كان يعمل
                      // 🎯 لازم نمرّر ayahs + startAtAyah عشان التشغيل يبدأ من نفس الموضع الحالي
                      // مش من أول السورة (وعشان live highlight يشتغل)
                      if (isPlaying && current?.surahId === surah.id) {
                        const startFrom = current.startAtAyah ?? current.ayahNumber ?? currentPage?.ayahs[0]?.number ?? 1;
                        play({
                          reciter: item,
                          surahId: surah.id,
                          surahName: surah.nameAr,
                          ayahs: ayahs ?? [],
                          startAtAyah: startFrom,
                          // لا نمرّر timings هنا: القارئ المختار (item) قد يختلف عن القارئ
                          // النشط الذي حُمِّلت توقيتاته — فنتجنّب تشغيل صوت قارئ خاطئ.
                        });
                      }
                    }}
                    style={[
                      styles.reciterItem,
                      { backgroundColor: isSelected ? t.colors.accentSoft : t.colors.surface },
                      isSelected && { borderColor: t.colors.accent, borderWidth: 1 }
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: isSelected ? t.colors.accentDeep : t.colors.textPrimary }}>
                        {item.nameAr}
                      </Text>
                      <Text style={{ fontSize: 13, color: t.colors.textTertiary, marginTop: 4 }}>
                        {item.style} • {item.countryAr}
                      </Text>
                    </View>
                    {isSelected && <CheckCircle2 size={22} color={t.colors.accent} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── Page Jump Modal ── */}
      <Modal visible={showPageJump} transparent animationType="slide" supportedOrientations={['portrait', 'landscape']} onRequestClose={() => setShowPageJump(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPageJump(false)} accessibilityLabel="إغلاق" />
          <View style={[styles.modalContent, { backgroundColor: MUSHAF.modalBg, height: 'auto', paddingBottom: Platform.OS === 'ios' ? 40 : 20 }]}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 12 }} />
            <View style={[styles.modalHeader, { borderBottomColor: MUSHAF.gold + '40' }]}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: MUSHAF.gold, fontFamily: quranFont }}>الذهاب لصفحة</Text>
              <Pressable onPress={() => setShowPageJump(false)} hitSlop={10} style={{ backgroundColor: MUSHAF.gold + '22', padding: 6, borderRadius: 20 }}>
                <X size={20} color={MUSHAF.gold} />
              </Pressable>
            </View>
            <View style={{ padding: 24 }}>
              <Text style={{ color: MUSHAF.modalText + 'CC', marginBottom: 16, fontSize: 15, fontWeight: '600' }}>
                أدخل رقم الصفحة من 1 إلى 604:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1, borderColor: MUSHAF.gold, borderRadius: 12,
                  padding: 16, fontSize: 24, textAlign: 'center', color: MUSHAF.ink,
                  backgroundColor: MUSHAF.pageWarm, fontWeight: '700'
                }}
                keyboardType="number-pad"
                value={jumpPageNum}
                onChangeText={setJumpPageNum}
                placeholder="مثال: 250"
                placeholderTextColor={MUSHAF.inkSoft + '80'}
                autoFocus
                onSubmitEditing={handlePageJump}
              />
              <Pressable
                onPress={handlePageJump}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? MUSHAF.goldDeep : MUSHAF.gold, padding: 16, borderRadius: 12,
                  alignItems: 'center', marginTop: 24
                })}
              >
                <Text style={{ color: MUSHAF.modalBg, fontSize: 18, fontWeight: '800' }}>انتقال للصفحة</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Surah Jump Modal ── */}
      <Modal visible={showSurahJump} transparent animationType="slide" supportedOrientations={['portrait', 'landscape']} onRequestClose={() => setShowSurahJump(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSurahJump(false)} accessibilityLabel="إغلاق" />
          <View style={[styles.modalContent, { backgroundColor: MUSHAF.modalBg, maxHeight: '80%' }]}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 12 }} />
            <View style={[styles.modalHeader, { borderBottomColor: MUSHAF.gold + '40' }]}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: MUSHAF.gold, fontFamily: quranFont }}>اختر سورة للذهاب إليها</Text>
              <Pressable onPress={() => setShowSurahJump(false)} hitSlop={10} style={{ backgroundColor: MUSHAF.gold + '22', padding: 6, borderRadius: 20 }}>
                <X size={20} color={MUSHAF.gold} />
              </Pressable>
            </View>
            <FlatList
              data={SURAHS}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setShowSurahJump(false);
                    executePageJump(item.pageStart);
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: MUSHAF.gold + '20',
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: pressed ? MUSHAF.gold + '15' : 'transparent'
                  })}
                >
                  <Text style={{ fontSize: 20, fontWeight: '700', color: MUSHAF.modalText, fontFamily: quranFont }}>سورة {item.nameAr}</Text>
                  <View style={{ backgroundColor: MUSHAF.gold + '22', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: MUSHAF.gold + '55' }}>
                    <Text style={{ fontSize: 12, color: MUSHAF.gold, fontWeight: '800' }}>صفحة {item.pageStart}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ── Juz Jump Modal ── */}
      <Modal visible={showJuzJump} transparent animationType="slide" supportedOrientations={['portrait', 'landscape']} onRequestClose={() => setShowJuzJump(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowJuzJump(false)} accessibilityLabel="إغلاق" />
          <View style={[styles.modalContent, { backgroundColor: MUSHAF.modalBg, maxHeight: '80%' }]}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 12 }} />
            <View style={[styles.modalHeader, { borderBottomColor: MUSHAF.gold + '40' }]}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: MUSHAF.gold, fontFamily: quranFont }}>اختر جزءاً للذهاب إليه</Text>
              <Pressable onPress={() => setShowJuzJump(false)} hitSlop={10} style={{ backgroundColor: MUSHAF.gold + '22', padding: 6, borderRadius: 20 }}>
                <X size={20} color={MUSHAF.gold} />
              </Pressable>
            </View>
            <FlatList
              data={JUZ_LIST}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const targetPage = JUZ_PAGE_STARTS[item.id - 1] || 1;
                return (
                  <Pressable
                    onPress={() => {
                      setShowJuzJump(false);
                      executePageJump(targetPage);
                    }}
                    style={({ pressed }) => ({
                      paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: MUSHAF.gold + '20',
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: pressed ? MUSHAF.gold + '15' : 'transparent'
                    })}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '700', color: MUSHAF.modalText, fontFamily: quranFont }}>{item.nameAr}</Text>
                    <View style={{ backgroundColor: MUSHAF.gold + '22', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: MUSHAF.gold + '55' }}>
                      <Text style={{ fontSize: 12, color: MUSHAF.gold, fontWeight: '800' }}>صفحة {targetPage}</Text>
                    </View>
                  </Pressable>
                )
              }}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─────────────── Helpers ───────────────

function juzNameAr(juzNumber: number): string {
  const names = [
    '', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن',
    'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر',
    'السادس عشر', 'السابع عشر', 'الثامن عشر', 'التاسع عشر', 'العشرون', 'الحادي والعشرون',
    'الثاني والعشرون', 'الثالث والعشرون', 'الرابع والعشرون', 'الخامس والعشرون',
    'السادس والعشرون', 'السابع والعشرون', 'الثامن والعشرون', 'التاسع والعشرون', 'الثلاثون',
  ];
  return names[juzNumber] ?? arabicNumber(juzNumber);
}

const styles = StyleSheet.create({
  // ── البنية الجديدة: 3 أقسام عمودية بدل overlays ──
  wbwBanner: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  wbwHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wbwDivider: {
    height: 0.6,
    marginVertical: 8,
  },
  pageArea: {
    flex: 1,
    // الإطار يعيش هنا فقط - يأخذ كل المساحة المتاحة بين الهيدر والفوتر
    // الـ paddingHorizontal من MushafBorder نفسه (margin: 4)
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 0,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 8,
  },
  audioBarPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    // ظل زمردي خفيف يبرز الزر كأهم CTA في الصفحة
    ...Platform.select({
      ios: { shadowColor: '#0A3D38', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  reciterChip: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  // ── باقي الأنماط ──
  headerWrap: { paddingTop: 6, paddingBottom: 0, zIndex: 10 },
  footerWrap: { paddingTop: 0, paddingBottom: 6, zIndex: 10 },

  scroll: {
    paddingTop: 10,
    paddingBottom: 32,
    paddingHorizontal: 6,
  },
  bismillahWrap: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  ayahFlow: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  rosetteInline: {
    // Inline display
  } as any,
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  endWrap: {
    alignItems: 'center',
    marginTop: 28,
    paddingTop: 8,
  },
  pageWrap: {
    flex: 1,
  },
  // 👆 منطقة اللمس للتنقّل بين الصفحات (شفافة - بدون أزرار مرئية).
  //    الجانب (left/right) يُطبَّق inline بناءً على I18nManager لثبات الموضع الفيزيائي.
  tapZoneEdge: {
    width: 64,
    alignSelf: 'stretch',
    zIndex: 100,
    // للديباغ: backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  actionPanel: {
    marginTop: 22,
    padding: 16,
    borderWidth: 1,
    borderRadius: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    paddingHorizontal: 4,
    minWidth: 56,
  },

  floatingControlsWrap: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    alignItems: 'center',
  },
  reciterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  playFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC',
  },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
});
