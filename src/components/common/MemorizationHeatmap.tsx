/**
 * 🔥 Memorization Heat-map — يعرض نشاط الحفظ آخر 14 يوم.
 *
 * كل خانة:
 *  - لون فاتح = ما فيش نشاط
 *  - تدرّج أخضر تبعاً لعدد المهام اللي راجعها المستخدم
 *  - حالي اليوم: خانة بحدّ ذهبي مميّز
 *
 * أبسط من Github heatmap وبهوية Nafahat. مكان مثالي: ملخّص الحفظ في tab "الحفظ".
 */
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useMemoStore } from '@store/index';

const DAYS = 14;
const DAY_MS = 86400000;

export const MemorizationHeatmap: React.FC = () => {
  const t = useTheme();
  const tasks = useMemoStore((s) => s.tasks);

  // 🧮 احسب نشاط كل يوم بناءً على lastReviewedAt
  const activity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startMs = today.getTime() - (DAYS - 1) * DAY_MS;

    const counts = new Array(DAYS).fill(0);
    for (const tk of tasks) {
      const ts = tk.lastReviewedAt;
      if (!ts) continue;
      if (ts < startMs) continue;
      const dayIndex = Math.floor((ts - startMs) / DAY_MS);
      if (dayIndex >= 0 && dayIndex < DAYS) counts[dayIndex] += 1;
    }
    return counts;
  }, [tasks]);

  const max = Math.max(1, ...activity);

  const getColor = (count: number) => {
    if (count === 0) return t.colors.borderGold + '30';
    const intensity = count / max;
    if (intensity < 0.25) return t.colors.primary + '30';
    if (intensity < 0.5)  return t.colors.primary + '70';
    if (intensity < 0.85) return t.colors.primary + 'C0';
    return t.colors.primary;
  };

  const totalThisPeriod = activity.reduce((a, b) => a + b, 0);

  return (
    <View style={[styles.wrap, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
      <View style={styles.header}>
        <View>
          <Text style={{ color: t.colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>
            نشاطك آخر ١٤ يوم
          </Text>
          <Text style={{ color: t.colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 2 }}>
            {totalThisPeriod} مراجعة
          </Text>
        </View>
        <View style={styles.legend}>
          <Text style={{ color: t.colors.textTertiary, fontSize: 10 }}>أقل</Text>
          {[0.1, 0.3, 0.6, 1].map((v, i) => (
            <View key={i} style={[styles.legendCell, { backgroundColor: t.colors.primary + Math.round(v * 200).toString(16).padStart(2, '0').toUpperCase() }]} />
          ))}
          <Text style={{ color: t.colors.textTertiary, fontSize: 10 }}>أكثر</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {activity.map((count, idx) => {
          const isToday = idx === DAYS - 1;
          return (
            <View
              key={idx}
              style={[
                styles.cell,
                {
                  backgroundColor: getColor(count),
                  borderColor: isToday ? t.colors.accent : 'transparent',
                  borderWidth: isToday ? 1.5 : 0,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={{ color: t.colors.textTertiary, fontSize: 11 }}>
          {totalThisPeriod === 0
            ? 'ابدأ أوّل مراجعة اليوم — حتى آية واحدة تكفي!'
            : `أنت تستثمر في حفظك — حافظ على العادة 🌿`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendCell: {
    width: 10, height: 10, borderRadius: 3,
  },
  grid: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 4,
    maxWidth: 24,
  },
  footer: {
    marginTop: 10,
  },
});
