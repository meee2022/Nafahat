import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface Props {
  value: number;        // 0..1
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
  rounded?: boolean;
}

export const ProgressBar: React.FC<Props> = ({
  value, height = 8, color, trackColor, style, rounded = true,
}) => {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: rounded ? height : 0,
          backgroundColor: trackColor ?? t.colors.surfaceAlt,
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          borderRadius: rounded ? height : 0,
          backgroundColor: color ?? t.colors.primary,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
