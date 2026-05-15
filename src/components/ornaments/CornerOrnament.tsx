import React from 'react';
import Svg, { Path, G, Circle } from 'react-native-svg';

/**
 * زخرفة زاوية - نمط نباتي/هندسي يُستخدم في زوايا البطاقات الفاخرة.
 */
interface Props {
  size?: number;
  color?: string;
  corner?: 'tl' | 'tr' | 'bl' | 'br';
}

export const CornerOrnament: React.FC<Props> = ({
  size = 56,
  color = '#B8923B',
  corner = 'tr',
}) => {
  const rotation = corner === 'tl' ? 270 : corner === 'tr' ? 0 : corner === 'br' ? 90 : 180;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <G rotation={rotation} origin="20, 20">
        <Path
          d="M 2 2 L 30 2 M 2 2 L 2 30"
          stroke={color}
          strokeWidth={1.2}
          fill="none"
        />
        <Path
          d="M 5 5 L 24 5 M 5 5 L 5 24"
          stroke={color}
          strokeWidth={0.5}
          fill="none"
          opacity={0.7}
        />
        {/* رصيعة في الزاوية */}
        <Circle cx={5} cy={5} r={2.5} fill={color} />
        <Circle cx={5} cy={5} r={1.2} fill="#FBF7EA" />
        {/* امتداد فني */}
        <Path
          d="M 30 2 L 32 6 L 34 4 L 36 8"
          stroke={color}
          strokeWidth={0.8}
          fill="none"
          opacity={0.6}
        />
      </G>
    </Svg>
  );
};
