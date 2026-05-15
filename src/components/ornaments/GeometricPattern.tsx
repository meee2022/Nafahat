import React from 'react';
import Svg, { Pattern, Path, Rect, Defs, G } from 'react-native-svg';

/**
 * نمط هندسي إسلامي قابل للتكرار - يستخدم كخلفية للبطاقات.
 * شبكة من النجوم الثمانية المتشابكة.
 */
interface Props {
  width?: number | string;
  height?: number | string;
  color?: string;
  opacity?: number;
  density?: 'sparse' | 'dense';
}

export const GeometricPattern: React.FC<Props> = ({
  width = '100%',
  height = '100%',
  color = '#B8923B',
  opacity = 0.12,
  density = 'sparse',
}) => {
  const unit = density === 'dense' ? 40 : 64;

  // نقش نجمة ثمانية بسيط متكرر
  return (
    <Svg width={width} height={height} style={{ opacity }} pointerEvents="none">
      <Defs>
        <Pattern id="islamicGrid" x="0" y="0" width={unit} height={unit} patternUnits="userSpaceOnUse">
          <G>
            <Path
              d={`M${unit / 2},2 L${unit / 2 + 6},${unit / 2 - 6} L${unit - 2},${unit / 2} L${unit / 2 + 6},${unit / 2 + 6} L${unit / 2},${unit - 2} L${unit / 2 - 6},${unit / 2 + 6} L2,${unit / 2} L${unit / 2 - 6},${unit / 2 - 6} Z`}
              stroke={color}
              strokeWidth={0.8}
              fill="none"
            />
          </G>
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#islamicGrid)" />
    </Svg>
  );
};
