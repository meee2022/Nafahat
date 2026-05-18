/**
 * 📖 الـ Home الجديد - Mushaf-first landing.
 *
 * هوية Nafahat الرسمية: أخضر زمردي primary + ذهبي accent.
 *  - Hero أخضر premium بـ "كمّل قراءتك" (مش dashboard generic)
 *  - بطاقة مهمة اليوم (DailyActionCard - يعاد استخدامها)
 *  - اختصارات المكتبة (Bookmarks/Favorites/Notes)
 *  - تصفّح المصحف (الفهرس/الأجزاء/القرّاء)
 *  - آية اليوم card صغيرة
 *
 * الفلسفة:
 *  - التطبيق يفتح على المصحف كهوية، مش على dashboard إسلامي عام
 *  - Continue Reading هو الـ #1 action
 *  - الـ Daily ritual (الصلاة/الأذكار) في tab منفصل اسمه "اليومي"
 *  - الـ Tools (قبلة/تسبيح/حساب) في tab الـ Account تحت "أدوات"
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Search, Bookmark, Heart, FileText, BookOpen, Layers, Mic2, ChevronLeft, Play, Wrench } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useT, useLanguage } from '@store/languageStore';
import { useReadingStore, useWirdStore, useMemoStore } from '@store/index';
import { getSurahById, arabicNumber } from '@data/surahs';
import { DailyActionCard, computeDailyAction, SectionHeading } from '@components/home';
import { getDueTasks } from '@services/memorization';
import { FEATURED_AYAHS } from '@data/featuredAyahs';

export default function MushafHomeScreen() {
  const t = useTheme();
  const tr = useT();
  const { lang } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const lastRead = useReadingStore((s) => s.lastRead);
  const bookmarks = useReadingStore((s) => s.bookmarks);
  const favorites = useReadingStore((s) => s.favorites);
  const { pagesReadToday, dailyTarget } = useWirdStore();
  const tasks = useMemoStore((s) => s.tasks);

  // 🟢 آخر قراءة — الـ hero الأساسي
  const lastSurah = useMemo(() => lastRead ? getSurahById(lastRead.surahId) : null, [lastRead]);

  // 📿 آية اليوم
  const todayAyah = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return FEATURED_AYAHS[dayOfYear % FEATURED_AYAHS.length];
  }, []);

  // 🎯 المهمة اليومية (موجود من قبل)
  const dailyAction = useMemo(() => {
    const reviewsDue = getDueTasks(tasks).length;
    return computeDailyAction({
      pagesReadToday,
      pageGoal: dailyTarget,
      reviewsDue,
    });
  }, [pagesReadToday, dailyTarget, tasks]);

  const handleDailyAction = () => {
    switch (dailyAction.id) {
      case 'morning-adhkar':  router.push('/adhkar/morning'); break;
      case 'evening-adhkar':  router.push('/adhkar/evening'); break;
      case 'night-reflect':   router.push('/ayah-of-day'); break;
      case 'review':          router.push('/review'); break;
      case 'wird':            router.push('/wird'); break;
      default:                router.push('/daily');
    }
  };

  const handleContinue = () => {
    if (lastRead && lastSurah) {
      router.push(`/surah/${lastRead.surahId}?page=${lastRead.page}` as any);
    } else {
      router.push('/surah/1' as any);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ═════════════ HERO: Continue Reading — أخضر premium ═════════════ */}
        <View style={[styles.hero, { paddingTop: Math.max(insets.top, 20) }]}>
          {/* gradient أخضر زمردي (هوية Nafahat الرسمية) */}
          <LinearGradient
            colors={[t.colors.primary, '#0F4A41', '#062825']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* نقش هندسي ذهبي خفيف (signature Nafahat) */}
          <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.14 }]} pointerEvents="none">
            <Defs>
              <Pattern id="home-hero-bg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <Path
                  d="M20,4 L24,16 L36,20 L24,24 L20,36 L16,24 L4,20 L16,16 Z"
                  fill="none" stroke="#C9A961" strokeWidth={0.5}
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#home-hero-bg)" />
          </Svg>
          {/* إطار ذهبي رفيع */}
          <View pointerEvents="none" style={styles.heroFrame} />

          {/* Top bar: branding + search */}
          <View style={styles.heroHeader}>
            <View style={styles.heroBranding}>
              <Text style={styles.brandingText}>نَفَحات</Text>
              <View style={styles.brandingRule} />
              <Text style={styles.brandingSubtext}>المصحف الذي يستحقّه القرآن</Text>
            </View>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/search')} accessibilityLabel="بحث">
              <Search size={20} color="#FFF" />
            </Pressable>
          </View>

          {/* Continue Reading card */}
          <View style={styles.continueWrap}>
            <Text style={styles.continueEyebrow}>
              {lastRead ? 'كمّل قراءتك' : 'ابدأ القراءة'}
            </Text>
            <Text style={styles.continueTitle}>
              {lastSurah ? `سورة ${lastSurah.nameAr}` : 'سورة الفاتحة'}
            </Text>
            {lastRead ? (
              <Text style={styles.continueSubtitle}>
                الصفحة {arabicNumber(lastRead.page)} · الآية {arabicNumber(lastRead.ayahNumber)}
              </Text>
            ) : (
              <Text style={styles.continueSubtitle}>افتح المصحف لأول مرة</Text>
            )}
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [styles.continueBtn, { opacity: pressed ? 0.88 : 1 }]}
              accessibilityLabel="تابع القراءة"
            >
              <Play size={16} color="#0A1815" fill="#0A1815" />
              <Text style={styles.continueBtnText}>تابع القراءة</Text>
            </Pressable>
          </View>
        </View>

        {/* ═════════════ مهمة اليوم ═════════════ */}
        <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
          <DailyActionCard action={dailyAction} onPress={handleDailyAction} />
        </View>

        {/* ═════════════ المكتبة — اختصارات سريعة ═════════════ */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <SectionHeading eyebrow="مكتبتك" title="ما حفظته من المصحف" />
          <View style={styles.libraryRow}>
            <LibraryChip
              icon={<Bookmark size={20} color={t.colors.accent} />}
              label="المرجعيات"
              count={bookmarks.length}
              onPress={() => router.push('/favorites')}
              t={t}
            />
            <LibraryChip
              icon={<Heart size={20} color={t.colors.accent} />}
              label="المفضّلة"
              count={favorites.length}
              onPress={() => router.push('/favorites')}
              t={t}
            />
            <LibraryChip
              icon={<FileText size={20} color={t.colors.accent} />}
              label="ملاحظاتي"
              count={undefined}
              onPress={() => router.push('/notes')}
              t={t}
            />
          </View>
        </View>

        {/* ═════════════ تصفّح المصحف ═════════════ */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <SectionHeading eyebrow="المصحف" title="تصفّح القرآن" />
          <View style={styles.navGrid}>
            <NavCard
              icon={<BookOpen size={26} color={t.colors.primary} />}
              title="الفهرس"
              subtitle="١١٤ سورة"
              onPress={() => router.push('/mushaf')}
              t={t}
            />
            <NavCard
              icon={<Layers size={26} color={t.colors.primary} />}
              title="الأجزاء"
              subtitle="٣٠ جزء"
              onPress={() => router.push('/mushaf' as any)}
              t={t}
            />
            <NavCard
              icon={<Mic2 size={26} color={t.colors.primary} />}
              title="القرّاء"
              subtitle="٢٤ قارئ"
              onPress={() => router.push('/reciters' as any)}
              t={t}
            />
          </View>
        </View>

        {/* ═════════════ اكتشف الأدوات ═════════════ */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <Pressable
            onPress={() => router.push('/tools')}
            style={({ pressed }) => [
              styles.toolsBanner,
              {
                backgroundColor: t.colors.surface,
                borderColor: t.colors.borderGold,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="افتح صفحة الأدوات"
          >
            <View style={[styles.toolsIconBox, { backgroundColor: t.colors.primarySoft, borderColor: t.colors.borderGold }]}>
              <Wrench size={20} color={t.colors.primary} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={{ color: t.colors.textPrimary, fontWeight: '800', fontSize: 14 }}>الأدوات والمزيد</Text>
              <Text style={{ color: t.colors.textTertiary, fontSize: 12, marginTop: 2 }}>
                القبلة · التسبيح · الزكاة · المساجد · التحديات
              </Text>
            </View>
            <ChevronLeft size={18} color={t.colors.accent} />
          </Pressable>
        </View>

        {/* ═════════════ آية اليوم ═════════════ */}
        {todayAyah ? (
          <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
            <SectionHeading eyebrow="تأمّل" title="آية اليوم" />
            <Pressable
              onPress={() => router.push(`/surah/${todayAyah.surahId}?ayah=${todayAyah.number}` as any)}
              style={({ pressed }) => [
                styles.ayahCard,
                {
                  backgroundColor: t.colors.surface,
                  borderColor: t.colors.borderGold,
                  opacity: pressed ? 0.92 : 1,
                  shadowColor: t.colors.shadowColor,
                },
              ]}
            >
              <Text style={[styles.ayahText, { color: t.colors.textPrimary, fontFamily: t.fontFamilies.arabicQuran }]} numberOfLines={3}>
                {todayAyah.text}
              </Text>
              <View style={[styles.ayahRule, { backgroundColor: t.colors.borderGold }]} />
              <View style={styles.ayahFooter}>
                <Text style={[styles.ayahRef, { color: t.colors.accent }]}>
                  سورة {todayAyah.surahName} · الآية {arabicNumber(todayAyah.number)}
                </Text>
                <ChevronLeft size={16} color={t.colors.accent} />
              </View>
            </Pressable>
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

// ─────────────── المكوّنات الفرعية ───────────────

const LibraryChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  count: number | undefined;
  onPress: () => void;
  t: any;
}> = ({ icon, label, count, onPress, t }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.libraryChip,
      {
        backgroundColor: t.colors.surface,
        borderColor: t.colors.borderGold,
        opacity: pressed ? 0.85 : 1,
      },
    ]}
  >
    {icon}
    <Text style={{ color: t.colors.textPrimary, fontWeight: '700', fontSize: 12, marginTop: 6 }}>{label}</Text>
    {count !== undefined ? (
      <Text style={{ color: t.colors.textTertiary, fontSize: 10, marginTop: 2 }}>{arabicNumber(count)}</Text>
    ) : null}
  </Pressable>
);

const NavCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  t: any;
}> = ({ icon, title, subtitle, onPress, t }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.navCard,
      {
        backgroundColor: t.colors.surface,
        borderColor: t.colors.borderGold,
        opacity: pressed ? 0.88 : 1,
        shadowColor: t.colors.shadowColor,
      },
    ]}
  >
    <View style={[styles.navCardIconBox, { backgroundColor: t.colors.primarySoft, borderColor: t.colors.borderGold }]}>
      {icon}
    </View>
    <Text style={{ color: t.colors.textPrimary, fontWeight: '800', fontSize: 14, marginTop: 10 }}>{title}</Text>
    <Text style={{ color: t.colors.textTertiary, fontSize: 11, marginTop: 2 }}>{subtitle}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  // ════ HERO ════
  hero: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    paddingBottom: 28,
  },
  heroFrame: {
    position: 'absolute',
    top: 12, bottom: 12, left: 12, right: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.28)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    zIndex: 10,
  },
  heroBranding: {
    flex: 1,
  },
  brandingText: {
    color: '#D4B570',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandingRule: {
    width: 28,
    height: 1,
    backgroundColor: 'rgba(212, 181, 112, 0.6)',
    marginVertical: 4,
  },
  brandingSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.35)',
  },
  // ════ Continue Reading inside hero ════
  continueWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 32,
  },
  continueEyebrow: {
    color: '#D4B570',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  continueTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  continueSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: '#D4B570',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: '#0A1815',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // ════ Library row ════
  libraryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  libraryChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  // ════ Navigation grid ════
  navGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  navCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  navCardIconBox: {
    width: 52, height: 52,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  // ════ Tools banner ════
  toolsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  toolsIconBox: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  // ════ Ayah of day ════
  ayahCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  ayahText: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'center',
  },
  ayahRule: {
    height: 1,
    marginVertical: 12,
    opacity: 0.5,
  },
  ayahFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ayahRef: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
