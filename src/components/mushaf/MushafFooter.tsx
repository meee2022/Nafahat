/**
 * 📜 تذييل المصحف - تصميم عثماني هادئ يتناسق مع الإطار.
 *
 * البنية:
 *  - شريط زخرفة موجية رفيع (مرآة للهيدر).
 *  - badge مدوّرة قليلاً برقم الصفحة بحدود ذهبية ناعمة.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { OrnamentStrip, MUSHAF_GOLD, MUSHAF_BG, MUSHAF_INK } from './MushafBorder';
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
  const { width: screenW } = useWindowDimensions();
  const stripW = Math.min(screenW, 900) - 24;

  return (
    <View style={[styles.wrap, { backgroundColor: pageColor }]}>
      {/* شريط زخرفة موجية رفيعة - مرآة للهيدر، يستخدم ألوان theme */}
      <View style={styles.stripWrap}>
        <OrnamentStrip length={stripW} isVertical={false} goldColor={goldColor} bgColor={pageColor} />
      </View>

      {/* page badge مركزية */}
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
    paddingBottom: 4,
  },
  stripWrap: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  row: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pageBadge: {
    width: 80,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
});
