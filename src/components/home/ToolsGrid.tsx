import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';

export interface ToolItem {
  key: string;
  title: string;
  illustration: React.ReactNode;
  onPress?: () => void;
  badge?: string;
}

interface Props {
  items: ToolItem[];
  columns?: 3 | 4;
}

/**
 * شبكة أدوات معاد تصميمها - "Editorial Sanctuary":
 * - بدل الحدّ العريض، حدّ رفيع + خلفية ناعمة
 * - زاوية md ناعمة
 * - hover effect على web (lift + tint)
 * - شارة بتدرّج لطيف
 */
export const ToolsGrid: React.FC<Props> = ({ items, columns = 4 }) => {
  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <View key={it.key} style={{ width: `${100 / columns}%` as any, padding: 5 }}>
          <ToolCell item={it} />
        </View>
      ))}
    </View>
  );
};

const ToolCell: React.FC<{ item: ToolItem }> = ({ item }) => {
  const t = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={item.onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.cell,
        {
          backgroundColor: hovered ? t.colors.accent + '08' : t.colors.surface,
          borderColor: hovered ? t.colors.accent + '40' : t.colors.border,
          transform: [
            { scale: pressed ? 0.96 : (hovered && Platform.OS === 'web' ? 1.03 : 1) },
            { translateY: hovered && !pressed && Platform.OS === 'web' ? -2 : 0 },
          ],
          shadowColor: t.colors.shadowColor,
          shadowOffset: { width: 0, height: hovered ? 8 : 1 },
          shadowOpacity: hovered ? 0.10 : 0.03,
          shadowRadius: hovered ? 16 : 4,
          elevation: hovered ? 4 : 1,
        },
      ]}
    >
      <View style={styles.illustration}>{item.illustration}</View>
      <Text
        style={{
          marginTop: 8,
          fontSize: 12.5,
          fontWeight: '600',
          color: t.colors.textPrimary,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {item.title}
      </Text>

      {item.badge ? (
        <View style={[styles.badge, { backgroundColor: t.colors.accent }]}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  cell: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    minHeight: 102,
    position: 'relative',
  },
  illustration: {
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6, end: 6,
    paddingHorizontal: 7, paddingVertical: 2.5,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FBF7EA',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
