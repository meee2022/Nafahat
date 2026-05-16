/**
 * 🌟 رصيعة الآية - الزهرة الذهبية الكلاسيكية بمصحف المدينة.
 *
 * التصميم: نجمة ٨ بتلات ذهبية + دائرة مركزية بداخلها رقم الآية.
 * مستوحاة من رصائع الآيات في مصحف الملك فهد.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { arabicNumber } from '@data/surahs';

interface Props {
  number: number;
  size?: number;
  goldColor?: string;
  innerColor?: string;
}

export const AyahRosette: React.FC<Props> = ({
  number,
  size = 30,
  goldColor = '#B89456',
  innerColor = '#FBF5E3',
}) => {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 32 32" style={StyleSheet.absoluteFill}>
        {/* 8 بتلات خارجية - أكثر امتلاءً */}
        <G transform="translate(16 16)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <Path
              key={angle}
              d="M 0 -14 Q 3 -10 3 -6 Q 3 -2 0 0 Q -3 -2 -3 -6 Q -3 -10 0 -14 Z"
              fill={goldColor}
              opacity={0.95}
              transform={`rotate(${angle})`}
            />
          ))}
        </G>
        {/* حلقة ذهبية رفيعة حول البتلات */}
        <Circle cx="16" cy="16" r="13.5" fill="none" stroke={goldColor} strokeWidth={0.4} opacity={0.5} />
        {/* الدائرة المركزية - يكتب فيها الرقم */}
        <Circle cx="16" cy="16" r="8.5" fill={innerColor} stroke={goldColor} strokeWidth={0.7} />
        <Circle cx="16" cy="16" r="6.5" fill="none" stroke={goldColor} strokeWidth={0.3} opacity={0.45} />
      </Svg>
      <Text
        style={[
          styles.number,
          { color: goldColor, fontSize: size * 0.38 },
        ]}
      >
        {arabicNumber(number)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  number: {
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
