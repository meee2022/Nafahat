import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { arabicNumber } from '@data/surahs';

interface Props {
  data: number[];           // 7 قيم (سبت..جمعة)
  unit?: string;            // مثلاً "دقيقة"
  height?: number;
}

const W = Dimensions.get('window').width - 32 - 36;  // عرض الشاشة - padding البطاقة

const DAYS_AR = ['س', 'أ', 'ث', 'ر', 'خ', 'ج', 'سب'];

/**
 * رسم بياني أسبوعي SVG:
 * - خطوط شبكة أفقية
 * - أعمدة بتدرّج لوني
 * - قيمة فوق كل عمود عند التحديد
 * - متوسط أسبوعي + قمة
 */
export const WeeklyChart: React.FC<Props> = ({ data, unit = 'دقيقة', height = 180 }) => {
  const t = useTheme();
  const [selected, setSelected] = useState<number | null>(null);

  const stats = useMemo(() => {
    const max = Math.max(...data, 1);
    const sum = data.reduce((a, b) => a + b, 0);
    const avg = data.length > 0 ? sum / data.length : 0;
    const peak = data.indexOf(max);
    return { max, sum, avg, peak };
  }, [data]);

  const chartH = height - 40;       // مساحة للأرقام تحت
  const barW = (W - 12) / 7;        // عرض كل عمود
  const padTop = 20;                // مساحة فوق للقيم
  const usableH = chartH - padTop;

  // 4 خطوط شبكة (0%, 25%, 50%, 75%, 100%)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: padTop + usableH * (1 - p),
    pct: p,
  }));

  return (
    <View>
      {/* القمم + المتوسط */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text variant="caption" color={t.colors.textTertiary} style={{ letterSpacing: 1 }}>متوسط</Text>
          <Text style={[styles.metaNum, { color: t.colors.textPrimary }]}>
            {arabicNumber(Math.round(stats.avg))} <Text style={{ fontSize: 11, color: t.colors.textTertiary }}>{unit}</Text>
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: t.colors.borderGold }]} />
        <View style={styles.metaItem}>
          <Text variant="caption" color={t.colors.textTertiary} style={{ letterSpacing: 1 }}>الذروة</Text>
          <Text style={[styles.metaNum, { color: t.colors.accent }]}>
            {arabicNumber(stats.max)} <Text style={{ fontSize: 11, color: t.colors.textTertiary }}>{unit}</Text>
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: t.colors.borderGold }]} />
        <View style={styles.metaItem}>
          <Text variant="caption" color={t.colors.textTertiary} style={{ letterSpacing: 1 }}>الإجمالي</Text>
          <Text style={[styles.metaNum, { color: t.colors.primary }]}>
            {arabicNumber(stats.sum)}
          </Text>
        </View>
      </View>

      {/* الرسم */}
      <View style={{ height, marginTop: 14 }}>
        <Svg width={W} height={height}>
          <Defs>
            <SvgGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={t.colors.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={t.colors.primary} stopOpacity="0.4" />
            </SvgGradient>
            <SvgGradient id="todayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={t.colors.accent} stopOpacity="1" />
              <Stop offset="100%" stopColor={t.colors.accent} stopOpacity="0.5" />
            </SvgGradient>
          </Defs>

          {/* خطوط الشبكة */}
          {gridLines.map((g, i) => (
            <Line
              key={i}
              x1={0} y1={g.y} x2={W} y2={g.y}
              stroke={t.colors.borderGold}
              strokeWidth={i === 0 || i === 4 ? 0.8 : 0.3}
              strokeDasharray={i === 0 || i === 4 ? undefined : '2,3'}
              opacity={0.5}
            />
          ))}

          {/* الأعمدة */}
          {data.map((v, i) => {
            const h = stats.max > 0 ? (v / stats.max) * usableH : 0;
            const x = i * barW + 6;
            const y = padTop + usableH - h;
            const isToday = i === data.length - 1;
            const isSelected = selected === i;
            const fillUrl = isToday ? 'url(#todayGrad)' : 'url(#barGrad)';
            const barWidth = barW - 8;

            return (
              <React.Fragment key={i}>
                {/* قاعدة شفّافة للنقر */}
                <Rect
                  x={i * barW} y={0}
                  width={barW} height={chartH}
                  fill="transparent"
                  onPress={() => setSelected(selected === i ? null : i)}
                />

                {/* العمود */}
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(h, 2)}
                  fill={fillUrl}
                  rx={2}
                />

                {/* قمة لامعة */}
                {h > 6 ? (
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={3}
                    fill={isToday ? t.colors.accentDeep : t.colors.primaryDark}
                    rx={2}
                  />
                ) : null}

                {/* قيمة فوق العمود عند التحديد */}
                {isSelected ? (
                  <>
                    <Rect
                      x={x + barWidth / 2 - 16}
                      y={Math.max(0, y - 22)}
                      width={32} height={18}
                      fill={t.colors.textPrimary}
                      rx={3}
                    />
                    <SvgText
                      x={x + barWidth / 2}
                      y={Math.max(13, y - 10)}
                      fontSize={11}
                      fontWeight="700"
                      fill={t.colors.background}
                      textAnchor="middle"
                    >
                      {arabicNumber(v)}
                    </SvgText>
                  </>
                ) : null}
              </React.Fragment>
            );
          })}

          {/* خط المتوسط */}
          {stats.avg > 0 ? (
            <Line
              x1={0}
              y1={padTop + usableH - (stats.avg / stats.max) * usableH}
              x2={W}
              y2={padTop + usableH - (stats.avg / stats.max) * usableH}
              stroke={t.colors.accent}
              strokeWidth={0.8}
              strokeDasharray="4,4"
              opacity={0.7}
            />
          ) : null}

          {/* أسماء الأيام */}
          {DAYS_AR.map((d, i) => {
            const x = i * barW + barW / 2;
            const isToday = i === data.length - 1;
            return (
              <SvgText
                key={i}
                x={x}
                y={height - 8}
                fontSize={11}
                fontWeight={isToday ? '700' : '500'}
                fill={isToday ? t.colors.primary : t.colors.textTertiary}
                textAnchor="middle"
              >
                {d}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  metaItem: { flex: 1, alignItems: 'center', gap: 4 },
  divider: { width: 1, height: 28 },
  metaNum: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
});
