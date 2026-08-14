/**
 * 📿 شاشة الأذكار - تصميم بطاقات قرآنية أنيقة بهوية التطبيق.
 *
 * مميزات التصميم:
 *   - خط قرآني واضح ومريح للقراءة (KFGQPC Hafs / Amiri Quran)
 *   - تباعد سخيّ بين السطور
 *   - زخرفة ذهبية فوق كل ذكر
 *   - عدّاد دائري كبير على الجانب
 *   - شارات للمصدر والفضل بتصميم نظيف
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Platform, Alert, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, RotateCcw, ListFilter, BookOpen, BookOpenCheck, Sparkles, Play, Pause, ExternalLink, Headphones, ChevronLeft, ChevronRight, Rows3, Focus } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader, ProgressBar } from '@components/ui';
import { QuranicBlock } from '@components/common';
import { ALL_ADHKAR, DHIKR_CATEGORIES } from '@data/adhkar';
import { useSafeBack } from '@/utils/navigation';
import { arabicNumber } from '@data/surahs';
import { DhikrItem } from '@/types/index';
import { ADHKAR_AUDIO } from '@data/adhkarAudio';
import { loadAndPlay, setPlaying, unload } from '@services/audioPlayer';
import { Asset } from 'expo-asset';

const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

/** Keeps Arabic alignment stable when a dhikr begins with punctuation or a number. */
const rtlText = (value: string) => value.startsWith('\u200F') ? value : `\u200F${value}`;

export default function AdhkarScreen() {
  const t = useTheme();
  const router = useRouter();
  // ⚠️ يرجع للأذكار لو فُتحت كأول صفحة (deep-link)، وإلا يستخدم history.
  const goBack = useSafeBack('/adhkar');
  const { category } = useLocalSearchParams<{ category: string }>();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [audioProgress, setAudioProgress] = useState({ position: 0, duration: 0 });
  const [viewMode, setViewMode] = useState<'focus' | 'all'>('focus');
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const startedHere = useRef(false);

  const cat = useMemo(() => DHIKR_CATEGORIES.find((c) => c.id === category) ?? DHIKR_CATEGORIES[0], [category]);
  const items = useMemo<DhikrItem[]>(() => {
    const filtered = ALL_ADHKAR.filter((d) => d.category === cat.id);
    if (cat.id !== 'sleep') return filtered;
    const sleepOrder = ['sleep-2', 'sleep-3', 'sleep-4', 'sleep-1', 'sleep-11', 'sleep-10', 'sleep-8', 'sleep-5', 'sleep-6', 'sleep-7', 'sleep-12', 'sleep-sajdah', 'sleep-mulk', 'sleep-13', 'sleep-9'];
    return [...filtered].sort((a, b) => sleepOrder.indexOf(a.id) - sleepOrder.indexOf(b.id));
  }, [cat.id]);
  const audioTrack = ADHKAR_AUDIO[cat.id];
  const visibleItems = viewMode === 'focus' ? items.slice(activeIndex, activeIndex + 1) : items;

  useEffect(() => () => {
    if (startedHere.current) unload().catch(() => {});
  }, []);

  useEffect(() => {
    if (!startedHere.current) return;
    unload().catch(() => {});
    startedHere.current = false;
    setAudioState('idle');
    setAudioProgress({ position: 0, duration: 0 });
  }, [cat.id]);

  useEffect(() => {
    setActiveIndex(0);
    setDetailsOpen(false);
  }, [cat.id]);

  const toggleAudio = async () => {
    if (!audioTrack || audioState === 'loading') return;
    try {
      if (audioState === 'playing') {
        await setPlaying(false);
        setAudioState('paused');
        return;
      }
      if (audioState === 'paused') {
        await setPlaying(true);
        setAudioState('playing');
        return;
      }
      setAudioState('loading');
      startedHere.current = true;
      const bundledAudio = Asset.fromModule(audioTrack.assetModule);
      await bundledAudio.downloadAsync();
      const playableUri = bundledAudio.localUri ?? bundledAudio.uri ?? audioTrack.url;
      await loadAndPlay(playableUri, (status) => {
        setAudioProgress({ position: status.positionMs, duration: status.durationMs });
        if (status.didJustFinish) {
          setAudioState('idle');
          setAudioProgress({ position: 0, duration: status.durationMs });
          startedHere.current = false;
        } else {
          setAudioState(status.isPlaying ? 'playing' : 'paused');
        }
      });
    } catch {
      startedHere.current = false;
      setAudioState('idle');
      Alert.alert('تعذّر تشغيل الأذكار', 'أغلق المشغّل وحاول مرة أخرى. ملفات الصوت محفوظة داخل التطبيق ولا تحتاج إلى الإنترنت.');
    }
  };

  const completed = items.filter((it) => (counts[it.id] ?? 0) >= it.count).length;
  const overallProgress = items.length > 0 ? completed / items.length : 0;

  const increment = (id: string, max: number) => {
    setCounts((c) => ({ ...c, [id]: Math.min((c[id] ?? 0) + 1, max) }));
  };

  const reset = (id: string) => {
    setCounts((c) => ({ ...c, [id]: 0 }));
  };

  // 🕌 خط قرآني مريح للقراءة
  const quranFont = Platform.OS === 'web'
    ? '"KFGQPC Uthmanic Hafs", "Scheherazade New", "Amiri Quran", serif'
    : t.fontFamilies.arabicQuran;

  return (
    <Screen scrollToTopKey={viewMode === 'focus' ? activeIndex : 'all'}>
      <AppHeader onBack={goBack} title={cat.titleAr} subtitle={`${arabicNumber(items.length)} ذكر`} />

      {/* تقدم عام */}
      <Card padding={t.spacing.lg} elevation="xs">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text variant="subtitle">تقدمك في الأذكار</Text>
          <Text variant="label" color={t.colors.accent}>{Math.round(overallProgress * 100)}%</Text>
        </View>
        <ProgressBar value={overallProgress} color={t.colors.accent} height={8} />
        <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 6 }}>
          أكملت {arabicNumber(completed)} من {arabicNumber(items.length)}
        </Text>
      </Card>

      <View style={[styles.readerSwitch, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.borderGold }]}> 
        <Pressable
          onPress={() => setViewMode('focus')}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === 'focus' }}
          style={[styles.readerSwitchItem, viewMode === 'focus' && { backgroundColor: t.colors.primary }]}
        >
          <Focus size={16} color={viewMode === 'focus' ? t.colors.accent : t.colors.textSecondary} />
          <Text style={[styles.readerSwitchText, { color: viewMode === 'focus' ? t.colors.onPrimary : t.colors.textSecondary }]}>قراءة مركّزة</Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('all')}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === 'all' }}
          style={[styles.readerSwitchItem, viewMode === 'all' && { backgroundColor: t.colors.primary }]}
        >
          <Rows3 size={16} color={viewMode === 'all' ? t.colors.accent : t.colors.textSecondary} />
          <Text style={[styles.readerSwitchText, { color: viewMode === 'all' ? t.colors.onPrimary : t.colors.textSecondary }]}>عرض الكل</Text>
        </Pressable>
      </View>

      {viewMode === 'focus' ? (
        <View style={styles.focusPosition}>
          <Text variant="caption" color={t.colors.textTertiary}>الذكر {arabicNumber(activeIndex + 1)} من {arabicNumber(items.length)}</Text>
          <View style={[styles.focusPositionLine, { backgroundColor: t.colors.divider }]}> 
            <View style={{ height: '100%', borderRadius: 2, backgroundColor: t.colors.accent, width: `${items.length ? ((activeIndex + 1) / items.length) * 100 : 0}%` }} />
          </View>
        </View>
      ) : null}

      {audioTrack ? (
        <View style={[styles.audioCard, { backgroundColor: t.colors.primary, borderColor: t.colors.accent }]}>
          <View style={styles.audioHeading}>
            <View style={[styles.audioIcon, { backgroundColor: t.colors.accent + '22' }]}>
              <Headphones size={20} color={t.colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.onPrimary, fontSize: 16, fontWeight: '800' }}>استمع وردّد الأذكار</Text>
              <Text style={{ color: t.colors.onPrimary, opacity: 0.7, fontSize: 12, marginTop: 4 }}>{audioTrack.title}، بصوت {audioTrack.reciter}</Text>
            </View>
            <Pressable
              onPress={toggleAudio}
              accessibilityRole="button"
              accessibilityLabel={audioState === 'playing' ? 'إيقاف الأذكار مؤقتاً' : 'تشغيل الأذكار صوتياً'}
              style={({ pressed }) => [styles.audioPlay, { backgroundColor: t.colors.accent, opacity: pressed ? 0.82 : 1 }]}
            >
              {audioState === 'loading' ? <ActivityIndicator color={t.colors.primary} /> : audioState === 'playing' ? <Pause size={22} color={t.colors.primary} fill={t.colors.primary} /> : <Play size={22} color={t.colors.primary} fill={t.colors.primary} />}
            </Pressable>
          </View>
          <View style={styles.audioProgressTrack}>
            <View style={[styles.audioProgressFill, { backgroundColor: t.colors.accent, width: `${audioProgress.duration ? Math.min(100, (audioProgress.position / audioProgress.duration) * 100) : 0}%` }]} />
          </View>
          <View style={styles.audioMeta}>
            <Text style={styles.audioTime}>{formatTime(audioProgress.position)} / {audioProgress.duration ? formatTime(audioProgress.duration) : '--:--'}</Text>
            <Pressable onPress={() => Linking.openURL(audioTrack.sourcePage)} accessibilityRole="link" style={styles.sourceLink}>
              <Text style={{ color: t.colors.accent, fontSize: 11, fontWeight: '700' }}>{audioTrack.source}</Text>
              <ExternalLink size={11} color={t.colors.accent} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* زر للعودة لكل الفئات */}
      {viewMode === 'all' ? <Pressable
        onPress={() => router.push('/adhkar')}
        accessibilityRole="button"
        accessibilityLabel="استعرض كل تصنيفات الأذكار"
        style={({ pressed }) => [
          styles.allCategoriesBtn,
          {
            backgroundColor: t.colors.surfaceAlt,
            borderColor: t.colors.borderGold,
            marginTop: t.spacing.lg,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <ListFilter size={16} color={t.colors.accentDeep} strokeWidth={1.8} />
        <Text variant="bodySm" color={t.colors.accentDeep} style={{ fontWeight: '700', flex: 1 }}>
          استعرض كل تصنيفات الأذكار
        </Text>
        <Text variant="caption" color={t.colors.textTertiary}>
          {arabicNumber(DHIKR_CATEGORIES.length)} تصنيف
        </Text>
      </Pressable> : null}

      {/* قائمة الأذكار */}
      <View style={{ gap: 16, marginTop: t.spacing.lg }}>
        {visibleItems.map((d, visibleIndex) => {
          const idx = viewMode === 'focus' ? activeIndex : visibleIndex;
          const current = counts[d.id] ?? 0;
          const done = current >= d.count;
          const progress = d.count > 0 ? current / d.count : 0;

          return (
            <View
              key={d.id}
              style={[
                styles.dhikrCard,
                {
                  backgroundColor: done ? t.colors.successSurface : t.colors.surface,
                  borderColor: done ? t.colors.success + '50' : t.colors.borderGold,
                },
              ]}
            >
                {/* شريط رقم الذكر + الفضل (لو موجود) في الأعلى */}
                <View style={styles.cardTopBar}>
                  <View style={[styles.dhikrIndex, { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent + '50' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: t.colors.accentDeep }}>
                      {arabicNumber(idx + 1)}
                    </Text>
                  </View>
                  <Text
                    variant="subtitle"
                    style={[styles.cardTitle, { color: t.colors.textPrimary, fontFamily: quranFont }]}
                    numberOfLines={2}
                  >
                    {rtlText(d.title)}
                  </Text>
                  {done ? (
                    <View style={[styles.doneBadge, { backgroundColor: t.colors.success }]}>
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </View>
                  ) : null}
                  {!done && d.count > 1 ? (
                    <View style={[styles.repeatBadge, { borderColor: t.colors.accent + '65', backgroundColor: t.colors.accent + '12' }]}>
                      <Text style={[styles.repeatBadgeText, { color: t.colors.accentDeep }]}>{arabicNumber(d.count)} مرات</Text>
                    </View>
                  ) : null}
                </View>

                {/* نص الذكر - بأسلوب المصحف لو آية قرآنية، عادي لو دعاء */}
                {(d.quranic || /۝/.test(d.body)) ? (
                  <View style={{ marginVertical: 6 }}>
                    <QuranicBlock body={d.body} fontSize={viewMode === 'focus' ? 26 : 23} groupTitles={d.quranicGroupTitles} variant={viewMode === 'focus' ? 'bare' : 'plain'} />
                  </View>
                ) : (
                  <Text
                    style={[styles.dhikrBody, { color: t.colors.textPrimary, fontFamily: quranFont }]}
                  >
                    {rtlText(d.body)}
                  </Text>
                )}

                {d.instruction ? (
                  <View style={[styles.instructionBox, { backgroundColor: t.colors.accent + '0D', borderColor: t.colors.accent + '35' }]}>
                    <View style={styles.instructionHeading}>
                      <Sparkles size={13} color={t.colors.accentDeep} />
                      <Text style={[styles.instructionLabel, { color: t.colors.accentDeep }]}>طريقة الذكر</Text>
                    </View>
                    <Text style={[styles.instructionText, { color: t.colors.textSecondary }]}>{rtlText(d.instruction)}</Text>
                  </View>
                ) : null}

                {d.surahId ? (
                  <Pressable
                    onPress={() => router.push({ pathname: '/surah/[id]', params: { id: String(d.surahId) } })}
                    accessibilityRole="button"
                    accessibilityLabel={`فتح سورة ${d.title.replace('قراءة سورة ', '')} في المصحف`}
                    style={({ pressed }) => [
                      styles.openSurahButton,
                      {
                        backgroundColor: t.colors.primary,
                        borderColor: t.colors.accent,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <BookOpen size={17} color={t.colors.onPrimary} />
                    <Text style={[styles.openSurahLabel, { color: t.colors.onPrimary }]}>فتح {d.title.replace('قراءة ', '')} في المصحف</Text>
                  </Pressable>
                ) : null}

                {/* الفضل والمصدر - في cards صغيرة */}
                {viewMode === 'focus' && (d.benefit || d.source) ? (
                  <Pressable
                    onPress={() => setDetailsOpen((open) => !open)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: detailsOpen }}
                    style={[styles.detailsToggle, { borderColor: t.colors.divider }]}
                  >
                    <BookOpenCheck size={15} color={t.colors.accentDeep} />
                    <Text style={[styles.detailsToggleText, { color: t.colors.accentDeep }]}>{detailsOpen ? 'إخفاء المصدر والفضل' : 'عرض المصدر والفضل'}</Text>
                    <ChevronLeft size={16} color={t.colors.textTertiary} style={{ transform: [{ rotate: detailsOpen ? '-90deg' : '0deg' }] }} />
                  </Pressable>
                ) : null}

                {d.benefit && (viewMode === 'all' || detailsOpen) ? (
                  <View style={[styles.benefitBox, { backgroundColor: t.colors.accent + '08', borderColor: t.colors.accent + '30' }]}>
                    <Sparkles size={12} color={t.colors.accent} />
                    <Text style={[styles.benefitText, { color: t.colors.textSecondary }]}>
                      {rtlText(d.benefit)}
                    </Text>
                  </View>
                ) : null}

                {d.source && (viewMode === 'all' || detailsOpen) ? (
                  <View style={styles.sourceRow}>
                    <BookOpenCheck size={10} color={t.colors.textTertiary} />
                    <Text style={[styles.sourceText, { color: t.colors.textTertiary }]}>
                      {rtlText(d.source)}
                    </Text>
                  </View>
                ) : null}

                {/* شريط العدّاد - الـ Pressable الكبير اللي يزوّد العدّاد */}
                <View style={[styles.counterRow, { borderTopColor: t.colors.divider }]}>
                  <Pressable
                    onPress={() => increment(d.id, d.count)}
                    accessibilityRole="button"
                    accessibilityLabel={`${d.title} - اضغط للعدّ`}
                    style={({ pressed }) => [
                      styles.counterPressable,
                      { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
                    ]}
                  >
                    {/* العداد الكبير */}
                    <View style={[styles.counterChip, {
                      backgroundColor: done ? t.colors.success : t.colors.accent,
                    }]}>
                      <Text style={styles.counterCurrent}>{done ? 'تمّ' : `${arabicNumber(current)} من ${arabicNumber(d.count)}`}</Text>
                    </View>

                    {/* progress bar + hint */}
                    <View style={{ flex: 1 }}>
                      <ProgressBar value={progress} color={done ? t.colors.success : t.colors.accent} height={6} />
                      <Text style={[styles.tapHint, { color: t.colors.textTertiary }]}>
                        اضغط هنا للزيادة
                      </Text>
                    </View>
                  </Pressable>

                  {/* زر إعادة - شقيق منفصل (مش متداخل في Pressable الآخر) */}
                  <Pressable
                    onPress={() => reset(d.id)}
                    hitSlop={t.hitSlop}
                    accessibilityRole="button"
                    accessibilityLabel="إعادة تعيين العدّاد"
                    style={({ pressed }) => [
                      styles.resetBtn,
                      { backgroundColor: t.colors.surfaceAlt, opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <RotateCcw size={14} color={t.colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
          );
        })}
        {viewMode === 'focus' ? (
          <View style={styles.focusNav}>
            <Pressable
              disabled={activeIndex === 0}
              onPress={() => { setActiveIndex((index) => Math.max(0, index - 1)); setDetailsOpen(false); }}
              style={[styles.focusNavButton, { borderColor: t.colors.borderGold, opacity: activeIndex === 0 ? 0.35 : 1 }]}
            >
              <ChevronRight size={18} color={t.colors.accentDeep} />
              <Text style={[styles.focusNavText, { color: t.colors.textPrimary }]}>السابق</Text>
            </Pressable>
            <Pressable
              disabled={activeIndex >= items.length - 1}
              onPress={() => { setActiveIndex((index) => Math.min(items.length - 1, index + 1)); setDetailsOpen(false); }}
              style={[styles.focusNavButton, styles.focusNavPrimary, { backgroundColor: t.colors.primary, borderColor: t.colors.accent, opacity: activeIndex >= items.length - 1 ? 0.35 : 1 }]}
            >
              <Text style={[styles.focusNavText, { color: t.colors.onPrimary }]}>التالي</Text>
              <ChevronLeft size={18} color={t.colors.accent} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  readerSwitch: {
    marginTop: 14,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
  },
  readerSwitchItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  readerSwitchText: { fontSize: 13, fontWeight: '800' },
  focusPosition: { marginTop: 12, gap: 7 },
  focusPositionLine: { height: 3, borderRadius: 2, overflow: 'hidden' },
  audioCard: { marginTop: 14, borderRadius: 18, borderWidth: 1, padding: 15 },
  audioHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  audioIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  audioPlay: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  audioProgressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 14 },
  audioProgressFill: { height: '100%', borderRadius: 2 },
  audioMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  audioTime: { color: 'rgba(255,255,255,0.62)', fontSize: 10, fontVariant: ['tabular-nums'] },
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dhikrCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 17,
    direction: 'rtl',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  cardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dhikrIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'right',
    writingDirection: 'rtl',
    direction: 'rtl',
  },
  repeatBadge: {
    minHeight: 28,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadgeText: { fontSize: 11, fontWeight: '800' },
  doneBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhikrBody: {
    fontSize: 24,
    lineHeight: 46,
    textAlign: 'right',
    writingDirection: 'rtl',
    letterSpacing: 0,
    marginTop: 18,
    marginBottom: 16,
  } as any,
  instructionBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  instructionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 7,
  },
  instructionLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 25,
    textAlign: 'right',
    writingDirection: 'rtl',
    direction: 'rtl',
  } as any,
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  detailsToggle: {
    minHeight: 46,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailsToggleText: { flex: 1, fontSize: 12, fontWeight: '800' },
  benefitText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
    direction: 'rtl',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    direction: 'rtl',
  },
  openSurahButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  openSurahLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  counterPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 92,
    justifyContent: 'center',
  },
  counterCurrent: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  tapHint: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '500',
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allCategoriesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  focusNav: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  focusNavButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  focusNavPrimary: { flex: 1.25 },
  focusNavText: { fontSize: 14, fontWeight: '800' },
});
