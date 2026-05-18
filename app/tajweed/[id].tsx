import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, BookOpen, Sparkles, CheckCircle2, Trophy } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader, Button } from '@components/ui';
import { TAJWEED_LESSONS, TAJWEED_LEVELS } from '@data/tajweed';
import { useTajweedStore } from '@store/index';

export default function TajweedLesson() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = TAJWEED_LESSONS.find((l) => l.id === id);
  const { isCompleted, completeLesson, quizScores } = useTajweedStore();
  const [justCompleted, setJustCompleted] = useState(false);

  if (!lesson) return null;

  const level = TAJWEED_LEVELS.find((l) => l.id === lesson.level)!;
  const completed = isCompleted(lesson.id);
  const quizScore = quizScores[lesson.id];

  const handleComplete = () => {
    completeLesson(lesson.id);
    setJustCompleted(true);
    Alert.alert(
      'أحسنت! ✓',
      `تم تسجيل إنهاء درس "${lesson.title}".`,
      [{ text: 'حسناً', style: 'default' }],
    );
  };

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title="درس تجويد" />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: t.spacing.sm, flexWrap: 'wrap' }}>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: level.color + '20' }}>
          <Text variant="label" color={level.color}>{level.titleAr}</Text>
        </View>
        <Text variant="caption" color={t.colors.textTertiary}>{lesson.category}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Clock size={12} color={t.colors.textTertiary} />
          <Text variant="caption" color={t.colors.textTertiary}>{lesson.estimatedMinutes} د</Text>
        </View>
        {completed ? (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 8, paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: t.colors.success + '20',
          }}>
            <CheckCircle2 size={11} color={t.colors.success} />
            <Text variant="caption" color={t.colors.success} style={{ fontWeight: '700' }}>مكتمل</Text>
          </View>
        ) : null}
      </View>

      <Text variant="h1">{lesson.title}</Text>
      <Text variant="body" color={t.colors.textSecondary} style={{ marginTop: 8 }}>{lesson.summary}</Text>

      <Card padding={t.spacing.xl} elevation="sm" style={{ marginTop: t.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={16} color={t.colors.primary} />
          <Text variant="subtitle">شرح الدرس</Text>
        </View>
        <Text variant="body" style={{ lineHeight: 28 }}>{lesson.body}</Text>

        {lesson.example ? (
          <View style={{ marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: t.colors.primarySoft }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Sparkles size={14} color={t.colors.primary} />
              <Text variant="label" color={t.colors.primary}>مثال</Text>
            </View>
            <Text variant="body">{lesson.example}</Text>
          </View>
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: t.spacing.lg }}>
        <Button
          label={completed || justCompleted ? 'تم الإنهاء ✓' : 'أنهيت الدرس'}
          iconLeft={<CheckCircle2 size={16} color="#fff" />}
          variant="primary"
          fullWidth
          onPress={handleComplete}
          disabled={completed || justCompleted}
        />
      </View>

      <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: t.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Trophy size={16} color={t.colors.accent} />
          <Text variant="subtitle">اختبار قصير</Text>
          {quizScore !== undefined ? (
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: t.colors.success + '20', marginStart: 'auto' as any }}>
              <Text variant="caption" color={t.colors.success} style={{ fontWeight: '700' }}>{quizScore}%</Text>
            </View>
          ) : null}
        </View>
        <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 4 }}>
          5 أسئلة لتثبيت ما تعلمت.
        </Text>
        {/* V2: زر الاختبار اتشال - الـ quiz feature مؤجّلة لما نبني أسئلة كافية */}
      </Card>
    </Screen>
  );
}
