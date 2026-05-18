/**
 * 📜 تذييل المصحف - تصميم عثماني هادئ يتناسق مع الإطار.
 *
 * البنية:
 *  - شريط زخرفة موجية رفيع (مرآة للهيدر).
 *  - badge مدوّرة قليلاً برقم الصفحة بحدود ذهبية ناعمة.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MUSHAF_GOLD, MUSHAF_BG, MUSHAF_INK } from './MushafBorder';
import { arabicNumber } from '@data/surahs';

interface Props {
  pageNumber: number;
  goldColor?: string;
  goldDeep?: string;
  textColor?: string;
  pageColor?: string;
  amiriFont: string;
  onPagePress?: () => void;
}

export const MushafFooter: React.FC<Props> = ({
  pageNumber,
  goldColor = MUSHAF_GOLD,
  pageColor = MUSHAF_BG,
  textColor = MUSHAF_INK,
  amiriFont,
  onPagePress,
}) => {
  return (
    <View style={[styles.wrap, { backgroundColor: pageColor }]}>
      {/* page badge مركزية - بدون ornament strip (الإطار نفسه فيه شريط زخرفي) */}
      <View style={styles.row}>
        <Pressable
          onPress={onPagePress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`الصفحة ${pageNumber} - اضغط للانتقال`}
          style={({ pressed }) => [
            styles.pageBadge,
            { borderColor: goldColor, backgroundColor: pageColor, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.pageNumber, { color: textColor, fontFamily: amiriFont }]}>
            {arabicNumber(pageNumber)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 2,
  },
  row: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  pageBadge: {
    width: 64,
    height: 26,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
});
