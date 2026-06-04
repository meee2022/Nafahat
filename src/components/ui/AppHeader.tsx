import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronRight, Search, Settings } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from './Text';
import { TOP_BAR_PAD } from '@utils/safeArea';

interface Props {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
  right?: React.ReactNode;
  large?: boolean;
}

/**
 * ترويسة "Editorial Sanctuary":
 * - أزرار دائرية أنعم بحدّ رفيع جداً
 * - subtitle بـ eyebrow style (uppercase + letterSpacing) فوق العنوان
 * - عنوان أكبر وأجرأ
 * - مسافة سفلية أوسع
 */
export const AppHeader: React.FC<Props> = ({
  title,
  subtitle,
  onBack,
  onSearch,
  onSettings,
  right,
  large,
}) => {
  const t = useTheme();
  return (
    <View style={[styles.row, { marginBottom: t.spacing.xl }]}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={t.hitSlop}
            accessible
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            accessibilityHint="العودة للشاشة السابقة"
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: t.colors.surface,
                borderColor: t.colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <ChevronRight size={20} color={t.colors.textPrimary} strokeWidth={1.8} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        {subtitle ? (
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrowDot, { backgroundColor: t.colors.accent }]} />
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{subtitle}</Text>
            <View style={[styles.eyebrowDot, { backgroundColor: t.colors.accent }]} />
          </View>
        ) : null}
        {title ? (
          <Text
            style={{
              fontSize: large ? 28 : 20,
              lineHeight: large ? 34 : 26,
              fontWeight: '800',
              color: t.colors.textPrimary,
              letterSpacing: -0.5,
              textAlign: 'center',
              marginTop: subtitle ? 4 : 0,
            }}
          >
            {title}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {right ?? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {onSearch ? (
              <Pressable
                onPress={onSearch}
                hitSlop={t.hitSlop}
                accessible
                accessibilityRole="button"
                accessibilityLabel="بحث"
                style={[styles.iconBtn, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
              >
                <Search size={18} color={t.colors.textPrimary} strokeWidth={1.8} />
              </Pressable>
            ) : null}
            {onSettings ? (
              <Pressable
                onPress={onSettings}
                hitSlop={t.hitSlop}
                accessible
                accessibilityRole="button"
                accessibilityLabel="الإعدادات"
                style={[styles.iconBtn, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
              >
                <Settings size={18} color={t.colors.textPrimary} strokeWidth={1.8} />
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    // 📏 يحترم الـ safe area (الشقّ/Dynamic Island) فلا يطلع زر الرجوع تحت الساعة.
    paddingTop: TOP_BAR_PAD,
  },
  left:   { minWidth: 44, alignItems: 'flex-start' },
  right:  { minWidth: 44, alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDot: {
    width: 4, height: 4, borderRadius: 2,
  },
  eyebrow: {
    fontSize: 10, letterSpacing: 3, fontWeight: '700',
  },
});
