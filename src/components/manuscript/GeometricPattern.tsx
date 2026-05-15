import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { mColors } from '@theme/manuscript';

interface Props {
  opacity?: number;
  color?: string;
}

/**
 * نقش هندسي إسلامي 8-نقاط متكرّر - يُستخدم كخلفية شفّافة جداً على الشاشات.
 * يعطي عمقاً نسيجياً دون أن يُشتّت البصر.
 */
export const GeometricPattern: React.FC<Props> = ({ opacity = 0.04, color = mColors.gold.primary }) => {
  return (
    <Svg
      width="100%"
      height="100%"
      style={[StyleSheet.absoluteFill, { opacity }]}
      pointerEvents="none"
    >
      <Defs>
        <Pattern id="islamic-star" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
          {/* نجمة 8 نقاط كلاسيكية */}
          <Path
            d="M32 4 L36 22 L54 22 L40 32 L46 50 L32 40 L18 50 L24 32 L10 22 L28 22 Z"
            fill="none"
            stroke={color}
            strokeWidth={0.6}
          />
          {/* مربّع داخلي مدوّر */}
          <Path
            d="M32 18 L42 28 L32 38 L22 28 Z"
            fill="none"
            stroke={color}
            strokeWidth={0.4}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#islamic-star)" />
    </Svg>
  );
};

/**
 * إطار حدود هندسي ذهبي - يُحيط ببطاقة (يُلفّ كأنّه إطار مخطوط).
 * يُستخدم في HeroReadingCard.
 */
export const GeometricBorder: React.FC<{ opacity?: number }> = ({ opacity = 0.3 }) => {
  return (
    <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      {/* الإطار الذهبي - 4 خطوط */}
      <Path d="M 12 12 L calc(100% - 12) 12" stroke={mColors.gold.primary} strokeWidth={0.8} />
      <Path d="M 12 12 L 12 calc(100% - 12)" stroke={mColors.gold.primary} strokeWidth={0.8} />
      {/* رصائع زاوية - 4 زوايا */}
      {[
        { x: 12, y: 12 },
        { x: '100%', y: 12, dx: -12 },
        { x: 12, y: '100%', dy: -12 },
        { x: '100%', y: '100%', dx: -12, dy: -12 },
      ].map((corner, i) => (
        <Path
          key={i}
          d={`M -8 0 L 0 -8 L 8 0 L 0 8 Z`}
          fill={mColors.gold.primary}
          opacity={0.6}
          transform={`translate(${typeof corner.x === 'string' ? '' : corner.x}, ${typeof corner.y === 'string' ? '' : corner.y})`}
        />
      ))}
    </Svg>
  );
};

/**
 * قوس إسلامي مزخرف - يُوضع أعلى البطاقة كزخرفة بصرية.
 * width يُحدّد عرض القوس بالـ px.
 */
export const IslamicArch: React.FC<{ width?: number; color?: string; opacity?: number }> = ({
  width = 120,
  color = mColors.gold.primary,
  opacity = 0.85,
}) => {
  const h = Math.round(width * 0.55);
  const cx = width / 2;
  return (
    <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} pointerEvents="none">
      {/* القوس الخارجي (شكل مدبّب إسلامي) */}
      <Path
        d={`M 8 ${h} L 8 ${h * 0.6} Q 8 ${h * 0.18} ${cx} 6 Q ${width - 8} ${h * 0.18} ${width - 8} ${h * 0.6} L ${width - 8} ${h}`}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeOpacity={opacity}
      />
      {/* القوس الداخلي */}
      <Path
        d={`M 18 ${h} L 18 ${h * 0.62} Q 18 ${h * 0.26} ${cx} 16 Q ${width - 18} ${h * 0.26} ${width - 18} ${h * 0.62} L ${width - 18} ${h}`}
        fill="none"
        stroke={color}
        strokeWidth={0.7}
        strokeOpacity={opacity * 0.6}
      />
      {/* رصيعة قمّة (معيّن) */}
      <Path
        d={`M ${cx - 6} 8 L ${cx} 0 L ${cx + 6} 8 L ${cx} 16 Z`}
        fill={color}
        opacity={opacity}
      />
      {/* نقطة تاج */}
      <Path
        d={`M ${cx - 2} 6 L ${cx + 2} 6 L ${cx} 2 Z`}
        fill={color}
        opacity={opacity}
      />
    </Svg>
  );
};

/**
 * خط زخرفي بسيط مع نقاط - يُستخدم كفاصل بين الأقسام.
 */
export const OrnamentLine: React.FC<{ width?: number; color?: string }> = ({
  width = 100,
  color = mColors.gold.primary,
}) => {
  return (
    <Svg width={width} height={8} viewBox={`0 0 ${width} 8`} pointerEvents="none">
      <Path d={`M 12 4 L ${width - 12} 4`} stroke={color} strokeWidth={0.5} strokeOpacity={0.5} />
      <Path d={`M ${width / 2 - 4} 4 L ${width / 2} 0 L ${width / 2 + 4} 4 L ${width / 2} 8 Z`} fill={color} opacity={0.7} />
    </Svg>
  );
};
