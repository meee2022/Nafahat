/**
 * 📜 تذييل المصحف المرجعي (King Fahd Style)
 * لا يحتوي على أزرار معاصرة، مجرد امتداد للإطار الزخرفي مع رقم الصفحة في المنتصف
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Defs, Pattern, G, Circle } from 'react-native-svg';
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
  goldColor = '#BE995E',
  goldDeep  = '#8B6239',
  textColor = '#000000',
  pageColor = '#FFFFFF',
  amiriFont,
  onPagePress,
}) => {
  return (
    <View style={[styles.wrap, { borderColor: goldDeep, backgroundColor: pageColor }]}>
      {/* خلفية النقش الإسلامي */}
      <View style={[StyleSheet.absoluteFill, { padding: 2 }]}>
         <BottomLacePattern color={goldDeep} accent={goldColor} />
      </View>

      <View style={styles.centerWrap}>
        <Pressable onPress={onPagePress} hitSlop={10} style={styles.cartoucheContainer}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: pageColor, borderColor: goldDeep, borderWidth: 1.5, borderRadius: 24 }]} />
          <Text style={[styles.cartoucheText, { color: goldDeep, fontFamily: amiriFont }]}>
            {arabicNumber(pageNumber)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const BottomLacePattern: React.FC<{ color: string; accent: string }> = ({ color, accent }) => (
  <Svg width="100%" height="100%" preserveAspectRatio="none">
    <Defs>
      <Pattern id="botLace" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
        <G>
          <Path d="M6 1 L7 6 L11 7 L7 8 L6 11 L5 8 L1 7 L5 6 Z" fill={color} opacity={0.6} />
          <Circle cx="6" cy="6" r="1.5" fill={accent} opacity={0.8} />
          <Circle cx="0" cy="0" r="1" fill={color} opacity={0.5} />
          <Circle cx="12" cy="12" r="1" fill={color} opacity={0.5} />
        </G>
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#botLace)" />
  </Svg>
);

const styles = StyleSheet.create({
  wrap: {
    height: 44,
    borderWidth: 1.5,
    borderTopWidth: 0,
    marginHorizontal: 0,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartoucheContainer: {
    width: 60,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartoucheText: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: -2,
  },
});
