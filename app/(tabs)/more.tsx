/**
 * ⋯ تبويب "المزيد" — البوّابة الشاملة لكل الأقسام والأدوات.
 *
 * استبدل تبويب "المكتبة" في الـ bottom bar. المكتبة + المقالات + الأحاديث
 * تظلّ accessible من هنا كأقسام فرعية (مع باقي الأدوات: اليومي، القبلة،
 * الزكاة، الإحصائيات، الإنجازات، الأذكار، الأدعية، الورد، الختمة...).
 *
 * هوية Nafahat: أخضر primary + ذهبي accent. Hero أخضر + مجموعات
 * منظّمة بأيقونات feature متنوّعة على نفس النظام البصري.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import {
  Library, ScrollText, BookHeart, BookOpen, Sparkles,
  Compass, Hand, Calendar as CalendarIcon, Calculator, MapPin, Search,
  Trophy, Award, Map as MapIcon, Palette, Mic, Headphones, BookMarked,
  Star, Download, FileText, Heart, ChevronLeft, Sun,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { SectionHeading } from '@components/home';

interface MoreItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  path: string;
  accent: string;
}

export default function MoreScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // useMemo → لا إعادة بناء في كل render
  const libraryItems: MoreItem[] = useMemo(() => [
    { id: 'library',  icon: <Library    size={22} color={t.colors.primary} />, title: 'المكتبة',  desc: 'مقالات وأحاديث وتدبّرات',       path: '/library',     accent: t.colors.featureEmerald },
    { id: 'articles', icon: <FileText   size={22} color={t.colors.primary} />, title: 'المقالات', desc: 'قصص الأنبياء · تدبّرات · تاريخ', path: '/articles',    accent: t.colors.featureEmerald },
    { id: 'hadith',   icon: <ScrollText size={22} color={t.colors.primary} />, title: 'الأحاديث', desc: 'الأربعون النووية والكتب التسعة',  path: '/hadith',      accent: t.colors.featureCarmine },
    { id: 'duas',     icon: <BookHeart  size={22} color={t.colors.primary} />, title: 'الأدعية',  desc: 'أدعية من الكتاب والسنّة',        path: '/duas',        accent: t.colors.featureMoss    },
    { id: 'adhkar',   icon: <Sparkles   size={22} color={t.colors.primary} />, title: 'الأذكار',  desc: 'أذكار الصباح والمساء والنوم',    path: '/adhkar',      accent: t.colors.featureSaffron },
  ], [t.colors]);

  const dailyItems: MoreItem[] = useMemo(() => [
    { id: 'daily',    icon: <Sun        size={22} color={t.colors.primary} />, title: 'اليومي',       desc: 'الصلاة + الأذكار + آية اليوم', path: '/daily',       accent: t.colors.featureSaffron },
    { id: 'ayah-day', icon: <Star       size={22} color={t.colors.primary} />, title: 'آية اليوم',    desc: 'آية مختارة بتدبّر يومي',      path: '/ayah-of-day', accent: t.colors.featureGold    },
    { id: 'wird',     icon: <BookOpen   size={22} color={t.colors.primary} />, title: 'الورد اليومي', desc: 'وردك من القرآن',              path: '/wird',        accent: t.colors.featureEmerald },
    { id: 'khatma',   icon: <BookMarked size={22} color={t.colors.primary} />, title: 'الختمة',       desc: 'خطّة ختم القرآن',              path: '/khatma',      accent: t.colors.featureMoss    },
    { id: 'tasbeeh',  icon: <Hand       size={22} color={t.colors.primary} />, title: 'التسبيح',      desc: 'مسبحة رقمية مع أذكار',        path: '/tasbeeh',     accent: t.colors.featureEmerald },
    { id: 'qibla',    icon: <Compass    size={22} color={t.colors.primary} />, title: 'القبلة',       desc: 'بوصلة تحدّد اتجاه الكعبة',     path: '/qibla',       accent: t.colors.featureLapis   },
  ], [t.colors]);

  const studyItems: MoreItem[] = useMemo(() => [
    { id: 'tajweed',  icon: <Palette    size={22} color={t.colors.primary} />, title: 'التجويد',    desc: 'دروس ودليل الألوان',         path: '/tajweed',     accent: t.colors.featureSepia      },
    { id: 'tasmee',   icon: <Mic        size={22} color={t.colors.primary} />, title: 'التسميع',    desc: 'سجّل تلاوتك واستمع لنفسك',  path: '/tasmee',      accent: t.colors.featureCarmine    },
    { id: 'quiz',     icon: <Trophy     size={22} color={t.colors.primary} />, title: 'الاختبارات', desc: 'اختبر معرفتك بالقرآن',        path: '/quiz',        accent: t.colors.featureTerracotta },
    { id: 'reciters', icon: <Headphones size={22} color={t.colors.primary} />, title: 'القرّاء',     desc: 'كاتالوج كامل بالقراءات',     path: '/reciters',    accent: t.colors.featureLapis      },
  ], [t.colors]);

  const utilityItems: MoreItem[] = useMemo(() => [
    { id: 'calendar', icon: <CalendarIcon size={22} color={t.colors.primary} />, title: 'التقويم الهجري',  desc: 'الأشهر والمناسبات',       path: '/calendar', accent: t.colors.featureSepia   },
    { id: 'zakat',    icon: <Calculator   size={22} color={t.colors.primary} />, title: 'حاسبة الزكاة',   desc: 'احسب زكاتك بسهولة',       path: '/zakat',    accent: t.colors.featureGold    },
    { id: 'mosques',  icon: <MapPin       size={22} color={t.colors.primary} />, title: 'المساجد القريبة', desc: 'ابحث عن مسجد بقربك',      path: '/mosques',  accent: t.colors.featureLapis   },
    { id: 'search',   icon: <Search       size={22} color={t.colors.primary} />, title: 'البحث',           desc: 'بحث في القرآن والتفاسير', path: '/search',   accent: t.colors.featureEmerald },
  ], [t.colors]);

  const trackItems: MoreItem[] = useMemo(() => [
    { id: 'journey',      icon: <MapIcon  size={22} color={t.colors.primary} />, title: 'رحلتي',      desc: 'محطّاتك مع القرآن',      path: '/journey',      accent: t.colors.featureEmerald },
    { id: 'achievements', icon: <Award    size={22} color={t.colors.primary} />, title: 'الإنجازات',  desc: 'الأوسمة التي حقّقتها',   path: '/achievements', accent: t.colors.featureSaffron },
    { id: 'notes',        icon: <FileText size={22} color={t.colors.primary} />, title: 'الملاحظات',  desc: 'ملاحظاتك على الآيات',    path: '/notes',        accent: t.colors.featureMoss    },
    { id: 'favorites',    icon: <Heart    size={22} color={t.colors.primary} />, title: 'المفضّلة',   desc: 'آيات وأقسام محفوظة',     path: '/favorites',    accent: t.colors.featureCarmine },
    { id: 'downloads',    icon: <Download size={22} color={t.colors.primary} />, title: 'التحميلات',  desc: 'إدارة التلاوات المحفوظة', path: '/downloads',    accent: t.colors.featureLapis   },
  ], [t.colors]);

  const renderGroup = (items: MoreItem[]) => (
    <View style={styles.group}>
      {items.map((item, idx) => (
        <Pressable
          key={item.id}
          onPress={() => router.push(item.path as any)}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              borderTopWidth: idx === 0 ? 1 : 0,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: item.accent + '14', borderColor: item.accent + '40' }]}>
            {item.icon}
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={{ color: t.colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{item.title}</Text>
            <Text style={{ color: t.colors.textTertiary, fontSize: 12, marginTop: 2 }}>{item.desc}</Text>
          </View>
          <ChevronLeft size={18} color={t.colors.textTertiary} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* ═════ HERO أخضر مع 3 نقط ذهبية ═════ */}
        <LinearGradient
          colors={[t.colors.primary, '#0F4A41', '#062825']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: Math.max(insets.top, 20) + 8 }]}
        >
          <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity: 0.10 }]} pointerEvents="none">
            <Path
              d="M0 30 L20 10 L40 30 L60 10 L80 30 L100 10 M0 70 L20 50 L40 70 L60 50 L80 70 L100 50"
              stroke="#D4B570" strokeWidth="0.4" fill="none"
            />
          </Svg>
          <View pointerEvents="none" style={styles.heroFrame} />

          <View style={styles.heroBranding}>
            <Text style={styles.brandingTitle}>اكتشف</Text>
            <View style={styles.brandingRule} />
            <Text style={styles.brandingSub}>كلّ الأقسام والأدوات في مكان واحد</Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeading eyebrow="محتوى إسلامي" title="المكتبة" />
        </View>
        {renderGroup(libraryItems)}

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeading eyebrow="عبادة يومية" title="اليومي والورد" />
        </View>
        {renderGroup(dailyItems)}

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeading eyebrow="علم وممارسة" title="الدراسة والتلاوة" />
        </View>
        {renderGroup(studyItems)}

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeading eyebrow="حسابات وأماكن" title="أدوات عملية" />
        </View>
        {renderGroup(utilityItems)}

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeading eyebrow="تتبّع شخصي" title="رحلتك مع القرآن" />
        </View>
        {renderGroup(trackItems)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 22,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroFrame: {
    position: 'absolute',
    top: 10, left: 10, right: 10, bottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,181,112,0.35)',
    borderRadius: 22,
  },
  heroBranding: {
    alignItems: 'stretch',
    marginTop: 10,
  },
  brandingTitle: {
    color: '#FBF7EA',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'right',
  },
  brandingRule: {
    width: 56,
    height: 2,
    backgroundColor: '#D4B570',
    borderRadius: 1,
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  brandingSub: {
    color: 'rgba(251,247,234,0.78)',
    fontSize: 12,
    textAlign: 'right',
  },
  group: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
