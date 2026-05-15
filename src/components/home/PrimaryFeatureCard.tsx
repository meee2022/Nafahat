import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';

interface Props {
  title: string;
  subtitle?: string;
  illustration: React.ReactNode;
  onPress?: () => void;
  badge?: string;
  accent?: string;
}

/**
 * بطاقة "Editorial Sanctuary":
 * - بطاقة بـ overlay تدرّج خفيف بلون الـ accent
 * - حدّ ذهبي رقيق
 * - زاوية lg ناعمة
 * - hover effect (translateY + ظل أعمق)
 * - شارة "جديد" بتدرّج بدل لون مسطّح
 */
export const PrimaryFeatureCard: React.FC<Props> = ({
  title, subtitle, illustration, onPress, badge, accent,
}) => {
  const t = useTheme();
  const tint = accent ?? t.colors.accent;
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: t.colors.surface,
          borderColor: hovered ? tint + '55' : t.colors.borderGold,
          transform: [
            { scale: pressed ? 0.98 : (hovered && Platform.OS === 'web' ? 1.012 : 1) },
            { translateY: hovered && !pressed && Platform.OS === 'web' ? -3 : 0 },
          ],
          shadowColor: hovered ? tint : t.colors.shadowColor,
          shadowOffset: { width: 0, height: hovered ? 12 : 4 },
          shadowOpacity: hovered ? 0.20 : 0.06,
          shadowRadius: hovered ? 24 : 10,
          elevation: hovered ? 8 : 2,
        },
      ]}
    >
      {/* تدرّج خلفي خافت بلون الـ accent - يعطي عمقاً */}
      <Svg
        width="100%"
        height="100%"
        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
        pointerEvents="none"
      >
        <Defs>
          <SvgGradient id={`grad-${tint.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={tint} stopOpacity={hovered ? 0.10 : 0.06} />
            <Stop offset="100%" stopColor={tint} stopOpacity="0" />
          </SvgGradient>
        </Defs>
        <Path
          d="M 0 0 L 100% 0 L 100% 100% L 0 100% Z"
          fill={`url(#grad-${tint.replace('#', '')})`}
        />
      </Svg>

      {/* رصيعة زخرفية في الزاوية - أنعم */}
      <View style={[styles.cornerDot, { backgroundColor: tint + '20' }]}>
        <View style={[styles.cornerDotInner, { backgroundColor: tint }]} />
      </View>

      {/* الرسم التوضيحي - مسافة سخية */}
      <View style={styles.illustration}>
        {illustration}
      </View>

      {/* النص - تيبوغرافيا أكبر */}
      <View style={styles.textBlock}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.colors.textPrimary, letterSpacing: -0.2 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: t.colors.textTertiary, marginTop: 3, fontWeight: '500' }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* السهم - أنعم بخلفية ملوّنة */}
      <View style={[
        styles.arrow,
        {
          backgroundColor: hovered ? tint : tint + '14',
        },
      ]}>
        <ArrowLeft size={14} color={hovered ? '#fff' : tint} strokeWidth={2.2} />
      </View>

      {/* شارة "جديد" - بتدرّج وأشكال ناعمة */}
      {badge ? (
        <View style={[styles.badge, { backgroundColor: tint }]}>
          <Sparkles size={9} color="#fff" />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 180,
    padding: 18,
    borderWidth: 1,
    borderRadius: 14,
    position: 'relative',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cornerDot: {
    position: 'absolute',
    top: 12, end: 12,
    width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  cornerDotInner: {
    width: 5, height: 5, borderRadius: 2.5,
  },
  illustration: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  textBlock: {
    marginTop: 14,
  },
  arrow: {
    position: 'absolute',
    bottom: 16,
    end: 16,
    width: 34, height: 34,
    borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ scaleX: -1 }],
  },
  badge: {
    position: 'absolute',
    top: 10, start: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FBF7EA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
