import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';

interface Props {
  /** رسم توضيحي مفصّل (SVG) - يُعرض كاملاً دون قصّ */
  illustration: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
  badge?: string;
  badgeColor?: string;
}

/**
 * بطاقة قسم تعرض رسماً توضيحياً مفصّلاً + عنوان.
 * الرسم يأخذ صدارة التصميم - لا دائرة محيطة، فقط ترك المساحة للرسم نفسه.
 */
export const IconCard: React.FC<Props> = ({
  illustration, title, subtitle, onPress, style, badge, badgeColor,
}) => {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: t.colors.primarySoft, borderless: true }}
      style={({ pressed }) => [
        styles.wrap,
        pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 },
        style,
      ]}
    >
      <View style={styles.illustrationWrap}>
        {illustration}
      </View>

      <Text variant="bodySm" align="center" numberOfLines={1} style={[styles.title, { color: t.colors.textPrimary }]}>
        {title}
      </Text>

      {subtitle ? (
        <Text variant="caption" color={t.colors.textTertiary} align="center" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}

      {badge ? (
        <View style={[styles.badge, { borderColor: badgeColor ?? '#B84A3E', backgroundColor: badgeColor ?? '#B84A3E' }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 6,
    position: 'relative',
  },
  illustrationWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 10,
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    // في RTL: end = اليسار، فتظهر الشارة في الزاوية العلوية اليسرى (الزاوية اللاحقة للأيقونة)
    end: -6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 28,
    alignItems: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  badgeText: {
    color: '#FBF7EA',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
