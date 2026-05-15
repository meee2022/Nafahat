import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { Text } from './Text';
import { Button } from './Button';

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({ icon, title, description, actionLabel, onAction }) => {
  const t = useTheme();
  return (
    <View style={[styles.wrap, { paddingVertical: t.spacing.huge }]}>
      {icon ? (
        <View style={[styles.iconBox, { backgroundColor: t.colors.primarySoft, borderRadius: t.radius.xxl, marginBottom: t.spacing.lg }]}>
          {icon}
        </View>
      ) : null}
      <Text variant="h3" align="center" style={{ marginBottom: 6 }}>{title}</Text>
      {description ? <Text variant="body" align="center" color={t.colors.textSecondary} style={{ maxWidth: 280 }}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: t.spacing.lg }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  iconBox: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
});
