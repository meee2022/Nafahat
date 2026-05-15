/**
 * مشاهد الأذكار - مستوحاة من الصورة المرجعية:
 *   - الصباح: شمس ساطعة + سحب + قوس مسجد كريمي
 *   - المساء: هلال + نجوم + قوس مسجد ليلي
 *   - النوم: سرير + قمر + قوس مسجد فضّي
 *   - الاستيقاظ: شخصية تستيقظ + ضوء
 *   - بعد الصلاة: شخصية تجلس للذكر
 *   - عامة: مسبحة + نور
 */
import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import { SceneFrame } from './SceneFrame';

interface Props { size?: number; }

// ━━━━━━━━━━━━ أذكار الصباح ━━━━━━━━━━━━
export const SceneMorning: React.FC<Props> = ({ size = 92 }) => (
  <SceneFrame
    size={size}
    uid="morning"
    bgTop="#FFF4D1"
    bgBottom="#FFE5A8"
    borderColor="#D4A574"
    clouds
  >
    {/* الشمس */}
    <Circle cx="50" cy="48" r="14" fill="#FCC444" />
    <Circle cx="50" cy="48" r="14" fill="#FFD96A" opacity={0.6} />
    {/* أشعة */}
    <G stroke="#FCC444" strokeWidth="1.4" strokeLinecap="round">
      <Path d="M 50 28 L 50 32" />
      <Path d="M 36 36 L 38 38" />
      <Path d="M 64 36 L 62 38" />
      <Path d="M 30 48 L 34 48" />
      <Path d="M 66 48 L 70 48" />
    </G>
    {/* الأرض - تلال */}
    <Path d="M 12 88 Q 30 78 50 84 Q 70 78 88 88 L 88 92 L 12 92 Z" fill="#F4B860" opacity={0.85} />
    <Path d="M 12 88 Q 30 78 50 84 Q 70 78 88 88" fill="none" stroke="#D4954A" strokeWidth="0.6" />
    {/* سحاب أمامي */}
    <Path
      d="M 22 70 Q 26 65 32 67 Q 36 64 42 67 Q 46 66 47 70 L 22 70 Z"
      fill="#FBF7EA" opacity={0.95}
    />
    <Path
      d="M 60 60 Q 64 56 70 58 Q 73 56 76 60 L 60 60 Z"
      fill="#FBF7EA" opacity={0.85}
    />
  </SceneFrame>
);

// ━━━━━━━━━━━━ أذكار المساء ━━━━━━━━━━━━
export const SceneEvening: React.FC<Props> = ({ size = 92 }) => (
  <SceneFrame
    size={size}
    uid="evening"
    bgTop="#2D3F8C"
    bgBottom="#1A2657"
    borderColor="#FFB347"
    clouds={false}
    decorations={
      <>
        {/* نجمات خارج الإطار */}
        <Path d="M 6 14 L 7 17 L 10 18 L 7 19 L 6 22 L 5 19 L 2 18 L 5 17 Z" fill="#FFE08A" opacity={0.8} />
        <Path d="M 92 18 L 93 21 L 96 22 L 93 23 L 92 26 L 91 23 L 88 22 L 91 21 Z" fill="#FFE08A" opacity={0.7} />
      </>
    }
  >
    {/* نجوم في السماء */}
    <Circle cx="22" cy="30" r="0.8" fill="#FBF7EA" opacity={0.9} />
    <Circle cx="35" cy="22" r="1" fill="#FBF7EA" />
    <Circle cx="70" cy="26" r="0.8" fill="#FBF7EA" opacity={0.9} />
    <Path d="M 78 36 L 79 38 L 81 39 L 79 40 L 78 42 L 77 40 L 75 39 L 77 38 Z" fill="#FFE08A" opacity={0.9} />
    <Path d="M 22 50 L 23 52 L 25 53 L 23 54 L 22 56 L 21 54 L 19 53 L 21 52 Z" fill="#FFE08A" opacity={0.85} />

    {/* الهلال */}
    <Path
      d="M 64 52 A 12 12 0 1 0 64 72 A 9.5 9.5 0 1 1 64 52 Z"
      fill="#FFE08A"
    />
    <Path
      d="M 64 52 A 12 12 0 1 0 64 72 A 9.5 9.5 0 1 1 64 52 Z"
      fill="none" stroke="#FFB347" strokeWidth="0.6"
    />
    <Circle cx="60" cy="62" r="0.6" fill="#FFB347" opacity={0.5} />

    {/* سحاب رقيق ليلي */}
    <Path
      d="M 18 78 Q 22 74 28 76 Q 32 74 36 78 L 18 78 Z"
      fill="#5A6CA8" opacity={0.7}
    />
  </SceneFrame>
);

// ━━━━━━━━━━━━ أذكار النوم ━━━━━━━━━━━━
export const SceneSleep: React.FC<Props> = ({ size = 92 }) => (
  <SceneFrame
    size={size}
    uid="sleep"
    bgTop="#E5DDD0"
    bgBottom="#C9BCA4"
    borderColor="#A0907A"
    clouds={false}
  >
    {/* قمر هلال صغير في الأعلى */}
    <Path
      d="M 70 26 A 6 6 0 1 0 70 38 A 4.5 4.5 0 1 1 70 26 Z"
      fill="#FBF7EA"
    />
    {/* نجمة */}
    <Circle cx="30" cy="28" r="0.8" fill="#FBF7EA" opacity={0.85} />
    <Circle cx="42" cy="22" r="0.6" fill="#FBF7EA" opacity={0.85} />

    {/* الجدار العلوي للغرفة (ظل خفيف) */}
    <Path d="M 12 14 L 88 14 L 88 60 L 12 60 Z" fill="#9D8E76" opacity={0.06} />

    {/* السرير - إطار */}
    <Path d="M 22 76 L 22 64 L 78 64 L 78 76 Z" fill="#6B5440" />
    {/* المرتبة */}
    <Path d="M 24 74 L 76 74 L 76 64 L 24 64 Z" fill="#F5E8D4" />
    {/* البطانية */}
    <Path d="M 32 74 L 64 74 L 64 66 L 32 66 Z" fill="#E89B5E" />
    <Path d="M 32 66 L 64 66" stroke="#C77B2F" strokeWidth="0.6" />
    {/* المخدّة */}
    <Path d="M 26 66 L 38 66 L 38 60 L 26 60 Z" fill="#FBF7EA" stroke="#C9BCA4" strokeWidth="0.5" />
    <Circle cx="32" cy="63" r="1.6" fill="#E5DDD0" />

    {/* أرجل السرير */}
    <Rect x="20" y="76" width="3" height="6" fill="#5C4630" />
    <Rect x="77" y="76" width="3" height="6" fill="#5C4630" />

    {/* Z حروف النوم */}
    <Path
      d="M 56 40 L 64 40 L 56 46 L 64 46"
      stroke="#FBF7EA" strokeWidth="1.2" fill="none" strokeLinecap="round"
    />
    <Path
      d="M 62 32 L 66 32 L 62 36 L 66 36"
      stroke="#FBF7EA" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity={0.7}
    />
  </SceneFrame>
);

// ━━━━━━━━━━━━ أذكار الاستيقاظ ━━━━━━━━━━━━
export const SceneWakeup: React.FC<Props> = ({ size = 92 }) => (
  <SceneFrame
    size={size}
    uid="wakeup"
    bgTop="#FFE0B5"
    bgBottom="#FFC988"
    borderColor="#D4954A"
    clouds={false}
  >
    {/* شمس صغيرة طالعة */}
    <Circle cx="74" cy="32" r="8" fill="#FCC444" />
    <G stroke="#FCC444" strokeWidth="0.9" strokeLinecap="round">
      <Path d="M 74 18 L 74 22" />
      <Path d="M 64 22 L 66 24" />
      <Path d="M 84 22 L 82 24" />
      <Path d="M 60 32 L 64 32" />
    </G>

    {/* أرض/سرير */}
    <Path d="M 12 76 L 88 76 L 88 92 L 12 92 Z" fill="#D4954A" opacity={0.5} />
    <Path d="M 12 76 L 88 76" stroke="#A07440" strokeWidth="0.5" />

    {/* شخصية تستيقظ - نصف جسم بسيط */}
    {/* الرأس */}
    <Circle cx="40" cy="56" r="7" fill="#F5C9A8" />
    {/* الشعر */}
    <Path d="M 33 54 Q 33 48 40 48 Q 47 48 47 54 Q 45 50 40 50 Q 35 50 33 54 Z" fill="#3D2817" />
    {/* عينان مغلقتان */}
    <Path d="M 36 56 L 38 56" stroke="#3D2817" strokeWidth="0.7" strokeLinecap="round" />
    <Path d="M 42 56 L 44 56" stroke="#3D2817" strokeWidth="0.7" strokeLinecap="round" />
    {/* ابتسامة */}
    <Path d="M 38 60 Q 40 61 42 60" stroke="#3D2817" strokeWidth="0.7" fill="none" strokeLinecap="round" />
    {/* الذراعان ممدودان */}
    <Path d="M 33 64 L 24 66 L 22 60" stroke="#F5C9A8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <Path d="M 47 64 L 56 66 L 58 60" stroke="#F5C9A8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    {/* الجسم */}
    <Path d="M 32 66 L 32 76 L 48 76 L 48 66 Z" fill="#5E8F84" />
    <Path d="M 32 66 L 48 66" stroke="#3D2817" strokeWidth="0.3" />

    {/* وسادة خلفه */}
    <Rect x="60" y="60" width="20" height="14" rx="3" fill="#FBF7EA" stroke="#C9BCA4" strokeWidth="0.5" />
    <Circle cx="70" cy="67" r="2" fill="#E5DDD0" />
  </SceneFrame>
);

// ━━━━━━━━━━━━ بعد الصلاة ━━━━━━━━━━━━
export const SceneAfterPrayer: React.FC<Props> = ({ size = 92 }) => (
  <SceneFrame
    size={size}
    uid="afterprayer"
    bgTop="#BFE0F5"
    bgBottom="#80B8E0"
    borderColor="#3F6F8F"
    clouds={false}
  >
    {/* سحاب رقيق */}
    <Path d="M 16 32 Q 20 28 26 30 Q 30 28 34 32 L 16 32 Z" fill="#FBF7EA" opacity={0.7} />
    <Path d="M 66 28 Q 70 24 76 26 Q 80 26 82 30 L 66 28 Z" fill="#FBF7EA" opacity={0.7} />

    {/* أرضية - سجادة صلاة */}
    <Path d="M 16 80 L 84 80 L 80 92 L 20 92 Z" fill="#7C3045" />
    <Path d="M 16 80 L 84 80" stroke="#5C1F33" strokeWidth="0.5" />
    {/* محراب على السجادة */}
    <Path d="M 44 80 L 44 72 Q 44 68 50 68 Q 56 68 56 72 L 56 80 Z" fill="none" stroke="#FBF7EA" strokeWidth="0.6" opacity={0.7} />

    {/* شخص يجلس للذكر - يدان مرفوعتان */}
    {/* الجسم */}
    <Path
      d="M 38 72 L 38 60 Q 38 52 50 52 Q 62 52 62 60 L 62 72 Z"
      fill="#FBF7EA"
    />
    {/* العمامة */}
    <Path d="M 38 56 Q 38 46 50 46 Q 62 46 62 56" fill="#FBF7EA" stroke="#3F6F8F" strokeWidth="0.4" />
    {/* الوجه (جزء) */}
    <Path
      d="M 44 52 L 44 60 Q 44 64 50 64 Q 56 64 56 60 L 56 52"
      fill="#F5C9A8" stroke="#3D2817" strokeWidth="0.3"
    />
    <Circle cx="46" cy="56" r="0.6" fill="#3D2817" />
    <Circle cx="54" cy="56" r="0.6" fill="#3D2817" />
    <Path d="M 48 60 Q 50 61 52 60" stroke="#3D2817" strokeWidth="0.4" fill="none" />

    {/* اللحية */}
    <Path d="M 46 60 Q 50 64 54 60 Q 53 66 50 66 Q 47 66 46 60 Z" fill="#5C4012" opacity={0.7} />

    {/* الأيدي مرفوعة للدعاء */}
    <Path d="M 38 60 Q 30 50 32 42" stroke="#F5C9A8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <Path d="M 62 60 Q 70 50 68 42" stroke="#F5C9A8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    {/* الكفّان مفتوحتان */}
    <Circle cx="32" cy="42" r="2.5" fill="#F5C9A8" />
    <Circle cx="68" cy="42" r="2.5" fill="#F5C9A8" />

    {/* أشعة دعاء صاعدة */}
    <Path d="M 50 38 L 50 30" stroke="#FFB347" strokeWidth="1.4" opacity={0.8} strokeLinecap="round" />
    <Path d="M 44 42 L 41 36" stroke="#FFB347" strokeWidth="0.9" opacity={0.6} strokeLinecap="round" />
    <Path d="M 56 42 L 59 36" stroke="#FFB347" strokeWidth="0.9" opacity={0.6} strokeLinecap="round" />
  </SceneFrame>
);

// ━━━━━━━━━━━━ الأذكار العامة (مسبحة) ━━━━━━━━━━━━
export const SceneGeneral: React.FC<Props> = ({ size = 92 }) => (
  <SceneFrame
    size={size}
    uid="general"
    bgTop="#D4F5E5"
    bgBottom="#A3D9B1"
    borderColor="#3F8F6E"
    clouds={false}
  >
    {/* أرضية خفيفة */}
    <Path d="M 12 84 L 88 84" stroke="#3F8F6E" strokeWidth="0.5" opacity={0.5} />

    {/* المسبحة - دائرة */}
    <Circle cx="50" cy="56" r="18" fill="none" stroke="#5C4012" strokeWidth="0.6" />
    {/* خرزات */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 2 * Math.PI) / 12 - Math.PI / 2;
      const cx = 50 + 18 * Math.cos(angle);
      const cy = 56 + 18 * Math.sin(angle);
      const isImama = i === 0;
      return (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={isImama ? 4 : 2.8}
          fill={isImama ? '#3D2817' : '#5C4012'}
          stroke="#3D2817"
          strokeWidth={0.3}
        />
      );
    })}
    {/* قطّاعة */}
    <Path d="M 50 38 L 50 30" stroke="#FBF7EA" strokeWidth="1.2" />
    <Path d="M 48 30 L 48 26 M 50 30 L 50 24 M 52 30 L 52 26" stroke="#FBF7EA" strokeWidth="0.7" />

    {/* نجمة ذهبية في الوسط */}
    <Path d="M 50 50 L 51.5 54 L 55.5 55 L 52 57 L 50 61 L 48 57 L 44.5 55 L 48.5 54 Z" fill="#FFB347" />
    <Circle cx="50" cy="56" r="1.2" fill="#FBF7EA" />
  </SceneFrame>
);
