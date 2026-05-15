import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

/**
 * فاصل ذهبي مزخرف - خط رفيع تتوسطه نجمة ثمانية أو رصيعة.
 */
interface Props {
  width?: number;
  color?: string;
  variant?: 'star' | 'rosette' | 'simple';
}

export const OrnamentalRule: React.FC<Props> = ({
  width = 220,
  color = '#B8923B',
  variant = 'star',
}) => {
  const h = 24;

  return (
    <View style={[styles.wrap, { width, height: h }]}>
      <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
        {/* خطان جانبيان */}
        <Path
          d={`M0,${h / 2} L${width / 2 - 14},${h / 2}`}
          stroke={color}
          strokeWidth={0.8}
        />
        <Path
          d={`M${width / 2 + 14},${h / 2} L${width},${h / 2}`}
          stroke={color}
          strokeWidth={0.8}
        />
        {/* نقطة طرفية */}
        <Circle cx={2} cy={h / 2} r={1.5} fill={color} />
        <Circle cx={width - 2} cy={h / 2} r={1.5} fill={color} />

        {variant === 'star' ? (
          <G transform={`translate(${width / 2}, ${h / 2})`}>
            <Path
              d="M0,-8 L2.5,-2.5 L8,0 L2.5,2.5 L0,8 L-2.5,2.5 L-8,0 L-2.5,-2.5 Z"
              fill={color}
            />
          </G>
        ) : variant === 'rosette' ? (
          <G transform={`translate(${width / 2}, ${h / 2})`}>
            <Circle r={5} fill="none" stroke={color} strokeWidth={1} />
            <Circle r={1.6} fill={color} />
          </G>
        ) : (
          <Circle cx={width / 2} cy={h / 2} r={2} fill={color} />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
});
