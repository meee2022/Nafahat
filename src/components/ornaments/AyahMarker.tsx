import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Text } from '@components/ui';
import { useTheme } from '@theme/index';
import { arabicNumber } from '@data/surahs';

/**
 * رصيعة آية - الرسم الذي يحيط برقم الآية في المصاحف الفاخرة.
 * يستخدم نمط الـ "رصيعة" التقليدي: دائرة محاطة بنجمة 12 بتلة.
 */
interface Props {
  number: number;
  size?: number;
  color?: string;
  innerColor?: string;
  textColor?: string;
}

export const AyahMarker: React.FC<Props> = ({
  number,
  size = 36,
  color,
  innerColor,
  textColor,
}) => {
  const t = useTheme();
  const stroke = color ?? t.colors.accent;
  const inner = innerColor ?? t.colors.surface;
  const text = textColor ?? t.colors.accentDeep;

  // 12 بتلة حول الدائرة المركزية
  const petals: string[] = [];
  const cx = 50, cy = 50;
  for (let i = 0; i < 12; i++) {
    const angle = (i * 2 * Math.PI) / 12;
    const x1 = cx + 32 * Math.cos(angle);
    const y1 = cy + 32 * Math.sin(angle);
    const x2 = cx + 46 * Math.cos(angle);
    const y2 = cy + 46 * Math.sin(angle);
    const a1 = angle + 0.18;
    const a2 = angle - 0.18;
    const xa = cx + 40 * Math.cos(a1);
    const ya = cy + 40 * Math.sin(a1);
    const xb = cx + 40 * Math.cos(a2);
    const yb = cy + 40 * Math.sin(a2);
    petals.push(`M${x1},${y1} L${xa},${ya} L${x2},${y2} L${xb},${yb} Z`);
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="ayahGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={inner} stopOpacity="1" />
            <Stop offset="100%" stopColor={inner} stopOpacity="0.6" />
          </RadialGradient>
        </Defs>
        {/* البتلات الخارجية */}
        <G>
          {petals.map((d, i) => (
            <Path key={i} d={d} fill={stroke} opacity={0.85} />
          ))}
        </G>
        {/* الحلقة الذهبية */}
        <Circle cx={cx} cy={cy} r={32} fill={stroke} />
        <Circle cx={cx} cy={cy} r={28} fill="url(#ayahGrad)" />
        <Circle cx={cx} cy={cy} r={28} stroke={stroke} strokeWidth={0.6} fill="none" />
      </Svg>
      <View style={styles.number} pointerEvents="none">
        <Text variant="caption" color={text} style={styles.numText}>
          {arabicNumber(number)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  number: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  numText: { fontWeight: '700', fontSize: 11 },
});
