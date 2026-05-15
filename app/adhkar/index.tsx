/**
 * شاشة قائمة الأذكار - شبكة بـ 6 بطاقات (الصباح، المساء، النوم، الاستيقاظ، بعد الصلاة، عامة).
 * كل بطاقة فيها مشهد SVG غني داخل قوس مسجد + اسم الفئة + عدد الأذكار.
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Text, AppHeader } from '@components/ui';
import {
  SceneMorning, SceneEvening, SceneSleep,
  SceneWakeup, SceneAfterPrayer, SceneGeneral,
} from '@components/illustrations/scenes';
import { DHIKR_CATEGORIES, ADHKAR } from '@data/adhkar';
import { arabicNumber } from '@data/surahs';

type CategoryId = typeof DHIKR_CATEGORIES[number]['id'];

const SCENE_MAP: Record<CategoryId, React.FC<{ size?: number }>> = {
  morning:        SceneMorning,
  evening:        SceneEvening,
  sleep:          SceneSleep,
  wake:           SceneWakeup,
  'after-prayer': SceneAfterPrayer,
  general:        SceneGeneral,
};

export default function AdhkarListScreen() {
  const t = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader
          onBack={() => router.back()}
          title="قائمة الأذكار"
          subtitle="حصن المسلم"
        />

        {/* بطاقة هيرو علوية - ورد الأذكار */}
        <View style={[styles.hero, { backgroundColor: t.colors.primary + '12', borderColor: t.colors.primary + '30' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: t.colors.textPrimary }]}>ورد الأذكار اليومي</Text>
            <Text style={[styles.heroSub, { color: t.colors.textSecondary }]}>
              ابدأ يومك ووجبة مع أذكار تحصّن قلبك
            </Text>
          </View>
          <View style={[styles.heroIcon, { backgroundColor: t.colors.primary }]}>
            <Text style={{ fontSize: 22 }}>🎯</Text>
          </View>
        </View>

        {/* شبكة الفئات */}
        <View style={styles.grid}>
          {DHIKR_CATEGORIES.map((cat) => {
            const Scene = SCENE_MAP[cat.id];
            const count = ADHKAR.filter((a) => a.category === cat.id).length;
            return (
              <Pressable
                key={cat.id}
                onPress={() => router.push(`/adhkar/${cat.id}`)}
                style={({ pressed }) => [
                  styles.cardWrap,
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
                  <View style={styles.illustration}>
                    <Scene size={92} />
                  </View>
                  <Text style={[styles.cardTitle, { color: t.colors.textPrimary }]} numberOfLines={1}>
                    {cat.titleAr}
                  </Text>
                  <Text style={[styles.cardCount, { color: t.colors.textSecondary }]}>
                    {arabicNumber(count)} ذكر
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* تذييل تحفيزي */}
        <View style={styles.footer}>
          <View style={[styles.footerDot, { backgroundColor: t.colors.accent }]} />
          <Text style={[styles.footerText, { color: t.colors.accent }]}>
            ◇  ذكرك لله طُمأنينة قلبك  ◇
          </Text>
          <View style={[styles.footerDot, { backgroundColor: t.colors.accent }]} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 22,
  },
  heroTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  heroSub:   { fontSize: 12, marginTop: 4 },
  heroIcon:  {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  cardWrap: {
    width: '33.333%',
    padding: 6,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
  },
  illustration: {
    width: 92, height: 92,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardCount: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
  },
  footerDot: {
    width: 5, height: 5,
    transform: [{ rotate: '45deg' }],
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
});
