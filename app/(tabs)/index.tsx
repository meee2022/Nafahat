/**
 * الصفحة الرئيسية - تصميم مستوحى من "المصلي"
 * Hero (مسجد + وقت الصلاة) -> شريط أوقات الصلاة -> شبكة الميزات الأساسية
 */

import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, useWindowDimensions, Image, Platform } from 'react-native';
import { useResponsive } from '@hooks/useResponsive';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Bell, Search, MapPin, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { IllMushaf, IllAdhkar, IllTasbeeh, IllQibla, IllMosques, IllCalendar, IllDuas, IllTajweed, IllKhatma, IllZakat, IllStats, IllMemo, IllAudio, IllHadith, IllNotes, IllAchievements, IllArticles } from '@components/illustrations';
import { useSettingsStore } from '@store/index';
import { useT, useLanguage } from '@store/languageStore';
import { calculatePrayerTimes, nextPrayer, PRAYER_NAMES_AR, PrayerName } from '@services/prayerTimes';
import { SectionHeading, DailyActionCard, computeDailyAction } from '@components/home';
import { useWirdStore, useMemoStore } from '@store/index';
import { useAuthStore } from '@store/authStore';
import { getDueTasks } from '@services/memorization';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogIn, Cloud } from 'lucide-react-native';

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const HeroCountdown = ({ nextP, todayPrayers, cityName }: { nextP: any, todayPrayers: any, cityName: string }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const tr = useT();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const countdownText = useMemo(() => {
    const [h, m] = nextP.time.split(':').map(Number);
    const target = new Date(currentTime);
    target.setHours(h, m, 0, 0);
    if (target.getTime() < currentTime.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const diff = Math.floor((target.getTime() - currentTime.getTime()) / 1000);
    if (diff <= 0) return '00:00:00';
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [nextP, currentTime]);

  return (
    <View style={styles.countdownContainer}>
      <Text style={styles.nextPrayerText}>{PRAYER_NAMES_AR[nextP.name as PrayerName]} {tr('home.heroNextSuffix')}</Text>
      <Text style={styles.countdownTime}>{countdownText}</Text>
      <Pressable
        style={styles.locationBadge}
        onPress={() => router.push('/location')}
        accessibilityLabel="غيّر الموقع"
      >
        <MapPin size={14} color="#FFF" />
        <Text style={styles.locationText}>{cityName}</Text>
      </Pressable>
    </View>
  );
};

export default function HomeScreen() {
  const t = useTheme();
  const tr = useT();
  const { lang } = useLanguage();
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const r = useResponsive();
  const location = useSettingsStore((s) => s.location);
  const isPremium = useSettingsStore((s) => s.isPremium);
  const authStatus = useAuthStore((s) => s.status);
  const isGuest = authStatus === 'guest' || authStatus === 'unknown';
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // No more 1-second interval here!
  // We use a fixed 'now' for the initial calculations for the current day.
  // The ticking countdown is handled inside HeroCountdown.
  const now = new Date();

  const isToday = useMemo(() => isSameDay(selectedDate, now), [selectedDate, now]);

  const prayerAdjustments = useSettingsStore((s) => s.prayerAdjustments);
  const todayPrayers = useMemo(() => {
    return calculatePrayerTimes({
      date: selectedDate,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
      method: 'Makkah',
      adjustments: prayerAdjustments,
    });
  }, [selectedDate, location, prayerAdjustments]);

  const nextP = useMemo(() => nextPrayer(todayPrayers, now), [todayPrayers, now]);

  const dateLocale = lang === 'ar' ? 'ar-EG' : `${lang}-u-ca-gregory`;
  const hijriLocale = lang === 'ar' ? 'ar-SA-u-ca-islamic' : `${lang}-u-ca-islamic`;

  const dateString = useMemo(() => {
    try {
      const hijri = new Intl.DateTimeFormat(hijriLocale, {
        day: 'numeric', month: 'long', year: 'numeric'
      }).format(selectedDate);
      const greg = new Intl.DateTimeFormat(dateLocale, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(selectedDate);
      return `${greg}  |  ${hijri}`;
    } catch {
      return selectedDate.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  }, [selectedDate, dateLocale, hijriLocale]);

  const shiftDay = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setSelectedDate(next);
  };

  const cityName = lang === 'ar' ? location.cityAr : location.cityEn;

  const mainFeatures = [
    { id: 'mushaf',   title: tr('feature.mushaf'),   icon: <IllMushaf  size={68} />, path: '/mushaf' },
    { id: 'adhkar',   title: tr('dhikr.adhkar'),     icon: <IllAdhkar  size={68} />, path: '/adhkar' },
    { id: 'qibla',    title: tr('tool.qibla'),       icon: <IllQibla   size={68} />, path: '/qibla' },
    { id: 'tasbeeh',  title: tr('dhikr.tasbeeh'),    icon: <IllTasbeeh size={68} />, path: '/tasbeeh' },
    { id: 'duas',     title: tr('dhikr.duas'),       icon: <IllDuas    size={68} />, path: '/duas' },
    { id: 'calendar', title: tr('tool.calendar'),    icon: <IllCalendar size={68} />, path: '/calendar' },
  ];

  const quranFeatures = [
    { id: 'memo',     title: tr('feature.memo'),   icon: <IllMemo     size={68} />, path: '/memorization' },
    { id: 'audio',    title: tr('feature.audio'),  icon: <IllAudio    size={68} />, path: '/reciters' },
    { id: 'khatma',   title: tr('tool.khatma'),    icon: <IllKhatma   size={68} />, path: '/khatma' },
    { id: 'tajweed',  title: tr('learn.tajweed'),  icon: <IllTajweed  size={68} />, path: '/tajweed' },
    { id: 'hadith',   title: 'الأحاديث',           icon: <IllHadith   size={68} />, path: '/hadith' },
    { id: 'articles', title: 'المقالات',           icon: <IllArticles size={68} />, path: '/articles' },
    { id: 'manaa',    title: 'مناعة إيمانية',       icon: <IllAdhkar   size={68} />, path: '/manaa' },
  ];

  const extraFeatures = [
    { id: 'mosques', title: tr('tool.mosques'),       icon: <IllMosques size={68} />, path: '/mosques' },
    { id: 'zakat',   title: tr('tool.zakatShort'),    icon: <IllZakat   size={68} />, path: '/zakat' },
    { id: 'quiz',    title: tr('home.featureQuiz'),   icon: <IllAchievements size={68} />, path: '/quiz' },
    { id: 'notes',   title: tr('home.featureNotes'),  icon: <IllNotes        size={68} />, path: '/notes' },
  ];

  const renderGrid = (items: any[]) => (
    <View style={styles.gridContainer}>
      {items.map((f) => (
        <Pressable
          key={f.id}
          accessibilityRole="button"
          accessibilityLabel={f.title}
          accessibilityHint={`افتح ${f.title}`}
          style={({ pressed }) => [
            styles.featureCard,
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => router.push(f.path as any)}
        >
          {f.icon}
          <Text style={[styles.featureText, { color: t.colors.textPrimary }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{f.title}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingBottom: 100 },
          r.isWide && { alignItems: 'center' },
        ]}
      >
        {/* wrapper لتقييد العرض على الشاشات العريضة */}
        <View style={r.isWide ? { width: '100%', maxWidth: r.contentMaxWidth } : undefined}>
        
        {/* 1. Hero Section - مستوحى من المصلي */}
        <View style={[styles.hero, { paddingTop: Math.max(insets.top, 20), height: Math.min(380, screenHeight * 0.45) }]}>
          {/* خلفية متدرّجة + نقش هندسي ذهبي */}
          <LinearGradient
            colors={[t.colors.primary, '#0F4A41', '#062825']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.18 }]} pointerEvents="none">
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
          {/* إطار ذهبي رفيع داخلي */}
          <View pointerEvents="none" style={styles.heroFrame} />

          {/* Header Icons */}
          <View style={styles.heroHeader}>
            <View style={styles.heroHeaderLeft}>
              <Pressable
                style={styles.iconBtn}
                onPress={() => router.push('/notifications')}
                accessibilityRole="button"
                accessibilityLabel="الإشعارات"
              >
                <Bell size={20} color="#FFF" />
              </Pressable>
            </View>
            <View style={styles.heroHeaderCenter}>
              {isGuest ? (
                <Pressable
                  onPress={() => router.push('/login')}
                  style={({ pressed }) => [
                    styles.signInPill,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <LogIn size={13} color="#D4B570" strokeWidth={2.2} />
                  <Text style={styles.signInPillText}>تسجيل دخول</Text>
                </Pressable>
              ) : isPremium ? (
                <Text style={styles.premiumBadge}>{tr('home.premiumBadge')}</Text>
              ) : (
                <Pressable
                  onPress={() => router.push('/cloud-sync')}
                  style={({ pressed }) => [
                    styles.syncedPill,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  hitSlop={8}
                >
                  <Cloud size={12} color="#7FE3B4" strokeWidth={2.4} />
                  <Text style={styles.syncedPillText}>متزامن</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.heroHeaderRight}>
              <Pressable
                style={styles.iconBtn}
                onPress={() => router.push('/search')}
                accessibilityRole="button"
                accessibilityLabel="بحث"
              >
                <Search size={20} color="#FFF" />
              </Pressable>
            </View>
          </View>

          {/* Countdown Component */}
          <HeroCountdown nextP={nextP} todayPrayers={todayPrayers} cityName={cityName} />

          {/* Mosque Illustration */}
          <View style={styles.mosqueIllustrationContainer}>
            <IllMosques size={160} />
            <LinearGradient
              colors={['transparent', 'rgba(6, 40, 37, 0.9)']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>
        </View>

        {/* 2. Prayer Times Strip */}
        <View style={[styles.prayerStrip, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => shiftDay(-1)}
              hitSlop={15}
              style={styles.dateNavBtn}
              accessibilityRole="button"
              accessibilityLabel="اليوم السابق"
            >
              <ChevronRight size={20} color={t.colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => setSelectedDate(new Date())}
              style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}
              accessibilityRole="button"
              accessibilityLabel="عُد لليوم الحالي"
            >
              <Text
                style={{ color: t.colors.textPrimary, fontWeight: '700', fontSize: 12, textAlign: 'center', lineHeight: 17 }}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {dateString}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => shiftDay(1)}
              hitSlop={15}
              style={styles.dateNavBtn}
              accessibilityRole="button"
              accessibilityLabel="اليوم التالي"
            >
              <ChevronLeft size={20} color={t.colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.timesRow}>
            {(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerName[]).map((pKey) => {
              const isActive = isToday && nextP.name === pKey;
              return (
                <View key={pKey} style={[styles.timeItem, isActive && { backgroundColor: t.colors.primary }]}>
                  <Text style={[styles.timeName, isActive && { color: '#FFF' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{PRAYER_NAMES_AR[pKey]}</Text>
                  <Text style={[styles.timeValue, isActive && { color: '#FFF' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                    {todayPrayers[pKey]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* بطاقة "مهمة اليوم" - ديناميكية حسب الوقت + حالة المستخدم */}
        <View style={{ marginTop: 8 }}>
          <DailyAction />
        </View>

        {/* 3. Main Features */}
        <View style={{ marginTop: 16 }}>
          <SectionHeading eyebrow={tr('home.sectionEssentialsEyebrow')} title={tr('home.sectionEssentialsTitle')} />
          {renderGrid(mainFeatures)}
        </View>

        {/* 4. Quran Sciences */}
        <View style={{ marginTop: 24 }}>
          <SectionHeading eyebrow={tr('home.sectionQuranEyebrow')} title={tr('home.sectionQuranTitle')} />
          {renderGrid(quranFeatures)}
        </View>

        {/* 5. Extra Services */}
        <View style={{ marginTop: 24 }}>
          <SectionHeading eyebrow={tr('home.sectionExtraEyebrow')} title={tr('home.sectionExtraTitle')} />
          {renderGrid(extraFeatures)}
        </View>

        </View>{/* end wide wrapper */}
      </ScrollView>
    </View>
  );
}

// ─────────────── بطاقة "مهمة اليوم" ───────────────
const DailyAction: React.FC = () => {
  const router = useRouter();
  const { pagesReadToday, dailyTarget } = useWirdStore();
  const tasks = useMemoStore((s) => s.tasks);

  const reviewsDue = getDueTasks(tasks).length;
  const action = computeDailyAction({
    pagesReadToday,
    pageGoal: dailyTarget,
    reviewsDue,
  });

  const handlePress = () => {
    switch (action.id) {
      case 'morning-adhkar':
        router.push('/adhkar/morning'); break;
      case 'evening-adhkar':
        router.push('/adhkar/evening'); break;
      case 'night-reflect':
        router.push('/ayah-of-day'); break;
      case 'review':
        router.push('/review'); break;
      case 'wird':
        router.push('/wird'); break;
      default:
        router.push('/reciters');
    }
  };

  return <DailyActionCard action={action} onPress={handlePress} />;
};

const styles = StyleSheet.create({
  hero: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  heroFrame: {
    position: 'absolute',
    top: 12, bottom: 12, left: 12, right: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.25)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    zIndex: 10,
  },
  heroHeaderLeft: { flex: 1, alignItems: 'flex-start' },
  heroHeaderCenter: { flex: 2, alignItems: 'center' },
  heroHeaderRight: { flex: 1, alignItems: 'flex-end' },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumBadge: {
    color: '#F5C76A',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  signInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 181, 112, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.5)',
  },
  signInPillText: {
    color: '#D4B570',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  syncedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(127, 227, 180, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(127, 227, 180, 0.4)',
  },
  syncedPillText: {
    color: '#7FE3B4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: 20,
    zIndex: 10,
  },
  nextPrayerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 6,
    textAlign: 'center',
  },
  countdownTime: {
    color: '#F5C76A',
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroLogoWrap: {
    alignItems: 'center',
    marginTop: 6,
    zIndex: 10,
  },
  heroLogo: {
    width: 140,
    height: 140,
  },
  mosqueIllustrationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.7,
  },
  prayerStrip: {
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateNavBtn: {
    padding: 6,
    borderRadius: 999,
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  timeItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 10,
    flex: 1,
    minWidth: 0,
  },
  timeName: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 0, 
  },
  featureCard: {
    width: '33.33%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
  },
  featureText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
