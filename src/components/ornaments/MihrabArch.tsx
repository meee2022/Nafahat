import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, G, Circle } from 'react-native-svg';

/**
 * قوس محراب مزخرف - يُستخدم كإطار علوي لبطاقات السور.
 */
interface Props {
  width?: number;
  height?: number;
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  showCrown?: boolean;
}

export const MihrabArch: React.FC<Props> = ({
  width = 280,
  height = 360,
  fill = '#0A3D38',
  borderColor = '#B8923B',
  borderWidth = 1.5,
  showCrown = true,
}) => {
  // قوس مدبب مع تصميم محراب: مستطيل سفلي + قوس مدبّب علوي
  // أبعاد منسوبة لـ 0..100 / 0..130
  return (
    <Svg width={width} height={height} viewBox="0 0 100 130">
      <Defs>
        <LinearGradient id="mihrabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={fill} stopOpacity="1" />
          <Stop offset="100%" stopColor={fill} stopOpacity="0.85" />
        </LinearGradient>
      </Defs>
      {/* القوس */}
      <Path
        d={`
          M 8 130
          L 8 50
          C 8 22, 30 8, 50 8
          C 70 8, 92 22, 92 50
          L 92 130
          Z
        `}
        fill="url(#mihrabGrad)"
        stroke={borderColor}
        strokeWidth={borderWidth}
      />
      {/* إطار داخلي */}
      <Path
        d={`
          M 14 130
          L 14 52
          C 14 28, 32 14, 50 14
          C 68 14, 86 28, 86 52
          L 86 130
        `}
        fill="none"
        stroke={borderColor}
        strokeWidth={0.5}
        opacity={0.7}
      />
      {showCrown ? (
        <G transform="translate(50, 0)">
          {/* رصيعة عليا */}
          <Circle cy={4} r={3.5} fill={borderColor} />
          <Path
            d="M-1.5,4 L0,0 L1.5,4 L0,8 Z"
            fill={fill}
          />
        </G>
      ) : null}
    </Svg>
  );
};
