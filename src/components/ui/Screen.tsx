import React from 'react';
import { View, ScrollView, RefreshControl, StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useResponsive } from '@hooks/useResponsive';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  paddingHorizontal?: number;
  background?: string;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  /** يعطّل توسيط/تقييد العرض في الشاشات العريضة (لشاشات ملء-الشاشة كالمصحف). */
  fullBleed?: boolean;
}

export const Screen: React.FC<Props> = ({
  children,
  scrollable = true,
  refreshing,
  onRefresh,
  contentStyle,
  paddingHorizontal,
  background,
  edges = ['top'],
  fullBleed = false,
}) => {
  const t = useTheme();
  const r = useResponsive();
  const bg = background ?? t.colors.background;
  const padH = paddingHorizontal ?? t.spacing.lg;

  // في الشاشات العريضة/الأفقية: نقيّد عرض المحتوى ونوسّطه ليبقى مقروءاً
  // بدل التمدّد القبيح على كامل العرض. يُلغى عبر fullBleed.
  const constrain = r.isWide && !fullBleed;
  const wideWrap: ViewStyle | null = constrain
    ? { width: '100%', maxWidth: r.contentMaxWidth, alignSelf: 'center' }
    : null;

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={t.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={bg}
      />
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[
            { paddingHorizontal: padH, paddingBottom: t.spacing.huge },
            constrain ? styles.centerContent : null,
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.colors.primary} /> : undefined}
        >
          {wideWrap ? <View style={wideWrap}>{children}</View> : children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingHorizontal: padH }, contentStyle]}>
          {wideWrap ? <View style={[wideWrap, { flex: 1 }]}>{children}</View> : children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  // عند التقييد: نوسّط المحتوى أفقياً داخل الـ ScrollView العريض.
  centerContent: { alignItems: 'center' },
});
