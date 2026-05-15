/**
 * أيقونات شريط التبويبات السفلي - تصميم مسطّح (flat) مستوحى من
 * الفن الإسلامي والمخطوطات.
 *
 * كل أيقونة لها حالتان:
 *   - inactive: خطوط فقط بلون رمادي (stroke)
 *   - active:   ممتلئة بلون التطبيق الأساسي (fill)
 */
import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  /** اللون الأساسي (active = fill، inactive = stroke). */
  color: string;
  /** هل التاب نشط (يحدد filled أو outlined). */
  focused: boolean;
}

// ───────────── 🏠 الرئيسية - محراب / قبة جامع ─────────────
export const TabHomeIcon: React.FC<IconProps> = ({ size = 26, color, focused }) => {
  const fill = focused ? color : 'none';
  const stroke = color;
  const sw = focused ? 1.2 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* المحراب - قوس مدبّب */}
      <Path
        d="M 5 28 L 5 14 C 5 8.5, 10 4, 16 4 C 22 4, 27 8.5, 27 14 L 27 28 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* خط الأرضية */}
      <Path d="M 3 28 L 29 28" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      {/* رصيعة الهلال */}
      <Path
        d="M 16 1.5 L 16 4"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <Circle cx="16" cy="1.5" r="1.2" fill={focused ? '#FBF7EA' : stroke} />
      {/* قوس داخلي صغير - يظهر فقط لما active */}
      {focused ? (
        <Path
          d="M 11 28 L 11 17 C 11 14, 13 12, 16 12 C 19 12, 21 14, 21 17 L 21 28 Z"
          fill="#FBF7EA"
          opacity={0.4}
        />
      ) : null}
    </Svg>
  );
};

// ───────────── 📖 المصحف - كتاب مفتوح ─────────────
export const TabMushafIcon: React.FC<IconProps> = ({ size = 26, color, focused }) => {
  const fill = focused ? color : 'none';
  const stroke = color;
  const sw = focused ? 1.2 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* الصفحة اليمنى */}
      <Path
        d="M 16 7 L 16 26 L 5 25 C 4.4 25, 4 24.5, 4 24 L 4 8 C 4 7.4, 4.4 7, 5 7 L 14 7.5 C 15 7.5, 16 7.5, 16 7 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* الصفحة اليسرى */}
      <Path
        d="M 16 7 L 16 26 L 27 25 C 27.6 25, 28 24.5, 28 24 L 28 8 C 28 7.4, 27.6 7, 27 7 L 18 7.5 C 17 7.5, 16 7.5, 16 7 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* الخط الأوسط (العمود الفقري) */}
      <Path d="M 16 7 L 16 26" stroke={stroke} strokeWidth={sw} />
      {/* خطوط نصّ (تظهر لما active) */}
      {focused ? (
        <G stroke="#FBF7EA" strokeWidth={0.8} opacity={0.75} strokeLinecap="round">
          <Path d="M 7 12 L 13 12" />
          <Path d="M 7 15 L 13 15" />
          <Path d="M 8 18 L 13 18" />
          <Path d="M 19 12 L 25 12" />
          <Path d="M 19 15 L 25 15" />
          <Path d="M 19 18 L 24 18" />
        </G>
      ) : null}
    </Svg>
  );
};

// ───────────── 🧠 الحفظ - نجمة ثمانية + قلب ─────────────
export const TabMemoIcon: React.FC<IconProps> = ({ size = 26, color, focused }) => {
  const fill = focused ? color : 'none';
  const stroke = color;
  const sw = focused ? 1.2 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* نجمة ثمانية (إشارة للإسلام والحفظ) */}
      <Path
        d="M 16 2 L 19 9 L 26 6 L 23 13 L 30 16 L 23 19 L 26 26 L 19 23 L 16 30 L 13 23 L 6 26 L 9 19 L 2 16 L 9 13 L 6 6 L 13 9 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* نواة مركزية */}
      <Circle cx="16" cy="16" r="3.5" fill={focused ? '#FBF7EA' : 'none'} stroke={stroke} strokeWidth={sw * 0.7} />
      {focused ? <Circle cx="16" cy="16" r="1.5" fill={color} /> : null}
    </Svg>
  );
};

// ───────────── 🎧 الاستماع - سماعات أنيقة ─────────────
export const TabListenIcon: React.FC<IconProps> = ({ size = 26, color, focused }) => {
  const fill = focused ? color : 'none';
  const stroke = color;
  const sw = focused ? 1.2 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* قوس السماعات العلوي */}
      <Path
        d="M 5 17 C 5 10, 10 5, 16 5 C 22 5, 27 10, 27 17"
        fill="none"
        stroke={stroke}
        strokeWidth={sw + 0.3}
        strokeLinecap="round"
      />
      {/* السماعة اليمنى */}
      <Path
        d="M 4 17 L 4 24 C 4 25.5, 5 26.5, 6.5 26.5 L 8 26.5 C 9 26.5, 10 25.5, 10 24 L 10 17 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* السماعة اليسرى */}
      <Path
        d="M 22 17 L 22 24 C 22 25.5, 23 26.5, 24.5 26.5 L 26 26.5 C 27 26.5, 28 25.5, 28 24 L 28 17 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* بقعة بيضاء صغيرة - تظهر لما active */}
      {focused ? (
        <>
          <Rect x="5.5" y="19" width="3" height="5" rx="1" fill="#FBF7EA" opacity={0.6} />
          <Rect x="23.5" y="19" width="3" height="5" rx="1" fill="#FBF7EA" opacity={0.6} />
        </>
      ) : null}
    </Svg>
  );
};

// ───────────── 👤 حسابي - شخص أنيق ─────────────
export const TabAccountIcon: React.FC<IconProps> = ({ size = 26, color, focused }) => {
  const fill = focused ? color : 'none';
  const stroke = color;
  const sw = focused ? 1.2 : 1.8;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* الرأس */}
      <Circle
        cx="16" cy="11" r="5"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* الجسد - شكل دائري أنيق */}
      <Path
        d="M 5 28 C 5 22, 10 18, 16 18 C 22 18, 27 22, 27 28"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* نقطة صغيرة بيضاء على الرأس - active فقط */}
      {focused ? (
        <Circle cx="16" cy="11" r="1.6" fill="#FBF7EA" opacity={0.7} />
      ) : null}
    </Svg>
  );
};
