/**
 * رصيعة آية - الدائرة الذهبية الكلاسيكية بداخلها رقم الآية.
 * تُستخدم نهاية كل آية في النص المتتابع.
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
  size = 28,
  goldColor = '#B89456',
  innerColor = '#FBF5E3',
}) => {
  const half = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 32 32" style={StyleSheet.absoluteFill}>
        {/* بتلات نجمة 8 خارجية - ناعمة */}
        <G transform="translate(16 16)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <Path
              key={angle}
              d="M 0 -15 Q 2 -8 0 -2 Q -2 -8 0 -15 Z"
              fill={goldColor}
              opacity={0.85}
              transform={`rotate(${angle})`}
            />
          ))}
        </G>
        {/* الدائرة المركزية بداخلها الرقم */}
        <Circle cx="16" cy="16" r="9" fill={innerColor} stroke={goldColor} strokeWidth={0.8} />
        <Circle cx="16" cy="16" r="7" fill="none" stroke={goldColor} strokeWidth={0.3} opacity={0.6} />
      </Svg>
      <Text
        style={[
          styles.number,
          { color: goldColor, fontSize: size * 0.36 },
        ]}
      >
        {arabicNumber(number)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  number: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
