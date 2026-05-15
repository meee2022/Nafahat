import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';
import { Text } from './Text';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  iconLeft?: React.ReactNode;
  color?: string;
  style?: ViewStyle;
}

export const Chip: React.FC<Props> = ({ label, active, onPress, iconLeft, color, style }) => {
  const t = useTheme();
  const bg = active ? (color ?? t.colors.primary) : t.colors.surface;
  const fg = active ? t.colors.onPrimary : t.colors.textPrimary;
  const border = active ? bg : t.colors.border;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: t.colors.primarySoft, borderless: false }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingHorizontal: 14,
          height: 36,
          borderRadius: t.radius.pill,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {iconLeft ? <View style={{ marginEnd: 6 }}>{iconLeft}</View> : null}
      <Text variant="label" color={fg}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
