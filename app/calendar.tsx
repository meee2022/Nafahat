/**
 * شاشة التقويم الهجري - عرض تاريخ اليوم بالهجري والميلادي + المناسبات الإسلامية.
 *
 * ملاحظة: تحويل الميلادي للهجري في النسخة الحالية تقريبي (وفق صيغة حسابية بسيطة).
 * للتحويل الدقيق يمكن لاحقاً استعمال مكتبة hijri-converter أو API.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Sun, Moon, Star } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { arabicNumber } from '@data/surahs';
import { useT } from '@store/languageStore';
import { TOP_BAR_PAD } from '@utils/safeArea';

const HIJRI_MONTHS = [
  'محرّم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجّة',
];

const GREGORIAN_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

interface Event {
  hijriMonth: number;   // 1-12
  hijriDay: number;
  title: string;
  description: string;
  color: string;
}

const ISLAMIC_EVENTS: Event[] = [
  { hijriMonth: 1,  hijriDay: 1,  title: 'رأس السنة الهجرية',  description: 'بداية العام الهجري الجديد',           color: '#7C3AED' },
  { hijriMonth: 1,  hijriDay: 10, title: 'يوم عاشوراء',         description: 'صيامه يكفّر سنة ماضية',                color: '#0284C7' },
  { hijriMonth: 3,  hijriDay: 12, title: 'المولد النبوي',       description: 'مولد النبي محمد ﷺ',                    color: '#3F8F6E' },
  { hijriMonth: 7,  hijriDay: 27, title: 'الإسراء والمعراج',    description: 'رحلة النبي ﷺ من مكة للأقصى ثم السماء', color: '#B8923B' },
  { hijriMonth: 8,  hijriDay: 15, title: 'ليلة النصف من شعبان', description: 'ليلة فضيلة بالعبادة',                  color: '#5390BA' },
  { hijriMonth: 9,  hijriDay: 1,  title: 'بداية رمضان',          description: 'شهر الصيام والقرآن',                   color: '#10A37F' },
  { hijriMonth: 9,  hijriDay: 27, title: 'ليلة القدر',           description: 'خير من ألف شهر',                       color: '#D97706' },
  { hijriMonth: 10, hijriDay: 1,  title: 'عيد الفطر',            description: 'أول أيام شوّال',                       color: '#E0743D' },
  { hijriMonth: 12, hijriDay: 9,  title: 'يوم عرفة',             description: 'صيامه يكفّر سنتين',                    color: '#0F4A41' },
  { hijriMonth: 12, hijriDay: 10, title: 'عيد الأضحى',           description: 'يوم النحر',                            color: '#A2384B' },
];

/**
 * تحويل تقريبي ميلادي → هجري (Umm al-Qura method approximation).
 */
function gregorianToHijri(g: Date): { y: number; m: number; d: number } {
  const gy = g.getFullYear();
  const gm = g.getMonth() + 1;
  const gd = g.getDate();
  const jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4)
    + Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12)
    - Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4)
    + gd - 32075;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const m = Math.floor((24 * l3) / 709);
  const d = l3 - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;
  return { y, m, d };
}

export default function CalendarScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();

  const today = new Date();
  const hijri = useMemo(() => gregorianToHijri(today), []);

  const upcomingEvents = useMemo(() => {
    // إيجاد الأحداث القادمة في الشهور الـ3 القادمة
    return ISLAMIC_EVENTS
      .map((e) => {
        let yearOffset = 0;
        if (e.hijriMonth < hijri.m || (e.hijriMonth === hijri.m && e.hijriDay < hijri.d)) {
          yearOffset = 1;
        }
        // ترتيب حسب القرب الزمني
        const monthDiff = (e.hijriMonth - hijri.m + 12 * yearOffset);
        const dayDiff = e.hijriDay - hijri.d;
        return { ...e, totalDays: monthDiff * 30 + dayDiff, yearOffset };
      })
      .sort((a, b) => a.totalDays - b.totalDays)
      .slice(0, 6);
  }, [hijri]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={t.hitSlop} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('calendar.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('calendar.title')}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 18 }}>
        {/* بطاقة اليوم */}
        <Card padding={t.spacing.xl} elevation="sm" bordered>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>اليوم</Text>
            <Text style={[styles.weekday, { color: t.colors.textPrimary }]}>{WEEKDAYS[today.getDay()]}</Text>
            <View style={{ marginVertical: 10 }}>
              <OrnamentalRule width={160} color={t.colors.accent} variant="star" />
            </View>

            <View style={[styles.dateGrid, { borderColor: t.colors.borderGold }]}>
              {/* هجري */}
              <View style={styles.dateBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <Moon size={12} color={t.colors.accent} />
                  <Text style={[styles.dateLabel, { color: t.colors.accent }]}>هجري</Text>
                </View>
                <Text style={[styles.bigDay, { color: t.colors.textPrimary }]}>{arabicNumber(hijri.d)}</Text>
                <Text style={[styles.monthName, { color: t.colors.textPrimary }]}>{HIJRI_MONTHS[hijri.m - 1]}</Text>
                <Text style={[styles.year, { color: t.colors.textTertiary }]}>{arabicNumber(hijri.y)} هـ</Text>
              </View>

              <View style={[styles.dateSeparator, { backgroundColor: t.colors.borderGold }]} />

              {/* ميلادي */}
              <View style={styles.dateBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <Sun size={12} color={t.colors.info} />
                  <Text style={[styles.dateLabel, { color: t.colors.info }]}>ميلادي</Text>
                </View>
                <Text style={[styles.bigDay, { color: t.colors.textPrimary }]}>{arabicNumber(today.getDate())}</Text>
                <Text style={[styles.monthName, { color: t.colors.textPrimary }]}>{GREGORIAN_MONTHS[today.getMonth()]}</Text>
                <Text style={[styles.year, { color: t.colors.textTertiary }]}>{arabicNumber(today.getFullYear())} م</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* المناسبات القادمة */}
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>المناسبات القادمة</Text>
        <View style={{ gap: 10 }}>
          {upcomingEvents.map((e, idx) => (
            <Card key={idx} padding={t.spacing.lg} elevation="xs" bordered>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.dateBadge, { backgroundColor: e.color + '14', borderColor: e.color }]}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: e.color, lineHeight: 22 }}>
                    {arabicNumber(e.hijriDay)}
                  </Text>
                  <Text style={{ fontSize: 9, color: e.color, letterSpacing: 0.6, fontWeight: '700' }}>
                    {HIJRI_MONTHS[e.hijriMonth - 1].slice(0, 5)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="subtitle">{e.title}</Text>
                  <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 4 }}>
                    {e.description}
                  </Text>
                  <Text variant="caption" color={e.color} style={{ marginTop: 6, fontWeight: '700' }}>
                    {e.totalDays === 0 ? '◇ اليوم ◇' : `بعد ${arabicNumber(e.totalDays)} يوم تقريباً`}
                  </Text>
                </View>
                <Star size={14} color={t.colors.textTertiary} />
              </View>
            </Card>
          ))}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, paddingTop: TOP_BAR_PAD, paddingBottom: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '600' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  weekday: { fontSize: 22, fontWeight: '700', marginTop: 6 },

  dateGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    marginTop: 4,
    alignSelf: 'stretch',
  },
  dateBox: { flex: 1, padding: 16, alignItems: 'center' },
  dateSeparator: { width: 1 },
  dateLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  bigDay: { fontSize: 44, fontWeight: '300', lineHeight: 48, letterSpacing: -1, marginVertical: 2 },
  monthName: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  year: { fontSize: 11, marginTop: 4, letterSpacing: 1 },

  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12 },

  dateBadge: {
    width: 56, height: 56, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, gap: 2,
  },
});
