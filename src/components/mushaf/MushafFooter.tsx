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
  /** 🆕 نص اختياري للحزب/الربع — يظهر بجانب رقم الصفحة (مثلاً "الحزب ٣ · النصف") */
  hizbLabel?: string;
  goldColor?: string;
  goldDeep?: string;
  textColor?: string;
  pageColor?: string;
  amiriFont: string;
  onPagePress?: () => void;
}

export const MushafFooter: React.FC<Props> = ({
  pageNumber,
  hizbLabel,
  goldColor = MUSHAF_GOLD,
  pageColor = MUSHAF_BG,
  textColor = MUSHAF_INK,
  amiriFont,
  onPagePress,
}) => {
  return (
    <View style={[styles.wrap, { backgroundColor: pageColor }]}>
      {/* page badge مركزية + Hizb label اختياري */}
      <View style={styles.row}>
        {hizbLabel ? (
          <Text style={[styles.hizbLabel, { color: textColor + 'BB' }]} numberOfLines={1}>
            {hizbLabel}
          </Text>
        ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  hizbLabel: {
    fontSize: 11,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0,     // العربية تتفكّك مع letterSpacing
    flex: 0,
  },
  pageBadge: {
    minWidth: 64,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pageNumber: {
    fontSize: 14,
    lineHeight: 24,        // مساحة كافية لأرقام خط المصحف حتى لا تُقصّ
    fontWeight: '800',
    includeFontPadding: false,
  },
});
