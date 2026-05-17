/**
 * شاشة قراءة السورة - تصميم المصحف الشريف الكلاسيكي:
 *  - إطار ذهبي مزخرف بنقش هندسي إسلامي على الحواف الأربع
 *  - ترويسة بأزرار بيج + اسم السورة + الجزء + زخرفات معيّن
 *  - نص قرآني متتابع بالرسم العثماني + رصائع آيات ذهبية
 *  - شريط سفلي برقم الصفحة وزر القراءة
 *  - بطاقة إجراءات تظهر عند تحديد آية (مرجعية، مفضّلة، نسخ، مشاركة، استمع)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Modal, FlatList, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Play, Pause, AlertCircle, RotateCcw, X, CheckCircle2,
  Menu, ArrowLeft, Eye,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { getSurahById, arabicNumber, SURAHS, JUZ_LIST, JUZ_PAGE_STARTS } from '@data/surahs';
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
} from '@components/mushaf';
import { getCurrentAyah, getAyahStartTimeMs } from '@services/verseSync';
import { getSurahTimings, type SurahTimings } from '@services/audioTimings';

// Removed DEFAULT_RECITER; now fetched dynamically.

/**
 * لوحة ألوان المصحف - مرتبطة بهوية التطبيق (parchment + gold + emerald).
 * تُحسَب ديناميكياً من theme.colors لتدعم light/dark mode.
 */
function buildMushafPalette(t: ReturnType<typeof useTheme>) {
  return {
    page:     t.colors.background,      // parchment100 / midnight800
    pageWarm: t.colors.surfaceAlt,      // parchment200 / midnight800
    ink:      t.colors.textPrimary,     // ink900 / parchment100
    inkSoft:  t.colors.textSecondary,   // ink600 / ink300
    gold:     t.colors.accent,          // gold500 / gold300
    goldDeep: t.colors.accentDeep,      // gold700 / gold500
    buttonBg: t.colors.surface,         // parchment50 / midnight700
    selected: t.colors.accentSoft,      // gold50 / rgba gold
    ruby:     t.colors.error,
    emerald:  t.colors.primary,         // emerald700 / gold300
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
  const [isImmersive, setIsImmersive] = useState(false);

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
    }
  };
  const goToPrevPage = () => {
    if (currentPageIdx > 0) {
      setCurrentPageIdx((i) => i - 1);
      setSelectedAyah(null);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

    // 🎯 حمّل توقيتات الآيات بالتوازي - لا يحجب رسم الصفحة لو فشل
    getSurahTimings(surah.id)
      .then((t) => { if (mounted && t) setTimings(t); })
      .catch(() => {});

    return () => { mounted = false; };
  }, [surah?.id, retryKey]);

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
    if (!playingThisSurah || !ayahs || s.durationMs === 0) return null;
    return getCurrentAyah(s.positionMs, s.durationMs, ayahs, surah.id, timings);
  });
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
    const firstAyahOfPage = currentPage?.ayahs[0]?.number ?? 1;

    // هل الـ context الحالي محمّل بالفعل؟ (نفس السورة + نفس الصفحة)
    const isCurrentPageLoaded =
      current?.surahId === surah.id &&
      current?.startAtAyah === firstAyahOfPage;

    if (isCurrentPageLoaded) {
      // 🟡 نفس الصفحة محمّلة → toggle (pause/resume)
      toggle();
    } else {
      // 🎵 سياق جديد (سورة مختلفة أو صفحة مختلفة) → ابدأ من الصفحة الحالية
      play({
        reciter: activeReciter,
        surahId: surah.id,
        surahName: surah.nameAr,
        ayahs: ayahs ?? [],
        startAtAyah: firstAyahOfPage,
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
  const handleWordPress = useCallback((w: { verse_key?: string }) => {
    const [, aya] = (w.verse_key ?? '').split(':');
    const ayahNum = Number(aya);
    if (!ayahNum) return;
    setSelectedAyah((cur) => (cur === ayahNum ? null : ayahNum));
  }, []);

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
    });
  }, [activeReciter, ayahs, play, surah]);

  // وضع QPC دائماً يستخدم الإطار الزخرفي
  const useDecoFrame = true;

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

      {/* 🎯 وضع QPC الثابت */}
      {currentPage ? (
        <MushafQpcPage
          pageNumber={currentPage.page}
          goldColor={MUSHAF.gold}
          inkColor={MUSHAF.ink}
          pageColor={MUSHAF.page}
          selectedVerseKey={selectedAyah ? `${surah.id}:${selectedAyah}` : null}
          playingVerseKey={playingAyahNumber ? `${surah.id}:${playingAyahNumber}` : null}
          onWordPress={handleWordPress}
          onWordLongPress={handleWordLongPress}
        />
      ) : null}

      {/* منطقتي السحب للتنقّل */}
      {pages && pages.length > 1 ? (
        <>
          <Pressable onPress={goToPrevPage} disabled={currentPageIdx === 0} style={styles.swipeZoneRight} />
          <Pressable onPress={goToNextPage} disabled={currentPageIdx === totalPages - 1} style={styles.swipeZoneLeft} />
        </>
      ) : null}

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
            // 🎯 اقرأ durationMs الحالية من الـ store (بدون اشتراك reactive)
            const liveState = useAudioStore.getState();
            const liveDurationMs = liveState.durationMs;
            if (current?.surahId === surah.id && current.reciter.id === activeReciter.id && liveDurationMs > 0 && ayahs) {
              // مستخدم getAyahStartTimeMs المستورد فوق - بدل require() القديم
              const targetMs = getAyahStartTimeMs(selectedAyah, liveDurationMs, ayahs, surah.id, timings);
              if (targetMs > 0) seek(targetMs);
              if (!isPlaying) toggle();
            } else {
              play({ reciter: activeReciter, surahId: surah.id, surahName: surah.nameAr, ayahNumber: selectedAyah, ayahs: ayahs ?? [], startAtAyah: selectedAyah });
            }
          }}
        />
      ) : null}
    </View>
  );
  // فكل render كان بيعمل remount لكل الـ tree تحته (بما فيها MushafQpcPage).
  // التحويل لـ inline ternary بيحلّ flicker كامل عند اختيار الآيات.
  // Remove wrappedChildren function since we will apply MushafBorder directly to the page content.

  return (
    <View style={{ flex: 1, backgroundColor: MUSHAF.page }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 700, alignSelf: 'center' }}>
        {/* ───── الترويسة ───── */}
        {/* شريط الإجراءات العلوي الشفاف (فوق الإطار) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: Platform.OS === 'ios' ? 44 : 16, paddingBottom: 4 }}>
          <Pressable onPress={() => router.push('/mushaf')} hitSlop={10}>
            <Menu size={22} color={MUSHAF.inkSoft} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={() => { if (router.canGoBack?.()) router.back(); else router.replace('/mushaf'); }} hitSlop={10}>
            <ArrowLeft size={22} color={MUSHAF.inkSoft} strokeWidth={2} />
          </Pressable>
        </View>

        {/* ───── الترويسة المرجعية الخالصة ───── */}
        {!isImmersive && (
          <View style={styles.headerWrap}>
            <MushafHeader
              juzLabel={juzLabel}
              surahName={surahNameWithPrefix}
              goldColor={MUSHAF.gold}
              goldDeep={t.colors.primaryDark}
              pageColor={MUSHAF.page}
              quranFont={quranFont}
              onSurahPress={() => setShowSurahJump(true)}
              onJuzPress={() => setShowJuzJump(true)}
            />
          </View>
        )}

        {/* ───── محتوى الصفحة ───── */}
        {useDecoFrame ? (
          <MushafBorder
            goldColor={MUSHAF.gold}
            goldDeep={t.colors.primaryDark}
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

        {/* ───── الشريط السفلي ───── */}
        {!isImmersive && !selectedAyah && (
          <View style={styles.footerWrap}>
            <MushafFooter
              pageNumber={currentPage?.page ?? surah.pageStart}
              onPagePress={() => setShowPageJump(true)}
              goldColor={MUSHAF.gold}
              goldDeep={t.colors.primaryDark}
              pageColor={MUSHAF.page}
              amiriFont={quranFont}
            />
          </View>
        )}

        {/* شريط التحكم بالصوت */}
        {!isImmersive && !selectedAyah && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7 }}>
            <Pressable onPress={handlePlay} hitSlop={10}>
              {isCurrentlyPlaying ? <Pause size={22} color={MUSHAF.goldDeep} /> : <Play size={22} color={MUSHAF.goldDeep} />}
            </Pressable>

            <Pressable onPress={() => setShowRecitersModal(true)} style={{ backgroundColor: MUSHAF.buttonBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: MUSHAF.gold }}>
              <Text style={{ color: MUSHAF.goldDeep, fontSize: 12, fontWeight: '700' }}>
                بصوت: {activeReciter.nameAr.split(' ').slice(-2).join(' ')}
              </Text>
            </Pressable>

            <Pressable onPress={() => setIsImmersive(v => !v)} hitSlop={10}>
              <Eye size={20} color={MUSHAF.inkSoft} strokeWidth={2} />
            </Pressable>
          </View>
        )}
      </View>

      {/* تم استبدال الأزرار العائمة بالشريط السفلي الشفاف خارج إطار المصحف */}

      {/* ───── قائمة الآيات للتفسير (في وضع الصور) ───── */}
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
      <Modal visible={showPageJump} transparent animationType="slide" onRequestClose={() => setShowPageJump(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPageJump(false)} accessibilityLabel="إغلاق" />
          <View style={[styles.modalContent, { backgroundColor: t.colors.primaryDark, height: 'auto', paddingBottom: Platform.OS === 'ios' ? 40 : 20 }]}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 12 }} />
            <View style={[styles.modalHeader, { borderBottomColor: 'rgba(212, 181, 112, 0.2)' }]}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#D4B570', fontFamily: quranFont }}>الذهاب لصفحة</Text>
              <Pressable onPress={() => setShowPageJump(false)} hitSlop={10} style={{ backgroundColor: 'rgba(212, 181, 112, 0.1)', padding: 6, borderRadius: 20 }}>
                <X size={20} color="#D4B570" />
              </Pressable>
            </View>
            <View style={{ padding: 24 }}>
              <Text style={{ color: 'rgba(253, 251, 247, 0.8)', marginBottom: 16, fontSize: 15, fontWeight: '600' }}>
                أدخل رقم الصفحة من 1 إلى 604:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1, borderColor: 'rgba(212, 181, 112, 0.4)', borderRadius: 12,
                  padding: 16, fontSize: 24, textAlign: 'center', color: '#FDFBF7',
                  backgroundColor: 'rgba(0,0,0,0.2)', fontWeight: '700'
                }}
                keyboardType="number-pad"
                value={jumpPageNum}
                onChangeText={setJumpPageNum}
                placeholder="مثال: 250"
                placeholderTextColor="rgba(253, 251, 247, 0.3)"
                autoFocus
                onSubmitEditing={handlePageJump}
              />
              <Pressable
                onPress={handlePageJump}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#B8923B' : '#D4B570', padding: 16, borderRadius: 12,
                  alignItems: 'center', marginTop: 24
                })}
              >
                <Text style={{ color: '#0A1815', fontSize: 18, fontWeight: '800' }}>انتقال للصفحة</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Surah Jump Modal ── */}
      <Modal visible={showSurahJump} transparent animationType="slide" onRequestClose={() => setShowSurahJump(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSurahJump(false)} accessibilityLabel="إغلاق" />
          <View style={[styles.modalContent, { backgroundColor: t.colors.primaryDark, maxHeight: '80%' }]}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 12 }} />
            <View style={[styles.modalHeader, { borderBottomColor: 'rgba(212, 181, 112, 0.2)' }]}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#D4B570', fontFamily: quranFont }}>اختر سورة للذهاب إليها</Text>
              <Pressable onPress={() => setShowSurahJump(false)} hitSlop={10} style={{ backgroundColor: 'rgba(212, 181, 112, 0.1)', padding: 6, borderRadius: 20 }}>
                <X size={20} color="#D4B570" />
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
                    paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 181, 112, 0.1)',
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: pressed ? 'rgba(212, 181, 112, 0.05)' : 'transparent'
                  })}
                >
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#FDFBF7', fontFamily: quranFont }}>سورة {item.nameAr}</Text>
                  <View style={{ backgroundColor: 'rgba(212, 181, 112, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212, 181, 112, 0.3)' }}>
                    <Text style={{ fontSize: 12, color: '#D4B570', fontWeight: '800' }}>صفحة {item.pageStart}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ── Juz Jump Modal ── */}
      <Modal visible={showJuzJump} transparent animationType="slide" onRequestClose={() => setShowJuzJump(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowJuzJump(false)} accessibilityLabel="إغلاق" />
          <View style={[styles.modalContent, { backgroundColor: t.colors.primaryDark, maxHeight: '80%' }]}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 12 }} />
            <View style={[styles.modalHeader, { borderBottomColor: 'rgba(212, 181, 112, 0.2)' }]}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#D4B570', fontFamily: quranFont }}>اختر جزءاً للذهاب إليه</Text>
              <Pressable onPress={() => setShowJuzJump(false)} hitSlop={10} style={{ backgroundColor: 'rgba(212, 181, 112, 0.1)', padding: 6, borderRadius: 20 }}>
                <X size={20} color="#D4B570" />
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
                      paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 181, 112, 0.1)',
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: pressed ? 'rgba(212, 181, 112, 0.05)' : 'transparent'
                    })}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#FDFBF7', fontFamily: quranFont }}>{item.nameAr}</Text>
                    <View style={{ backgroundColor: 'rgba(212, 181, 112, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212, 181, 112, 0.3)' }}>
                      <Text style={{ fontSize: 12, color: '#D4B570', fontWeight: '800' }}>صفحة {targetPage}</Text>
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
  headerWrap: {
    paddingTop: 6,
    paddingBottom: 0,
    zIndex: 10,
  },
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
  // 👆 منطقتي اللمس للتنقّل بين الصفحات (شفافة - بدون أزرار مرئية)
  swipeZoneRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 60,
    zIndex: 100,
    // فيه backgroundColor شفّاف للديباغ:
    // backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  swipeZoneLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 60,
    zIndex: 100,
    // backgroundColor: 'rgba(255, 0, 0, 0.1)',
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
  footerWrap: {
    paddingTop: 0,
    paddingBottom: 6,
    zIndex: 10,
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
