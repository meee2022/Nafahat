/**
 * 📜 ترويسة المصحف - تصميم عثماني هادئ يتناسق مع الإطار.
 *
 * البنية:
 *  - شريط زخرفة موجي علوي رفيع (نفس نمط شرائط الإطار).
 *  - cartouches مدوّرة قليلاً بحدود ذهبية ناعمة لاسم السورة والجزء.
 *  - الكل بخلفية عاجية دافئة.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MUSHAF_GOLD, MUSHAF_BG, MUSHAF_INK } from './MushafBorder';

interface Props {
  juzLabel: string;
  surahName: string;
  /** الذهبي الأساسي - من theme palette */
  goldColor?: string;
  goldDeep?: string;
  /** خلفية الـ chrome (عاجي في light، داكن في dark) */
  pageColor?: string;
  /** لون النص داخل الـ cartouches */
  textColor?: string;
  quranFont: string;
  onSurahPress?: () => void;
  onJuzPress?: () => void;
}

export const MushafHeader: React.FC<Props> = ({
  juzLabel,
  surahName,
  goldColor = MUSHAF_GOLD,
  pageColor = MUSHAF_BG,
  textColor = MUSHAF_INK,
  quranFont,
  onSurahPress,
  onJuzPress,
}) => {
  return (
    <View style={[styles.wrap, { backgroundColor: pageColor }]}>
      {/* Cartouches - بدون ornament strip (الإطار نفسه فيه شريط زخرفي) */}
      <View style={styles.row}>
        <Cartouche text={juzLabel} font={quranFont} goldColor={goldColor} pageColor={pageColor} textColor={textColor} onPress={onJuzPress} />
        <View style={{ width: 12 }} />
        <Cartouche text={surahName} font={quranFont} goldColor={goldColor} pageColor={pageColor} textColor={textColor} onPress={onSurahPress} />
      </View>
    </View>
  );
};

/**
 * Cartouche - كبسولة بحدود ذهبية ناعمة مدوّرة قليلاً.
 */
const Cartouche: React.FC<{
  text: string; font: string; goldColor: string; pageColor: string; textColor: string; onPress?: () => void;
}> = ({ text, font, goldColor, pageColor, textColor, onPress }) => (
  <Pressable
    onPress={onPress}
    hitSlop={5}
    accessibilityRole="button"
    style={({ pressed }) => [
      styles.cartouche,
      { borderColor: goldColor, backgroundColor: pageColor, opacity: pressed ? 0.7 : 1 },
    ]}
  >
    <Text
      style={[styles.cartoucheText, { color: textColor, fontFamily: font }]}
      numberOfLines={1}
    >
      {text}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  cartouche: {
    flex: 1,
    minHeight: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cartoucheText: {
    fontSize: 13,
    lineHeight: 22,        // مساحة كافية لخط المصحف الطويل حتى لا يُقصّ
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
