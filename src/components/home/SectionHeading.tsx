import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeading: React.FC<Props> = ({ eyebrow, title, subtitle, actionLabel, onAction }) => {
  const t = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.box, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
        {/* شريط جانبي ذهبي */}
        <View style={[styles.accentBar, { backgroundColor: t.colors.accent }]} />
        
        <View style={styles.textContainer}>
          {eyebrow ? (
            <Text variant="label" style={{ color: t.colors.accent, marginBottom: 2, fontSize: 13 }}>
              {eyebrow}
            </Text>
          ) : null}
          
          <Text variant="h2" style={{ color: t.colors.textPrimary, fontSize: 22 }}>
            {title}
          </Text>
          
          {subtitle ? (
            <Text variant="caption" style={{ color: t.colors.textTertiary, marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            hitSlop={15}
            style={({ pressed }) => [
              styles.action,
              pressed && { opacity: 0.6 }
            ]}
          >
            <Text variant="label" style={{ color: t.colors.primary, fontSize: 13 }}>
              {actionLabel}
            </Text>
            <ChevronLeft size={16} color={t.colors.primary} strokeWidth={2.5} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    right: 0, 
    top: 0,
    bottom: 0,
    width: 4,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 8,
  },
});
