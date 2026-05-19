/**
 * 🛠️ صفحة "الأدوات" — مركز الميزات الثانوية.
 *
 * تجمع كل الـ utilities + tools + challenges في صفحة منظّمة واحدة:
 *  - عبادات يومية: القبلة، التسبيح، التقويم
 *  - محتوى: الأحاديث، الأدعية
 *  - أدوات حسابية: حاسبة الزكاة
 *  - locator: المساجد القريبة
 *  - تتبّع شخصي: الرحلة، الإنجازات
 *  - تحدّيات: الاختبارات
 *
 * هوية Nafahat الرسمية: أخضر + ذهبي. الـ surface فاتح، الـ accents ذهبية،
 * الأيقونات بألوان feature متنوّعة لتمييز كل أداة لكن في نفس النظام البصري.
 *
 * يصلها المستخدم من:
 *  - Account tab → بطاقة "الأدوات"
 *  - Home → اختصار صغير "اكتشف الأدوات"
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Compass, Hand, Calendar as CalendarIcon, ScrollText, BookHeart,
  Calculator, MapPin, Trophy, Award, Map, ChevronLeft, Palette, BookMarked,
  Library, BookOpen,
} from 'lucide-react-native';
import { TajweedLegendSheet } from '@components/mushaf';
import { useTheme } from '@theme/index';
import { Screen, AppHeader, Text } from '@components/ui';
import { SectionHeading } from '@components/home';
import { useT } from '@store/languageStore';

interface ToolItem {
  id: string;
  icon: React.ReactNode;
  titleAr: string;
  descAr: string;
  path: string;
  accent: string;
}

export default function ToolsScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [tajweedOpen, setTajweedOpen] = React.useState(false);

  const dailyTools: ToolItem[] = [
    {
      id: 'qibla',
      icon: <Compass size={22} color={t.colors.primary} />,
      titleAr: 'القبلة',
      descAr: 'بوصلة تحدّد اتجاه الكعبة',
      path: '/qibla',
      accent: t.colors.featureLapis,
    },
    {
      id: 'tasbeeh',
      icon: <Hand size={22} color={t.colors.primary} />,
      titleAr: 'التسبيح',
      descAr: 'مسبحة رقمية مع أذكار',
      path: '/tasbeeh',
      accent: t.colors.featureEmerald,
    },
    {
      id: 'calendar',
      icon: <CalendarIcon size={22} color={t.colors.primary} />,
      titleAr: 'التقويم الهجري',
      descAr: 'الأشهر والمناسبات',
      path: '/calendar',
      accent: t.colors.featureSepia,
    },
  ];

  const contentTools: ToolItem[] = [
    {
      id: 'articles',
      icon: <Library size={22} color={t.colors.primary} />,
      titleAr: 'المقالات',
      descAr: 'قصص الأنبياء · تدبّرات · تاريخ',
      path: '/articles',
      accent: t.colors.featureEmerald,
    },
    {
      id: 'hadith',
      icon: <ScrollText size={22} color={t.colors.primary} />,
      titleAr: 'الأحاديث',
      descAr: 'الأربعون النووية والكتب التسعة',
      path: '/hadith',
      accent: t.colors.featureCarmine,
    },
    {
      id: 'duas',
      icon: <BookHeart size={22} color={t.colors.primary} />,
      titleAr: 'الأدعية',
      descAr: 'أدعية من الكتاب والسنّة',
      path: '/duas',
      accent: t.colors.featureMoss,
    },
    {
      id: 'tajweed-legend',
      icon: <Palette size={22} color={t.colors.primary} />,
      titleAr: 'أحكام التجويد',
      descAr: 'دليل ألوان قواعد التجويد',
      path: '__tajweed_legend',
      accent: t.colors.featureSepia,
    },
  ];

  const utilityTools: ToolItem[] = [
    {
      id: 'zakat',
      icon: <Calculator size={22} color={t.colors.primary} />,
      titleAr: 'حاسبة الزكاة',
      descAr: 'احسب زكاتك بسهولة',
      path: '/zakat',
      accent: t.colors.featureGold,
    },
    {
      id: 'mosques',
      icon: <MapPin size={22} color={t.colors.primary} />,
      titleAr: 'المساجد القريبة',
      descAr: 'ابحث عن مسجد بقربك',
      path: '/mosques',
      accent: t.colors.featureLapis,
    },
  ];

  const progressTools: ToolItem[] = [
    {
      id: 'journey',
      icon: <Map size={22} color={t.colors.primary} />,
      titleAr: 'رحلتي',
      descAr: 'محطّاتك مع القرآن',
      path: '/journey',
      accent: t.colors.featureEmerald,
    },
    {
      id: 'achievements',
      icon: <Award size={22} color={t.colors.primary} />,
      titleAr: 'الإنجازات',
      descAr: 'الأوسمة التي حقّقتها',
      path: '/achievements',
      accent: t.colors.featureSaffron,
    },
    {
      id: 'quiz',
      icon: <Trophy size={22} color={t.colors.primary} />,
      titleAr: 'التحديات',
      descAr: 'اختبر معرفتك بالقرآن',
      path: '/quiz',
      accent: t.colors.featureTerracotta,
    },
  ];

  const handleToolPress = (item: ToolItem) => {
    if (item.path === '__tajweed_legend') {
      setTajweedOpen(true);
    } else {
      router.push(item.path as any);
    }
  };

  const renderGroup = (items: ToolItem[]) => (
    <View style={styles.group}>
      {items.map((item, idx) => (
        <Pressable
          key={item.id}
          onPress={() => handleToolPress(item)}
          accessibilityRole="button"
          accessibilityLabel={item.titleAr}
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
            <Text style={{ color: t.colors.textPrimary, fontWeight: '700', fontSize: 15 }}>{item.titleAr}</Text>
            <Text style={{ color: t.colors.textTertiary, fontSize: 12, marginTop: 2 }}>{item.descAr}</Text>
          </View>
          <ChevronLeft size={18} color={t.colors.textTertiary} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <Screen scrollable={false} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader title="الأدوات" subtitle="مجموعة شاملة من الأدوات والمحتوى الإسلامي" onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20 }}>
          <SectionHeading eyebrow="عبادة يومية" title="أدوات اليوم" />
        </View>
        {renderGroup(dailyTools)}

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeading eyebrow="محتوى" title="مكتبة إسلامية" />
        </View>
        {renderGroup(contentTools)}

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeading eyebrow="حسابات وأماكن" title="أدوات عملية" />
        </View>
        {renderGroup(utilityTools)}

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeading eyebrow="تتبّع شخصي" title="رحلتك مع القرآن" />
        </View>
        {renderGroup(progressTools)}
      </ScrollView>

      {/* 🎨 Tajweed legend sheet */}
      <TajweedLegendSheet visible={tajweedOpen} onClose={() => setTajweedOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
