import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

/**
 * النجمة الثمانية - رمز إسلامي أصيل.
 * تتركّب من مربعين متراكبين بزاوية 45°.
 */
interface Props {
  size?: number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  filled?: boolean;
  innerColor?: string;
  rotation?: number;
}

export const EightStar: React.FC<Props> = ({
  size = 32,
  color = '#B8923B',
  strokeColor,
  strokeWidth = 1.5,
  filled = false,
  innerColor,
  rotation = 0,
}) => {
  // نجمة ثمانية مبنية رياضيًا - 8 نقاط خارجية + 8 داخلية
  const cx = 50, cy = 50;
  const rOuter = 48, rInner = 24;
  const points: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  const d = `M${points.join(' L')} Z`;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G rotation={rotation} origin={`${cx}, ${cy}`}>
        <Path
          d={d}
          fill={filled ? color : 'none'}
          stroke={strokeColor ?? color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {innerColor ? (
          <Circle cx={cx} cy={cy} r={10} fill={innerColor} />
        ) : null}
      </G>
    </Svg>
  );
};
