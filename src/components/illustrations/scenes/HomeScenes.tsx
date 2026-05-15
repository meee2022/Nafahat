/**
 * مشاهد البطاقات الرئيسية في الـ Home:
 *  - المصحف: قوس + مصحف مفتوح ذهبي
 *  - الحفظ: قوس + شخصية تحفظ القرآن
 *  - الاستماع: قوس + سماعات مع موجات صوت
 *  - التسميع: قوس + مايكروفون مع موجات
 */
import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import { SceneFrame } from './SceneFrame';

interface Props { size?: number; }

// ━━━━━━━━━━━━ المصحف ━━━━━━━━━━━━
export const SceneMushaf: React.FC<Props> = ({ size = 92 }) => (
  <SceneFrame
    size={size}
    uid="m-mushaf"
    bgTop="#D8E8E4"
    bgBottom="#A8C8C0"
    borderColor="#0F4A41"
    clouds={false}
    decorations={
      <>
        <Path d="M 6 24 L 7 26 L 9 27 L 7 28 L 6 30 L 5 28 L 3 27 L 5 26 Z" fill="#0F4A41" opacity={0.4} />
        <Circle cx="94" cy="32" r="1" fill="#0F4A41" opacity={0.4} />
      </>
    }
  >
    {/* قوس داخلي صغير في الخلف */}
    <Path d="M 32 56 L 32 42 Q 32 32 50 32 Q 68 32 68 42 L 68 56" fill="#FBF7EA" opacity={0.4} />

    {/* المصحف المفتوح */}
    {/* ظل تحت المصحف */}
    <Ellipse cx="50" cy="80" rx="26" ry="2" fill="#000" opacity={0.15} />

    {/* الصفحات */}
    <Path d="M 22 76 L 50 72 L 78 76 L 78 64 L 50 60 L 22 64 Z" fill="#FBF7EA" stroke="#B89456" strokeWidth="0.6" />
    {/* خط الفاصل بين الصفحتين */}
    <Path d="M 50 60 L 50 72" stroke="#B89456" strokeWidth="0.7" />

    {/* خطوط النص اليمين */}
    <Path d="M 28 67 L 46 66.5" stroke="#0F4A41" strokeWidth="0.5" strokeLinecap="round" />
    <Path d="M 28 69 L 46 68.5" stroke="#0F4A41" strokeWidth="0.5" strokeLinecap="round" />
    <Path d="M 30 71 L 44 70.5" stroke="#0F4A41" strokeWidth="0.5" strokeLinecap="round" />

    {/* خطوط النص اليسار */}
    <Path d="M 54 66 L 72 66.5" stroke="#0F4A41" strokeWidth="0.5" strokeLinecap="round" />
    <Path d="M 54 68 L 72 68.5" stroke="#0F4A41" strokeWidth="0.5" strokeLinecap="round" />
    <Path d="M 54 70 L 70 70.5" stroke="#0F4A41" strokeWidth="0.5" strokeLinecap="round" />

    {/* غلاف */}
    <Path d="M 18 64 L 22 64 L 22 76 L 18 73 Z" fill="#0F4A41" />
    <Path d="M 82 64 L 78 64 L 78 76 L 82 73 Z" fill="#0F4A41" />

    {/* رصيعة ذهبية فوق المصحف */}
    <Circle cx="50" cy="48" r="6" fill="#D4B570" opacity={0.95} />
    <Circle cx="50" cy="48" r="6" fill="none" stroke="#8A6B28" strokeWidth="0.5" />
    <Path d="M 50 43 L 51.5 47 L 55 48 L 51.5 49 L 50 53 L 48.5 49 L 45 48 L 48.5 47 Z" fill="#0F4A41" />
    <Circle cx="50" cy="48" r="1.2" fill="#D4B570" />

    {/* أشعة من الرصيعة */}
    <G stroke="#D4B570" strokeWidth="0.7" strokeLinecap="round" opacity={0.7}>
      <Path d="M 50 38 L 50 36" />
      <Path d="M 58 42 L 60 40" />
      <Path d="M 42 42 L 40 40" />
    </G>
  </SceneFrame>
);

// ━━━━━━━━━━━━ الحفظ ━━━━━━━━━━━━
export const SceneMemo: React.FC<Props> = ({ size = 92 }) => (
  <SceneFrame
    size={size}
    uid="m-memo"
    bgTop="#F3D4DA"
    bgBottom="#E0A0AE"
    borderColor="#A2384B"
    clouds={false}
  >
    {/* نجوم */}
    <Path d="M 22 26 L 23 28 L 25 29 L 23 30 L 22 32 L 21 30 L 19 29 L 21 28 Z" fill="#FBF7EA" opacity={0.85} />
    <Path d="M 76 30 L 77 32 L 79 33 L 77 34 L 76 36 L 75 34 L 73 33 L 75 32 Z" fill="#FBF7EA" opacity={0.85} />
    <Circle cx="32" cy="22" r="0.8" fill="#FBF7EA" />
    <Circle cx="66" cy="22" r="0.8" fill="#FBF7EA" />

    {/* شخصية تجلس وتقرأ - بسيطة */}
    {/* الرأس */}
    <Circle cx="50" cy="44" r="9" fill="#F5C9A8" />
    {/* الشعر/الحجاب أو العمامة */}
    <Path d="M 41 44 Q 41 35 50 35 Q 59 35 59 44 Z" fill="#3D2817" />
    <Path d="M 41 44 Q 41 35 50 35 Q 59 35 59 44" fill="none" stroke="#A2384B" strokeWidth="0.4" />
    {/* عيون مغلقة - تفكّر */}
    <Path d="M 45 45 L 47.5 45" stroke="#3D2817" strokeWidth="0.8" strokeLinecap="round" />
    <Path d="M 52.5 45 L 55 45" stroke="#3D2817" strokeWidth="0.8" strokeLinecap="round" />
    {/* ابتسامة */}
    <Path d="M 47 49 Q 50 50.5 53 49" stroke="#3D2817" strokeWidth="0.7" fill="none" strokeLinecap="round" />

    {/* الجسم */}
    <Path d="M 38 76 L 38 62 Q 38 55 50 55 Q 62 55 62 62 L 62 76 Z" fill="#A2384B" />

    {/* كتاب مفتوح في الأيدي */}
    <Path d="M 38 72 L 50 70 L 62 72 L 62 78 L 50 76 L 38 78 Z" fill="#FBF7EA" stroke="#5C4012" strokeWidth="0.5" />
    <Path d="M 50 70 L 50 76" stroke="#B89456" strokeWidth="0.4" />
    <Path d="M 40 73 L 48 73" stroke="#A2384B" strokeWidth="0.3" />
    <Path d="M 40 75 L 47 75" stroke="#A2384B" strokeWidth="0.3" />
    <Path d="M 52 73 L 60 73" stroke="#A2384B" strokeWidth="0.3" />
    <Path d="M 52 75 L 59 75" stroke="#A2384B" strokeWidth="0.3" />

    {/* فكرة فوق الرأس - مصباح أو نجمة */}
    <Path d="M 50 26 L 51.5 30 L 55.5 31 L 52 33 L 50 37 L 48 33 L 44.5 31 L 48.5 30 Z" fill="#FFE08A" />
    <Path d="M 50 26 L 51.5 30 L 55.5 31 L 52 33 L 50 37 L 48 33 L 44.5 31 L 48.5 30 Z" fill="none" stroke="#D4B570" strokeWidth="0.5" />
  </SceneFrame>
);

// ━━━━━━━━━━━━ الاستماع ━━━━━━━━━━━━
export const SceneAudio: React.FC<Props> = ({ size = 92 }) => (
  <SceneFrame
    size={size}
    uid="m-audio"
    bgTop="#D8E8F5"
    bgBottom="#9AC0E0"
    borderColor="#2F5A8C"
    clouds
  >
    {/* السماعات - في الوسط */}
    {/* قوس الرأس */}
    <Path
      d="M 30 56 C 30 38, 70 38, 70 56"
      fill="none" stroke="#2F5A8C" strokeWidth="4" strokeLinecap="round"
    />
    <Path
      d="M 30 56 C 30 38, 70 38, 70 56"
      fill="none" stroke="#5A8AB8" strokeWidth="1.5" strokeLinecap="round" opacity={0.6}
    />

    {/* السماعة اليسرى */}
    <Rect x="22" y="52" width="14" height="20" rx="5" fill="#FBF7EA" stroke="#2F5A8C" strokeWidth="0.6" />
    <Rect x="24" y="56" width="10" height="14" rx="3" fill="#2F5A8C" />
    <Circle cx="29" cy="63" r="3.5" fill="#5A8AB8" />
    <Circle cx="29" cy="63" r="1.5" fill="#D4B570" />

    {/* السماعة اليمنى */}
    <Rect x="64" y="52" width="14" height="20" rx="5" fill="#FBF7EA" stroke="#2F5A8C" strokeWidth="0.6" />
    <Rect x="66" y="56" width="10" height="14" rx="3" fill="#2F5A8C" />
    <Circle cx="71" cy="63" r="3.5" fill="#5A8AB8" />
    <Circle cx="71" cy="63" r="1.5" fill="#D4B570" />

    {/* موجات صوت تخرج من السماعات */}
    <G stroke="#FFB347" strokeWidth="1.4" fill="none" strokeLinecap="round">
      <Path d="M 14 56 Q 10 56 8 50" opacity={0.85} />
      <Path d="M 14 64 Q 10 64 8 70" opacity={0.85} />
      <Path d="M 86 56 Q 90 56 92 50" opacity={0.85} />
      <Path d="M 86 64 Q 90 64 92 70" opacity={0.85} />
    </G>
    <G stroke="#FFB347" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity={0.55}>
      <Path d="M 14 50 Q 6 50 4 42" />
      <Path d="M 86 50 Q 94 50 96 42" />
    </G>

    {/* نوتة موسيقية صغيرة */}
    <G transform="translate(50, 44)">
      <Circle cx="0" cy="0" r="2" fill="#2F5A8C" />
      <Path d="M 2 0 L 2 -8" stroke="#2F5A8C" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M 2 -8 Q 6 -8 6 -4" fill="none" stroke="#2F5A8C" strokeWidth="1.2" strokeLinecap="round" />
    </G>
  </SceneFrame>
);

// ━━━━━━━━━━━━ التسميع ━━━━━━━━━━━━
export const SceneTasmee: React.FC<Props> = ({ size = 92 }) => (
  <SceneFrame
    size={size}
    uid="m-tasmee"
    bgTop="#FFE0CB"
    bgBottom="#F5A77E"
    borderColor="#B5563C"
    clouds={false}
  >
    {/* موجات حول الميكروفون */}
    <G stroke="#FBF7EA" strokeWidth="1.3" fill="none" strokeLinecap="round">
      <Path d="M 28 52 Q 22 52 20 46" />
      <Path d="M 28 60 Q 22 60 20 66" />
      <Path d="M 72 52 Q 78 52 80 46" />
      <Path d="M 72 60 Q 78 60 80 66" />
    </G>
    <G stroke="#FBF7EA" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity={0.5}>
      <Path d="M 28 46 Q 18 46 16 38" />
      <Path d="M 72 46 Q 82 46 84 38" />
    </G>

    {/* الميكروفون */}
    {/* جسم */}
    <Rect x="42" y="28" width="16" height="32" rx="8" fill="#FBF7EA" stroke="#5C4012" strokeWidth="0.6" />
    {/* خطوط الشبكة */}
    <G stroke="#5C4012" strokeWidth="0.3" opacity={0.65}>
      <Path d="M 44 34 L 56 34" />
      <Path d="M 44 38 L 56 38" />
      <Path d="M 44 42 L 56 42" />
      <Path d="M 44 46 L 56 46" />
      <Path d="M 44 50 L 56 50" />
    </G>
    {/* لمعة */}
    <Path d="M 44 30 L 44 58" stroke="#FFE08A" strokeWidth="1.5" opacity={0.5} strokeLinecap="round" />

    {/* حلقة الإمساك */}
    <Path d="M 32 52 C 32 68, 68 68, 68 52" fill="none" stroke="#D4B570" strokeWidth="2.5" strokeLinecap="round" />

    {/* القاعدة */}
    <Path d="M 50 60 L 50 74" stroke="#D4B570" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M 38 78 L 62 78" stroke="#D4B570" strokeWidth="3" strokeLinecap="round" />

    {/* فقاعة صوت بنقاط (للحديث) */}
    <Ellipse cx="22" cy="32" rx="6" ry="4" fill="#FBF7EA" opacity={0.95} />
    <Circle cx="19" cy="32" r="0.7" fill="#5C4012" />
    <Circle cx="22" cy="32" r="0.7" fill="#5C4012" />
    <Circle cx="25" cy="32" r="0.7" fill="#5C4012" />
  </SceneFrame>
);
