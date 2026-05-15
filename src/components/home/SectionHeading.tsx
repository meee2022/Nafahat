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

/**
 * ترويسة قسم - "Manuscript Cartouche":
 * - إطار مزخرف يشبه الـ cartouche في المخطوطات الإسلامية
 * - حدود ذهبية مزدوجة (سميك ورفيع) على اليمين واليسار
 * - معيّنات ذهبية في الأركان
 * - شارة eyebrow صغيرة فوق العنوان
 * - زر action دائري على الجانب
 */
export const SectionHeading: React.FC<Props> = ({ eyebrow, title, subtitle, actionLabel, onAction }) => {
  const t = useTheme();
  const goldStrong = t.colors.accent;
  const goldSoft = t.colors.accent + '30';

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {/* الإطار المزخرف */}
        <View style={[styles.cartouche, { borderColor: goldSoft, backgroundColor: t.colors.accent + '08' }]}>
          {/* خطوط ذهبية مزدوجة (يمين) */}
          <View style={styles.borderRight}>
            <View style={[styles.borderThick, { backgroundColor: goldStrong }]} />
            <View style={[styles.borderThin, { backgroundColor: goldStrong }]} />
          </View>
          {/* خطوط ذهبية مزدوجة (يسار) */}
          <View style={styles.borderLeft}>
            <View style={[styles.borderThick, { backgroundColor: goldStrong }]} />
            <View style={[styles.borderThin, { backgroundColor: goldStrong }]} />
          </View>

          {/* معيّنات الأركان */}
          <View style={[styles.cornerDiamond, styles.cornerTR, { borderColor: goldStrong }]} />
          <View style={[styles.cornerDiamond, styles.cornerTL, { borderColor: goldStrong }]} />
          <View style={[styles.cornerDiamond, styles.cornerBR, { borderColor: goldStrong }]} />
          <View style={[styles.cornerDiamond, styles.cornerBL, { borderColor: goldStrong }]} />

          {/* المحتوى */}
          <View style={styles.content}>
            {eyebrow ? (
              <View style={[styles.eyebrowBadge, { borderColor: goldStrong, backgroundColor: t.colors.background }]}>
                <View style={[styles.eyebrowDot, { backgroundColor: goldStrong }]} />
                <Text style={[styles.eyebrowText, { color: goldStrong }]}>{eyebrow}</Text>
                <View style={[styles.eyebrowDot, { backgroundColor: goldStrong }]} />
              </View>
            ) : null}

            <Text style={[styles.title, { color: t.colors.textPrimary }]}>{title}</Text>

            {subtitle ? (
              <Text style={[styles.subtitle, { color: t.colors.textTertiary }]}>{subtitle}</Text>
            ) : null}
          </View>
        </View>

        {/* زر الإجراء */}
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            hitSlop={10}
            style={[styles.action, { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent + '40' }]}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.colors.accent, letterSpacing: 0.3 }}>
              {actionLabel}
            </Text>
            <ChevronLeft size={13} color={t.colors.accent} strokeWidth={2.5} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 36,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartouche: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  borderRight: {
    position: 'absolute',
    right: 6,
    top: 8,
    bottom: 8,
    flexDirection: 'row',
    gap: 2,
  },
  borderLeft: {
    position: 'absolute',
    left: 6,
    top: 8,
    bottom: 8,
    flexDirection: 'row',
    gap: 2,
  },
  borderThick: {
    width: 2,
    height: '100%',
    borderRadius: 1,
  },
  borderThin: {
    width: 0.7,
    height: '100%',
    opacity: 0.5,
  },
  cornerDiamond: {
    position: 'absolute',
    width: 7, height: 7,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'transparent',
  },
  cornerTR: { top: -4, right: 16 },
  cornerTL: { top: -4, left: 16 },
  cornerBR: { bottom: -4, right: 16 },
  cornerBL: { bottom: -4, left: 16 },
  content: {
    alignItems: 'center',
    gap: 8,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: -2,
  },
  eyebrowDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.8,
  },
  eyebrowText: {
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
});
