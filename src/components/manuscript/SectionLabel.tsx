import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { mColors, mText, mSpacing } from '@theme/manuscript';

interface Props {
  eyebrow?: string;
  title: string;
}

/**
 * عنوان قسم بأسلوب "Illuminated Manuscript":
 *   ◆  ابدأ الآن
 *   رحلتك اليومية
 *
 * - eyebrow ذهبي صغير مع نقطة ذهبية مزخرفة على الجانب
 * - title بخط Naskh Bold كبير بلون عاج
 */
export const SectionLabel: React.FC<Props> = ({ eyebrow, title }) => {
  return (
    <View style={styles.wrap}>
      {eyebrow ? (
        <View style={styles.eyebrowRow}>
          <View style={styles.diamond} />
          <Text style={[mText.eyebrow, styles.eyebrowText]}>{eyebrow}</Text>
          <View style={styles.line} />
        </View>
      ) : null}
      <Text style={[mText.h2, styles.title]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: mSpacing.lg,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: mColors.gold.primary,
    transform: [{ rotate: '45deg' }],
  },
  eyebrowText: {
    color: mColors.gold.primary,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: mColors.gold.dim,
    opacity: 0.35,
    marginStart: 4,
  },
  title: {
    color: mColors.text.primary,
  },
});
