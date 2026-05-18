/**
 * 💎 Skeleton loader — placeholder بحركة shimmer ذهبية خفيفة.
 *
 * أفضل من ActivityIndicator العادي لأنه:
 *  - بيحاكي شكل المحتوى القادم → الـ UX يحس أسرع
 *  - بهوية أخضر/ذهبي بدل spinner generic
 *
 * الاستخدام:
 *   <Skeleton width={200} height={20} />
 *   <SkeletonCard />          ← بطاقة كاملة (avatar + title + subtitle)
 *   <SkeletonList count={5} />← قائمة من البطاقات
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, radius = 6, style }) => {
  const t = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: t.colors.borderGold,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} radius={12} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={11} />
        </View>
      </View>
    </View>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <View style={{ gap: 8 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
