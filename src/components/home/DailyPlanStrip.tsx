import React from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Sunrise, Brain, RotateCcw, Mic, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, ProgressBar } from '@components/ui';
import { arabicNumber } from '@data/surahs';

interface PlanItem {
  key: string;
  icon: React.ReactNode;
  title: string;
  current: number;
  target: number;
  color: string;
  onPress?: () => void;
}

interface Props {
  pagesRead: number;
  pagesTarget: number;
  newMemoTasks: number;
  reviewTasks: number;
  tasmeeSessions: number;
  onPressWird?: () => void;
  onPressMemo?: () => void;
  onPressReview?: () => void;
  onPressTasmee?: () => void;
}

/**
 * شريط خطة اليوم - 4 بطاقات أفقية متمرّرة.
 * كل بطاقة تعرض: أيقونة + عنوان + رقم + شريط تقدّم صغير.
 */
export const DailyPlanStrip: React.FC<Props> = ({
  pagesRead, pagesTarget,
  newMemoTasks, reviewTasks, tasmeeSessions,
  onPressWird, onPressMemo, onPressReview, onPressTasmee,
}) => {
  const t = useTheme();

  const items: PlanItem[] = [
    {
      key: 'wird',
      icon: <Sunrise size={20} color="#F5A742" strokeWidth={1.8} />,
      title: 'الورد',
      current: pagesRead,
      target: pagesTarget,
      color: '#F5A742',
      onPress: onPressWird,
    },
    {
      key: 'memo',
      icon: <Brain size={20} color="#A2384B" strokeWidth={1.8} />,
      title: 'الحفظ',
      current: 0,
      target: newMemoTasks,
      color: '#A2384B',
      onPress: onPressMemo,
    },
    {
      key: 'review',
      icon: <RotateCcw size={20} color="#3F6F8F" strokeWidth={1.8} />,
      title: 'المراجعة',
      current: 0,
      target: reviewTasks,
      color: '#3F6F8F',
      onPress: onPressReview,
    },
    {
      key: 'tasmee',
      icon: <Mic size={20} color="#B5563C" strokeWidth={1.8} />,
      title: 'التسميع',
      current: 0,
      target: tasmeeSessions,
      color: '#B5563C',
      onPress: onPressTasmee,
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      style={{ marginHorizontal: -16 }}
    >
      {items.map((it) => {
        const pct = it.target > 0 ? it.current / it.target : 0;
        const done = it.current >= it.target && it.target > 0;
        return (
          <Pressable
            key={it.key}
            onPress={it.onPress}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: t.colors.surface,
                borderColor: t.colors.borderGold,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: it.color + '14', borderColor: it.color + '40' }]}>
              {done ? <CheckCircle2 size={20} color={it.color} /> : it.icon}
            </View>

            <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 10, letterSpacing: 1, fontWeight: '700' }}>
              {it.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 }}>
              <Text style={[styles.bigNum, { color: t.colors.textPrimary }]}>
                {arabicNumber(it.current)}
              </Text>
              <Text style={{ fontSize: 13, color: t.colors.textTertiary }}>
                / {arabicNumber(it.target)}
              </Text>
            </View>

            <ProgressBar value={pct} color={it.color} height={4} style={{ marginTop: 10 }} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 130,
    padding: 14,
    borderWidth: 1,
    borderRadius: 4,
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5,
  },
  bigNum: { fontSize: 24, fontWeight: '700', lineHeight: 28, letterSpacing: -0.5 },
});
