import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { Card, Text } from '@components/ui';

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  color?: string;
  flex?: number;
}

export const StatCard: React.FC<Props> = ({ icon, label, value, hint, color, flex = 1 }) => {
  const t = useTheme();
  const tint = color ?? t.colors.primary;
  return (
    <Card elevation="xs" padding={t.spacing.lg} style={[styles.card, { flex }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" color={t.colors.textSecondary}>{label}</Text>
        <View style={[styles.iconWrap, { backgroundColor: tint + '22', borderRadius: t.radius.sm }]}>
          {icon}
        </View>
      </View>
      <Text variant="h1" color={t.colors.textPrimary} style={{ marginTop: 8 }}>{value}</Text>
      {hint ? <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>{hint}</Text> : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { minHeight: 110 },
  iconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
