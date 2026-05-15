import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { mColors, mText } from '@theme/manuscript';

interface StatItem {
  value: string;
  label: string;
}

interface Props {
  items: StatItem[];
}

/**
 * صفّ إحصائيات مفصول بنقاط ذهبية:
 *   ٧ آية  •  ١  صفحة  •  ٠٪  من الختمة
 *
 * يُستخدم في HeroReadingCard لعرض تفاصيل آخر قراءة.
 */
export const StatBadge: React.FC<Props> = ({ items }) => {
  return (
    <View style={styles.row}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View style={styles.dot} />}
          <View style={styles.item}>
            <Text style={[mText.amiriLg, styles.value]}>{item.value}</Text>
            <Text style={[mText.caption, styles.label]}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  item: {
    alignItems: 'center',
    minWidth: 56,
  },
  value: {
    color: mColors.gold.light,
    fontSize: 20,
    lineHeight: 24,
  },
  label: {
    color: mColors.text.secondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: mColors.gold.primary,
    opacity: 0.7,
  },
});
