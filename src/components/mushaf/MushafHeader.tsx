/**
 * 📜 ترويسة المصحف المرجعية (King Fahd Style)
 * لا تحتوي على أزرار، مجرد إطارين زخرفيين لاسم السورة والجزء
 * مع خلفية من النقش الإسلامي.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Svg, { Path, Rect, Defs, Pattern, G, Circle } from 'react-native-svg';

interface Props {
  juzLabel: string;
  surahName: string;
  goldColor?: string;
  goldDeep?: string;
  pageColor?: string;
  quranFont: string;
  onSurahPress?: () => void;
  onJuzPress?: () => void;
}

export const MushafHeader: React.FC<Props> = ({
  juzLabel,
  surahName,
  goldColor = '#BE995E',
  goldDeep = '#8B6239',
  pageColor = '#FFFFFF',
  quranFont,
  onSurahPress,
  onJuzPress,
}) => {
  return (
    <View style={[styles.wrap, { borderColor: goldDeep, backgroundColor: pageColor }]}>
      {/* خلفية النقش الإسلامي */}
      <View style={[StyleSheet.absoluteFill, { padding: 2 }]}>
         <TopLacePattern color={goldDeep} accent={goldColor} />
      </View>

      <View style={styles.cartouchesRow}>
        <Cartouche text={juzLabel} font={quranFont} color={goldDeep} pageColor={pageColor} onPress={onJuzPress} />
        <View style={{ width: 20 }} />
        <Cartouche text={surahName} font={quranFont} color={goldDeep} pageColor={pageColor} onPress={onSurahPress} />
      </View>
    </View>
  );
};

const Cartouche: React.FC<{ text: string; font: string; color: string; pageColor: string; onPress?: () => void }> = ({
  text, font, color, pageColor, onPress
}) => (
  <Pressable onPress={onPress} hitSlop={5} style={styles.cartoucheContainer}>
    {/* شكل الخرطوش (مستطيل بأطراف مثلثة) */}
    <View style={[StyleSheet.absoluteFill, { backgroundColor: pageColor, borderColor: color, borderWidth: 1.5, borderRadius: 24 }]} />
    <Text style={[styles.cartoucheText, { color: color, fontFamily: font, paddingTop: Platform.OS === 'ios' ? 4 : 0 }]}>
      {text}
    </Text>
  </Pressable>
);

const TopLacePattern: React.FC<{ color: string; accent: string }> = ({ color, accent }) => (
  <Svg width="100%" height="100%" preserveAspectRatio="none">
    <Defs>
      <Pattern id="topLace" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
        <G>
          <Path d="M6 1 L7 6 L11 7 L7 8 L6 11 L5 8 L1 7 L5 6 Z" fill={color} opacity={0.6} />
          <Circle cx="6" cy="6" r="1.5" fill={accent} opacity={0.8} />
          <Circle cx="0" cy="0" r="1" fill={color} opacity={0.5} />
          <Circle cx="12" cy="12" r="1" fill={color} opacity={0.5} />
        </G>
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#topLace)" />
  </Svg>
);

const styles = StyleSheet.create({
  wrap: {
    height: 48,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    marginHorizontal: 0,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cartouchesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cartoucheContainer: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartoucheText: {
    fontSize: 20,
    marginTop: -4,
  },
});
