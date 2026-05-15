import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconCard } from './IconCard';

export interface FeatureItem {
  key: string;
  title: string;
  subtitle?: string;
  illustration: React.ReactNode;
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
}

interface Props {
  items: FeatureItem[];
  columns?: 2 | 3 | 4;
}

export const FeatureGrid: React.FC<Props> = ({ items, columns = 4 }) => {
  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <View key={it.key} style={{ width: `${100 / columns}%`, paddingHorizontal: 4, paddingVertical: 6 }}>
          <IconCard
            illustration={it.illustration}
            title={it.title}
            subtitle={it.subtitle}
            onPress={it.onPress}
            badge={it.badge}
            badgeColor={it.badgeColor}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
});
