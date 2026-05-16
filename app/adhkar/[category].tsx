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
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Check, RotateCcw, ListFilter, BookOpenCheck, Sparkles } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader, ProgressBar } from '@components/ui';
import { QuranicBlock } from '@components/common';
import { ALL_ADHKAR, DHIKR_CATEGORIES } from '@data/adhkar';
import { useSafeBack } from '@/utils/navigation';
import { arabicNumber } from '@data/surahs';
import { DhikrItem } from '@/types/index';

export default function AdhkarScreen() {
  const t = useTheme();
  const router = useRouter();
  // ⚠️ يرجع للأذكار لو فُتحت كأول صفحة (deep-link)، وإلا يستخدم history.
  const goBack = useSafeBack('/adhkar');
  const { category } = useLocalSearchParams<{ category: string }>();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const cat = useMemo(() => DHIKR_CATEGORIES.find((c) => c.id === category) ?? DHIKR_CATEGORIES[0], [category]);
  const items = useMemo<DhikrItem[]>(() => ALL_ADHKAR.filter((d) => d.category === cat.id), [cat.id]);

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
    <Screen>
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

      {/* زر للعودة لكل الفئات */}
      <Pressable
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
      </Pressable>

      {/* قائمة الأذكار */}
      <View style={{ gap: 16, marginTop: t.spacing.lg }}>
        {items.map((d, idx) => {
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
                    {d.title}
                  </Text>
                  {done ? (
                    <View style={[styles.doneBadge, { backgroundColor: t.colors.success }]}>
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </View>
                  ) : null}
                </View>

                {/* زخرفة ذهبية تحت العنوان */}
                <GoldOrnament color={t.colors.accent} />

                {/* نص الذكر - بأسلوب المصحف لو آية قرآنية، عادي لو دعاء */}
                {(d.quranic || /۝/.test(d.body)) ? (
                  <View style={{ marginVertical: 6 }}>
                    <QuranicBlock body={d.body} fontSize={22} />
                  </View>
                ) : (
                  <Text
                    style={[styles.dhikrBody, { color: t.colors.textPrimary, fontFamily: quranFont }]}
                  >
                    {d.body}
                  </Text>
                )}

                {/* الفضل والمصدر - في cards صغيرة */}
                {d.benefit ? (
                  <View style={[styles.benefitBox, { backgroundColor: t.colors.accent + '08', borderColor: t.colors.accent + '30' }]}>
                    <Sparkles size={12} color={t.colors.accent} />
                    <Text style={[styles.benefitText, { color: t.colors.textSecondary }]}>
                      {d.benefit}
                    </Text>
                  </View>
                ) : null}

                {d.source ? (
                  <View style={styles.sourceRow}>
                    <BookOpenCheck size={10} color={t.colors.textTertiary} />
                    <Text style={[styles.sourceText, { color: t.colors.textTertiary }]}>
                      {d.source}
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
                      <Text style={styles.counterCurrent}>
                        {arabicNumber(current)}
                      </Text>
                      <Text style={styles.counterSlash}>/</Text>
                      <Text style={styles.counterMax}>
                        {arabicNumber(d.count)}
                      </Text>
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
      </View>
    </Screen>
  );
}

// ─────────────── زخرفة ذهبية تحت العنوان ───────────────
const GoldOrnament: React.FC<{ color: string }> = ({ color }) => (
  <View style={{ alignItems: 'center', marginVertical: 10 }}>
    <Svg width={120} height={10} viewBox="0 0 120 10">
      <Path d="M 4 5 L 50 5" stroke={color} strokeWidth={0.6} opacity={0.5} />
      <Path d="M 70 5 L 116 5" stroke={color} strokeWidth={0.6} opacity={0.5} />
      <Path d="M 60 1 L 65 5 L 60 9 L 55 5 Z" fill={color} opacity={0.85} />
      <Circle cx="60" cy="5" r="0.8" fill="#FBF5E3" />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  dhikrCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
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
    alignItems: 'flex-start',
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
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 26,
  },
  doneBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhikrBody: {
    fontSize: 21,
    lineHeight: 42,
    textAlign: 'right',
    writingDirection: 'rtl',
    letterSpacing: 0,
    marginBottom: 14,
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
  benefitText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 80,
    justifyContent: 'center',
  },
  counterCurrent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  counterSlash: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginHorizontal: 2,
  },
  counterMax: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
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
});
