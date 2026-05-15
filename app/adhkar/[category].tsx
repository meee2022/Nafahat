/**
 * شاشة الأذكار - تجربة عداد جميل لكل ذكر.
 */
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, RotateCcw, Heart } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, Chip, AppHeader, ProgressBar } from '@components/ui';
import { ADHKAR, DHIKR_CATEGORIES } from '@data/adhkar';
import { arabicNumber } from '@data/surahs';
import { DhikrItem } from '@/types/index';

export default function AdhkarScreen() {
  const t = useTheme();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const cat = useMemo(() => DHIKR_CATEGORIES.find((c) => c.id === category) ?? DHIKR_CATEGORIES[0], [category]);
  const items = useMemo<DhikrItem[]>(() => ADHKAR.filter((d) => d.category === cat.id), [cat.id]);

  const completed = items.filter((it) => (counts[it.id] ?? 0) >= it.count).length;
  const overallProgress = items.length > 0 ? completed / items.length : 0;

  const increment = (id: string, max: number) => {
    setCounts((c) => ({ ...c, [id]: Math.min((c[id] ?? 0) + 1, max) }));
  };

  const reset = (id: string) => {
    setCounts((c) => ({ ...c, [id]: 0 }));
  };

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title={cat.titleAr} subtitle={`${arabicNumber(items.length)} ذكر`} />

      {/* تقدم عام */}
      <Card padding={t.spacing.lg} elevation="xs">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text variant="subtitle">تقدمك في الأذكار</Text>
          <Text variant="label" color={t.colors.primary}>{Math.round(overallProgress * 100)}%</Text>
        </View>
        <ProgressBar value={overallProgress} color={t.colors.primary} height={8} />
        <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 6 }}>
          أكملت {arabicNumber(completed)} من {arabicNumber(items.length)}
        </Text>
      </Card>

      {/* فلتر سريع للفئات */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: t.spacing.lg }}>
        {DHIKR_CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={c.titleAr}
            active={c.id === cat.id}
            onPress={() => router.replace(`/adhkar/${c.id}`)}
          />
        ))}
      </View>

      {/* قائمة الأذكار */}
      <View style={{ gap: t.spacing.md, marginTop: t.spacing.lg }}>
        {items.map((d) => {
          const current = counts[d.id] ?? 0;
          const done = current >= d.count;
          const progress = d.count > 0 ? current / d.count : 0;

          return (
            <Pressable
              key={d.id}
              onPress={() => increment(d.id, d.count)}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.99 : 1 }] }]}
            >
              <Card padding={t.spacing.lg} elevation="sm" bordered={done} background={done ? t.colors.successSurface : undefined}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text variant="subtitle" style={{ flex: 1, marginEnd: 8 }}>{d.title}</Text>
                  {done ? <Check size={20} color={t.colors.success} /> : null}
                </View>

                <Text variant="body" color={t.colors.textPrimary} style={{ marginTop: 8, lineHeight: 26 }}>
                  {d.body}
                </Text>

                {d.benefit ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <Heart size={12} color={t.colors.accent} />
                    <Text variant="caption" color={t.colors.textSecondary} style={{ flex: 1 }}>{d.benefit}</Text>
                  </View>
                ) : null}

                {d.source ? (
                  <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 4 }}>{d.source}</Text>
                ) : null}

                {/* عداد */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
                  <View style={[styles.counter, { backgroundColor: t.colors.primary }]}>
                    <Text variant="h3" color="#fff">{arabicNumber(current)}</Text>
                    <Text variant="caption" color="rgba(255,255,255,0.8)">/ {arabicNumber(d.count)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProgressBar value={progress} color={done ? t.colors.success : t.colors.primary} height={6} />
                    <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 6 }}>
                      اضغط على البطاقة للزيادة
                    </Text>
                  </View>
                  <Pressable onPress={() => reset(d.id)} hitSlop={t.hitSlop} style={[styles.resetBtn, { backgroundColor: t.colors.surfaceAlt }]}>
                    <RotateCcw size={14} color={t.colors.textSecondary} />
                  </Pressable>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  counter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, alignItems: 'center', minWidth: 72 },
  resetBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
