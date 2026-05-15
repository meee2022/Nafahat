/**
 * شاشة التجويد - مسارات تعليمية + دروس.
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, BookOpen, Award, Clock, Sparkles, CheckCircle2, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, Chip, AppHeader, ProgressBar } from '@components/ui';
import { TAJWEED_LESSONS, TAJWEED_LEVELS } from '@data/tajweed';
import { useT } from '@store/languageStore';
import { useTajweedStore } from '@store/index';

export default function TajweedScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [level, setLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const { completedLessons, isCompleted, progressPercent } = useTajweedStore();

  const filtered = useMemo(() => {
    if (level === 'all') return TAJWEED_LESSONS;
    return TAJWEED_LESSONS.filter((l) => l.level === level);
  }, [level]);

  const progress = progressPercent(TAJWEED_LESSONS.length) / 100;
  const completedCount = completedLessons.length;
  const totalCount = TAJWEED_LESSONS.length;

  // تحديد المرحلة الحالية بناءً على نسبة الإكمال
  const currentStage = progress < 0.33 ? 'مبتدئ' : progress < 0.66 ? 'متوسط' : 'متقدم';
  const remainingInStage = Math.max(0, Math.ceil(totalCount * (progress < 0.33 ? 0.33 : progress < 0.66 ? 0.66 : 1)) - completedCount);

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title={tr('tajweed.title')} subtitle={tr('tajweed.subtitle')} />

      {/* بطاقة المسار */}
      <LinearGradient
        colors={['#6B4FBB', '#4B3490']}
        style={[styles.heroCard, { borderRadius: t.radius.xl }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <GraduationCap size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h2" color="#fff">مسارك التعليمي</Text>
            <Text variant="bodySm" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
              المرحلة: {currentStage}{remainingInStage > 0 ? ` · ${remainingInStage} دروس متبقية للترقية` : ' · أكملت المرحلة!'}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 16 }}>
          <ProgressBar value={progress} color="#fff" trackColor="rgba(255,255,255,0.2)" height={8} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text variant="caption" color="rgba(255,255,255,0.85)">{completedCount} من {totalCount} دروس</Text>
            <Text variant="caption" color="#fff">{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </LinearGradient>

      {/* فلتر المستوى */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: t.spacing.lg }}>
        <Chip label="الكل"     active={level === 'all'}          onPress={() => setLevel('all')} />
        {TAJWEED_LEVELS.map((l) => (
          <Chip
            key={l.id}
            label={l.titleAr}
            active={level === l.id}
            onPress={() => setLevel(l.id)}
            color={l.color}
          />
        ))}
      </View>

      {/* قائمة الدروس */}
      <View style={{ gap: t.spacing.sm, marginTop: t.spacing.lg }}>
        {filtered.map((lesson) => {
          const lvl = TAJWEED_LEVELS.find((l) => l.id === lesson.level)!;
          const done = isCompleted(lesson.id);
          return (
            <Card key={lesson.id} onPress={() => router.push(`/tajweed/${lesson.id}`)} padding={t.spacing.lg} elevation="xs">
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={[styles.lessonIcon, { backgroundColor: lvl.color + '22' }]}>
                  {done ? (
                    <CheckCircle2 size={20} color={lvl.color} />
                  ) : (
                    <BookOpen size={20} color={lvl.color} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text variant="subtitle">{lesson.title}</Text>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: lvl.color + '20' }}>
                      <Text variant="caption" color={lvl.color}>{lvl.titleAr}</Text>
                    </View>
                  </View>
                  <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 4 }} numberOfLines={2}>
                    {lesson.summary}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} color={t.colors.textTertiary} />
                      <Text variant="caption" color={t.colors.textTertiary}>{lesson.estimatedMinutes} د</Text>
                    </View>
                    <Text variant="caption" color={t.colors.textTertiary}>· {lesson.category}</Text>
                  </View>
                </View>
                <ChevronLeft size={18} color={t.colors.textTertiary} />
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { padding: 20 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  lessonIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
