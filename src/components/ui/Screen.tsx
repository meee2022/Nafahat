import React from 'react';
import { View, ScrollView, RefreshControl, StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  paddingHorizontal?: number;
  background?: string;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
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
}) => {
  const t = useTheme();
  const bg = background ?? t.colors.background;
  const padH = paddingHorizontal ?? t.spacing.lg;

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={t.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={bg}
      />
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[{ paddingHorizontal: padH, paddingBottom: t.spacing.huge }, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.colors.primary} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingHorizontal: padH }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
