/**
 * 🌙 تبويب "اليومي" — الطقوس الإسلامية اليومية.
 *
 * هوية Nafahat: أخضر زمردي primary + ذهبي accent. الـ surface فاتح parchment soft.
 *
 * المحتوى (مرتّب حسب الأولوية):
 *  1. Prayer Times hero (أخضر premium مع countdown + city)
 *  2. Date navigator
 *  3. Adhkar shortcuts (صباح/مساء/صلاة/نوم)
 *  4. آية اليوم
 *  5. ورد القراءة (progress)
 *  6. القبلة (سريع)
 *
 * ملاحظة: ده كان جزء من الـ Home القديم. اتقسم لـ tab مستقل عشان
 *  الـ Home الجديد يبقى Mushaf-first.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { MapPin, ChevronLeft, ChevronRight, Sun, Moon, BookOpen, Compass, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useSettingsStore, useWirdStore } from '@store/index';
import { useT, useLanguage } from '@store/languageStore';
import { calculatePrayerTimes, nextPrayer, PRAYER_NAMES_AR, PrayerName, methodForCountry } from '@services/prayerTimes';
import { SectionHeading } from '@components/home';
import { FEATURED_AYAHS } from '@data/featuredAyahs';

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const PrayerHero: React.FC<{ nextP: any; cityName: string }> = ({ nextP, cityName }) => {
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
    if (target.getTime() < currentTime.getTime()) target.setDate(target.getDate() + 1);
    const diff = Math.floor((target.getTime() - currentTime.getTime()) / 1000);
    if (diff <= 0) return '00:00:00';
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [nextP, currentTime]);

  return (
    <View style={heroStyles.countdownContainer}>
      <Text style={heroStyles.nextPrayerText}>
        {PRAYER_NAMES_AR[nextP.name as PrayerName]} {tr('home.heroNextSuffix')}
      </Text>
      <Text style={heroStyles.countdownTime}>{countdownText}</Text>
      <Pressable
        style={heroStyles.locationBadge}
        onPress={() => router.push('/location')}
        accessibilityLabel="غيّر الموقع"
      >
        <MapPin size={14} color="#FFF" />
        <Text style={heroStyles.locationText}>{cityName}</Text>
      </Pressable>
    </View>
  );
};

export default function DailyScreen() {
  const t = useTheme();
  const tr = useT();
  const { lang } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const location = useSettingsStore((s) => s.location);
  const { pagesReadToday, dailyTarget } = useWirdStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const now = new Date();
  const isToday = useMemo(() => isSameDay(selectedDate, now), [selectedDate, now]);

  const prayerAdjustments = useSettingsStore((s) => s.prayerAdjustments);
  const todayPrayers = useMemo(() => calculatePrayerTimes({
    date: selectedDate,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
    method: methodForCountry(location.countryCode),
    adjustments: prayerAdjustments,
  }), [selectedDate, location, prayerAdjustments]);

  const nextP = useMemo(() => nextPrayer(todayPrayers, now), [todayPrayers, now]);

  const dateLocale = lang === 'ar' ? 'ar-EG' : `${lang}-u-ca-gregory`;
  const hijriLocale = lang === 'ar' ? 'ar-SA-u-ca-islamic' : `${lang}-u-ca-islamic`;
  const dateString = useMemo(() => {
    try {
      const hijri = new Intl.DateTimeFormat(hijriLocale, {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(selectedDate);
      const greg = new Intl.DateTimeFormat(dateLocale, {
        weekday: 'long', day: 'numeric', month: 'long',
      }).format(selectedDate);
      return `${greg}  ·  ${hijri}`;
    } catch {
      return selectedDate.toLocaleDateString(dateLocale);
    }
  }, [selectedDate, dateLocale, hijriLocale]);

  const shiftDay = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setSelectedDate(next);
  };

  const cityName = lang === 'ar' ? location.cityAr : location.cityEn;

  // 📿 اختيار آية اليوم - بنفس الـ algo القديم (يوم → index)
  const dayOfYear = useMemo(() => {
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [now]);
  const todayAyah = FEATURED_AYAHS[dayOfYear % FEATURED_AYAHS.length];

  const wirdProgress = dailyTarget > 0 ? Math.min(1, pagesReadToday / dailyTarget) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ════════ 1. Prayer Times HERO — أخضر premium ════════ */}
        <View style={[styles.hero, { paddingTop: Math.max(insets.top, 20) }]}>
          <LinearGradient
            colors={[t.colors.primary, '#0F4A41', '#062825']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* نقش هندسي ذهبي خفيف */}
          <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.16 }]} pointerEvents="none">
            <Defs>
              <Pattern id="daily-hero-bg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <Path
                  d="M20,4 L24,16 L36,20 L24,24 L20,36 L16,24 L4,20 L16,16 Z"
                  fill="none" stroke="#C9A961" strokeWidth={0.5}
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#daily-hero-bg)" />
          </Svg>
          {/* إطار ذهبي داخلي */}
          <View pointerEvents="none" style={styles.heroFrame} />

          {/* العنوان */}
          <View style={styles.heroTitle}>
            <Text style={styles.heroTitleText}>{tr('tabs.daily')}</Text>
          </View>

          <PrayerHero nextP={nextP} cityName={cityName} />
        </View>

        {/* ════════ 2. Prayer Strip — تحت الـ hero ════════ */}
        <View style={[styles.prayerStrip, { backgroundColor: t.colors.surface, borderColor: t.colors.border, shadowColor: t.colors.shadowColor }]}>
          <View style={styles.dateRow}>
            <Pressable onPress={() => shiftDay(-1)} hitSlop={15} style={styles.dateNavBtn}>
              <ChevronRight size={20} color={t.colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => setSelectedDate(new Date())} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: t.colors.textPrimary, fontWeight: '700', fontSize: 13 }}>{dateString}</Text>
            </Pressable>
            <Pressable onPress={() => shiftDay(1)} hitSlop={15} style={styles.dateNavBtn}>
              <ChevronLeft size={20} color={t.colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.timesRow}>
            {(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerName[]).map((pKey) => {
              const isActive = isToday && nextP.name === pKey;
              return (
                <View key={pKey} style={[styles.timeItem, isActive && { backgroundColor: t.colors.primary }]}>
                  <Text style={[styles.timeName, { color: isActive ? '#FFF' : t.colors.textSecondary }]}>
                    {PRAYER_NAMES_AR[pKey]}
                  </Text>
                  <Text style={[styles.timeValue, { color: isActive ? '#FFF' : t.colors.textPrimary }]}>
                    {todayPrayers[pKey]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ════════ 3. Adhkar Quick Access ════════ */}
        <View style={{ marginTop: 24 }}>
          <SectionHeading eyebrow={tr('dhikr.adhkar')} title="أذكار اليوم" />
          <View style={styles.adhkarRow}>
            <AdhkarChip icon={<Sun size={22} color={t.colors.accent} />} title="الصباح" onPress={() => router.push('/adhkar/morning')} t={t} />
            <AdhkarChip icon={<Moon size={22} color={t.colors.accent} />} title="المساء" onPress={() => router.push('/adhkar/evening')} t={t} />
            <AdhkarChip icon={<Sparkles size={22} color={t.colors.accent} />} title="بعد الصلاة" onPress={() => router.push('/adhkar/after-prayer')} t={t} />
            <AdhkarChip icon={<Moon size={22} color={t.colors.accent} />} title="النوم" onPress={() => router.push('/adhkar/sleep')} t={t} />
          </View>
        </View>

        {/* ════════ 4. آية اليوم ════════ */}
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
              <Text style={[styles.ayahText, { color: t.colors.textPrimary, fontFamily: t.fontFamilies.arabicQuran }]}>
                {todayAyah.text}
              </Text>
              <View style={[styles.ayahRule, { backgroundColor: t.colors.borderGold }]} />
              <Text style={[styles.ayahRef, { color: t.colors.accent }]}>
                سورة {todayAyah.surahName} · الآية {todayAyah.number}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* ════════ 5. ورد القراءة ════════ */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <SectionHeading eyebrow="عبادة يومية" title="ورد القراءة" />
          <Pressable
            onPress={() => router.push('/wird')}
            style={({ pressed }) => [
              styles.wirdCard,
              {
                backgroundColor: t.colors.surface,
                borderColor: t.colors.borderGold,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={styles.wirdHeader}>
              <BookOpen size={20} color={t.colors.primary} />
              <Text style={[styles.wirdLabel, { color: t.colors.textPrimary }]}>
                {pagesReadToday} من {dailyTarget} صفحة
              </Text>
            </View>
            <View style={[styles.wirdBar, { backgroundColor: t.colors.surfaceAlt }]}>
              <View style={[styles.wirdBarFill, { width: `${wirdProgress * 100}%`, backgroundColor: t.colors.accent }]} />
            </View>
          </Pressable>
        </View>

        {/* ════════ 6. القبلة — اختصار سريع ════════ */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <Pressable
            onPress={() => router.push('/qibla')}
            style={({ pressed }) => [
              styles.qiblaCard,
              {
                backgroundColor: t.colors.primary,
                borderColor: t.colors.accent,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Compass size={22} color={t.colors.accent} />
            <Text style={[styles.qiblaText, { color: '#FFF' }]}>اتجاه القبلة</Text>
            <ChevronLeft size={18} color={t.colors.accent} />
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

// ─────────────── chip للأذكار ───────────────
const AdhkarChip: React.FC<{ icon: React.ReactNode; title: string; onPress: () => void; t: any }> = ({ icon, title, onPress, t }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.adhkarChip,
      {
        backgroundColor: t.colors.surface,
        borderColor: t.colors.borderGold,
        opacity: pressed ? 0.85 : 1,
      },
    ]}
  >
    {icon}
    <Text style={{ color: t.colors.textPrimary, fontWeight: '700', fontSize: 12, marginTop: 6 }}>{title}</Text>
  </Pressable>
);

const heroStyles = StyleSheet.create({
  countdownContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  nextPrayerText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  countdownTime: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.4)',
  },
  locationText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});

const styles = StyleSheet.create({
  hero: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    paddingBottom: 16,
  },
  heroFrame: {
    position: 'absolute',
    top: 12, bottom: 12, left: 12, right: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.25)',
  },
  heroTitle: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  heroTitleText: {
    color: '#D4B570',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  prayerStrip: {
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  dateNavBtn: {
    padding: 4,
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  timeItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    flex: 1,
  },
  timeName: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  adhkarRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  adhkarChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
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
  ayahRef: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  wirdCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  wirdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  wirdLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  wirdBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  wirdBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  qiblaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  qiblaText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
});
