import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse, Polygon } from 'react-native-svg';

interface IProps {
  size?: number;
}

/**
 * مجموعة رسوم توضيحية مفصّلة بـ SVG لأقسام التطبيق.
 * كل رسم متعدد الألوان، بعمق وإيحاء بالـ 3D، ومتناسق مع الهوية المخطوطية.
 */

// =================== المصحف ===================
export const IllMushaf: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-mushaf" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#1B5E54" />
        <Stop offset="100%" stopColor="#0A3D38" />
      </LinearGradient>
      <LinearGradient id="cover-mushaf" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#0F4A41" />
        <Stop offset="100%" stopColor="#062825" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-mushaf)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* ظل الكتاب */}
    <Ellipse cx="50" cy="78" rx="32" ry="3" fill="#000" opacity="0.18" />

    {/* الصفحات المفتوحة */}
    <Path d="M22 38 L50 36 L78 38 L78 72 L50 70 L22 72 Z" fill="#FBF7EA" stroke="#B8923B" strokeWidth="0.5" />
    <Path d="M50 36 L50 70" stroke="#B8923B" strokeWidth="0.8" />

    {/* خطوط النص اليمين */}
    <Path d="M28 46 L46 45.8" stroke="#0F4A41" strokeWidth="0.8" strokeLinecap="round" />
    <Path d="M28 50 L46 49.8" stroke="#0F4A41" strokeWidth="0.8" strokeLinecap="round" />
    <Path d="M28 54 L46 53.8" stroke="#0F4A41" strokeWidth="0.8" strokeLinecap="round" />
    <Path d="M28 58 L42 57.9" stroke="#0F4A41" strokeWidth="0.8" strokeLinecap="round" />
    <Path d="M28 62 L46 61.8" stroke="#0F4A41" strokeWidth="0.8" strokeLinecap="round" />

    {/* خطوط النص اليسار */}
    <Path d="M54 46 L72 46" stroke="#0F4A41" strokeWidth="0.8" strokeLinecap="round" />
    <Path d="M54 50 L72 50" stroke="#0F4A41" strokeWidth="0.8" strokeLinecap="round" />
    <Path d="M54 54 L68 54" stroke="#0F4A41" strokeWidth="0.8" strokeLinecap="round" />
    <Path d="M54 58 L72 58" stroke="#0F4A41" strokeWidth="0.8" strokeLinecap="round" />
    <Path d="M54 62 L70 62" stroke="#0F4A41" strokeWidth="0.8" strokeLinecap="round" />

    {/* الغلاف الأخضر */}
    <Path d="M18 35 L50 33 L18 35 Z" fill="url(#cover-mushaf)" />
    <Path d="M82 35 L50 33 L82 35 Z" fill="url(#cover-mushaf)" />
    <Path d="M18 35 L18 75 L22 72 L22 38 Z" fill="url(#cover-mushaf)" />
    <Path d="M82 35 L82 75 L78 72 L78 38 Z" fill="url(#cover-mushaf)" />

    {/* رصيعة ذهبية في القلب */}
    <Circle cx="50" cy="54" r="6" fill="#D4B570" />
    <Circle cx="50" cy="54" r="4" fill="#0A3D38" />
    <Path d="M50,48 L52,52 L56,54 L52,56 L50,60 L48,56 L44,54 L48,52 Z" fill="#D4B570" />
  </Svg>
);

// =================== التحفيظ (دماغ + نجوم) ===================
export const IllMemo: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-memo" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A2384B" />
        <Stop offset="100%" stopColor="#7B2638" />
      </LinearGradient>
      <LinearGradient id="brain" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FBE6D4" />
        <Stop offset="100%" stopColor="#F5C9A8" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-memo)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* الدماغ */}
    <Path
      d="M 35 42
         C 30 42, 26 46, 26 52
         C 24 54, 24 60, 28 62
         C 28 68, 34 72, 40 70
         C 42 74, 50 74, 52 70
         C 60 74, 68 70, 68 62
         C 72 60, 72 54, 70 52
         C 70 46, 66 42, 60 42
         C 58 38, 50 38, 48 42
         C 44 38, 38 38, 35 42 Z"
      fill="url(#brain)"
      stroke="#A2384B" strokeWidth="1.2"
    />
    {/* خطوط الدماغ */}
    <Path d="M38 50 Q42 47, 46 50 Q50 53, 54 50 Q58 47, 62 50" stroke="#A2384B" strokeWidth="0.8" fill="none" />
    <Path d="M38 58 Q42 55, 46 58 Q50 61, 54 58 Q58 55, 62 58" stroke="#A2384B" strokeWidth="0.8" fill="none" />
    <Path d="M48 44 L48 68" stroke="#A2384B" strokeWidth="0.8" />

    {/* نجوم ذهبية محيطة */}
    <Path d="M20,30 L22,34 L26,36 L22,38 L20,42 L18,38 L14,36 L18,34 Z" fill="#D4B570" />
    <Path d="M80,28 L81,30 L83,31 L81,32 L80,34 L79,32 L77,31 L79,30 Z" fill="#D4B570" />
    <Path d="M75,72 L77,76 L81,78 L77,80 L75,84 L73,80 L69,78 L73,76 Z" fill="#D4B570" opacity="0.85" />
    <Circle cx="22" cy="62" r="1.5" fill="#FBF7EA" />
    <Circle cx="78" cy="50" r="1.2" fill="#FBF7EA" />
  </Svg>
);

// =================== الأذكار ===================
export const IllAdhkar: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-adhkar" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#1B2747" />
        <Stop offset="100%" stopColor="#0E1A35" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-adhkar)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* نجوم خلفية */}
    <Circle cx="20" cy="25" r="0.8" fill="#FBF7EA" />
    <Circle cx="80" cy="22" r="0.7" fill="#FBF7EA" />
    <Circle cx="28" cy="76" r="0.6" fill="#FBF7EA" />
    <Circle cx="76" cy="78" r="0.8" fill="#FBF7EA" />
    <Path d="M18,38 L19,40 L21,41 L19,42 L18,44 L17,42 L15,41 L17,40 Z" fill="#FBF7EA" />
    <Path d="M82,42 L83,44 L85,45 L83,46 L82,48 L81,46 L79,45 L81,44 Z" fill="#FBF7EA" />

    {/* الهلال */}
    <Path
      d="M 65 36
         A 22 22 0 1 0 65 70
         A 18 18 0 1 1 65 36 Z"
      fill="#D4B570"
    />
    <Path
      d="M 65 36
         A 22 22 0 1 0 65 70
         A 18 18 0 1 1 65 36 Z"
      fill="none" stroke="#B8923B" strokeWidth="0.8"
    />

    {/* نجمة ذهبية بجوار الهلال */}
    <Path d="M40,50 L43,57 L50,59 L43,61 L40,68 L37,61 L30,59 L37,57 Z" fill="#D4B570" />
    <Path d="M40,50 L43,57 L50,59 L43,61 L40,68 L37,61 L30,59 L37,57 Z" fill="#FBE6D4" opacity="0.4" />
  </Svg>
);

// =================== السبحة ===================
export const IllTasbeeh: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-tasbeeh" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D4B570" />
        <Stop offset="100%" stopColor="#8C7430" />
      </LinearGradient>
      <LinearGradient id="bead" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5C3417" />
        <Stop offset="100%" stopColor="#2E1B0D" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-tasbeeh)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#FBF7EA" strokeWidth="0.8" opacity="0.5" />

    {/* خيط السبحة - دائرة */}
    <Circle cx="50" cy="52" r="22" fill="none" stroke="#4A2E15" strokeWidth="1" />

    {/* خرزات (12 خرزة موزّعة) */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 2 * Math.PI) / 12 - Math.PI / 2;
      const cx = 50 + 22 * Math.cos(angle);
      const cy = 52 + 22 * Math.sin(angle);
      return <Circle key={i} cx={cx} cy={cy} r="3.5" fill="url(#bead)" stroke="#4A2E15" strokeWidth="0.3" />;
    })}

    {/* الإمامة (الخرزة الكبيرة في الأعلى) */}
    <Circle cx="50" cy="30" r="5.5" fill="#2E1B0D" stroke="#4A2E15" strokeWidth="0.5" />
    <Circle cx="50" cy="28.5" r="2" fill="#5C3417" />

    {/* القُطّاعة (شراشيب) */}
    <Path d="M50 35 L50 44" stroke="#FBE6D4" strokeWidth="1.2" />
    <Path d="M48 44 L48 50 M50 44 L50 51 M52 44 L52 50" stroke="#FBE6D4" strokeWidth="0.8" />
    <Circle cx="50" cy="44" r="1.5" fill="#FBE6D4" />
  </Svg>
);

// =================== الاستماع ===================
export const IllAudio: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-audio" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2F5A8C" />
        <Stop offset="100%" stopColor="#173F66" />
      </LinearGradient>
      <LinearGradient id="hp" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FBF7EA" />
        <Stop offset="100%" stopColor="#D4B570" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-audio)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* موجات صوت يمين */}
    <Path d="M18 50 Q14 50, 12 46" stroke="#D4B570" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <Path d="M18 50 Q12 50, 10 42" stroke="#D4B570" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6" />

    {/* موجات صوت يسار */}
    <Path d="M82 50 Q86 50, 88 46" stroke="#D4B570" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <Path d="M82 50 Q88 50, 90 42" stroke="#D4B570" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6" />

    {/* قوس الرأس */}
    <Path d="M 25 52 C 25 30, 75 30, 75 52" fill="none" stroke="#D4B570" strokeWidth="3.5" strokeLinecap="round" />
    <Path d="M 25 52 C 25 30, 75 30, 75 52" fill="none" stroke="#FBE6D4" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

    {/* السماعة اليمنى */}
    <Rect x="20" y="48" width="14" height="22" rx="6" fill="url(#hp)" stroke="#8C7430" strokeWidth="0.6" />
    <Rect x="22" y="54" width="10" height="14" rx="3" fill="#2E1B0D" />
    <Circle cx="27" cy="61" r="3" fill="#4A2E15" />
    <Circle cx="27" cy="60" r="1" fill="#D4B570" />

    {/* السماعة اليسرى */}
    <Rect x="66" y="48" width="14" height="22" rx="6" fill="url(#hp)" stroke="#8C7430" strokeWidth="0.6" />
    <Rect x="68" y="54" width="10" height="14" rx="3" fill="#2E1B0D" />
    <Circle cx="73" cy="61" r="3" fill="#4A2E15" />
    <Circle cx="73" cy="60" r="1" fill="#D4B570" />
  </Svg>
);

// =================== التجويد ===================
export const IllTajweed: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-tajweed" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5E7F4F" />
        <Stop offset="100%" stopColor="#3D5535" />
      </LinearGradient>
      <LinearGradient id="page" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FBF7EA" />
        <Stop offset="100%" stopColor="#E8DFC4" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-tajweed)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* قبعة التخرّج */}
    <Polygon points="50,28 76,40 50,52 24,40" fill="#1A1815" />
    <Polygon points="50,28 76,40 50,52 24,40" fill="#2E2A22" opacity="0.5" />
    <Path d="M 30 42 L 30 56 C 30 60, 70 60, 70 56 L 70 42" fill="#1A1815" />
    <Path d="M 32 44 L 32 56 C 32 58, 68 58, 68 56 L 68 44" fill="#2E2A22" />
    {/* الزِّر العلوي للقبعة */}
    <Circle cx="50" cy="40" r="2" fill="#D4B570" />
    {/* الشُّرّابة */}
    <Path d="M50 40 L72 38 L74 52" stroke="#D4B570" strokeWidth="1.4" fill="none" />
    <Path d="M72 52 L72 60 M74 52 L74 62 M76 52 L76 60" stroke="#D4B570" strokeWidth="1" />
    <Circle cx="74" cy="52" r="1.5" fill="#FBE6D4" />

    {/* كتاب أسفل */}
    <Path d="M 22 68 L 50 66 L 78 68 L 78 78 L 50 76 L 22 78 Z" fill="url(#page)" stroke="#B8923B" strokeWidth="0.5" />
    <Path d="M 30 71 L 44 71 M 30 74 L 42 74" stroke="#5E7F4F" strokeWidth="0.6" />
    <Path d="M 56 71 L 70 71 M 56 74 L 68 74" stroke="#5E7F4F" strokeWidth="0.6" />
    <Path d="M 50 66 L 50 76" stroke="#B8923B" strokeWidth="0.5" />
  </Svg>
);

// =================== التسميع (مايكروفون) ===================
export const IllTasmee: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-tasmee" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#B5563C" />
        <Stop offset="100%" stopColor="#823821" />
      </LinearGradient>
      <LinearGradient id="micbody" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D4B570" />
        <Stop offset="100%" stopColor="#8C7430" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-tasmee)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* موجات حول الميكروفون */}
    <Path d="M 28 50 Q 24 50, 22 44" stroke="#FBE6D4" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    <Path d="M 28 56 Q 22 56, 20 60" stroke="#FBE6D4" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    <Path d="M 72 50 Q 76 50, 78 44" stroke="#FBE6D4" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    <Path d="M 72 56 Q 78 56, 80 60" stroke="#FBE6D4" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    <Path d="M 28 50 Q 18 50, 16 40" stroke="#FBE6D4" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.5" />
    <Path d="M 72 50 Q 82 50, 84 40" stroke="#FBE6D4" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.5" />

    {/* جسم الميكروفون */}
    <Rect x="40" y="22" width="20" height="36" rx="10" fill="url(#micbody)" stroke="#5C4012" strokeWidth="0.6" />
    {/* خطوط الشبكة */}
    <Path d="M 42 30 L 58 30 M 42 35 L 58 35 M 42 40 L 58 40 M 42 45 L 58 45 M 42 50 L 58 50" stroke="#5C4012" strokeWidth="0.4" opacity="0.7" />
    {/* لمعة */}
    <Path d="M 42 24 L 42 56" stroke="#FBE6D4" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />

    {/* حلقة الإمساك */}
    <Path d="M 30 50 C 30 65, 70 65, 70 50" fill="none" stroke="#D4B570" strokeWidth="2.5" strokeLinecap="round" />

    {/* القاعدة */}
    <Path d="M 50 58 L 50 72" stroke="#D4B570" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M 40 76 L 60 76" stroke="#D4B570" strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

// =================== الختمة (وسام) ===================
export const IllKhatma: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-khatma" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#7A5530" />
        <Stop offset="100%" stopColor="#4A331C" />
      </LinearGradient>
      <LinearGradient id="medal" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F5EAC4" />
        <Stop offset="50%" stopColor="#D4B570" />
        <Stop offset="100%" stopColor="#8C7430" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-khatma)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* الشريط الأحمر */}
    <Path d="M 38 18 L 50 38 L 62 18 Z" fill="#B84A3E" />
    <Path d="M 38 18 L 38 30 L 44 28 Z" fill="#7C2E25" />
    <Path d="M 62 18 L 62 30 L 56 28 Z" fill="#7C2E25" />
    <Path d="M 46 26 L 50 32 L 54 26" fill="none" stroke="#FBE6D4" strokeWidth="0.5" opacity="0.5" />

    {/* أشعة الوسام */}
    <G transform="translate(50, 60)">
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 16;
        const x1 = 0;
        const y1 = -22;
        return (
          <Polygon
            key={i}
            points={`-2,-22 2,-22 0,-15`}
            fill="#D4B570"
            transform={`rotate(${(i * 360) / 16})`}
            opacity={i % 2 === 0 ? 1 : 0.6}
          />
        );
      })}
    </G>

    {/* القرص الذهبي */}
    <Circle cx="50" cy="60" r="16" fill="url(#medal)" />
    <Circle cx="50" cy="60" r="16" fill="none" stroke="#8C7430" strokeWidth="0.8" />
    <Circle cx="50" cy="60" r="12" fill="none" stroke="#8C7430" strokeWidth="0.4" opacity="0.5" />

    {/* النجمة في القرص */}
    <Path d="M50,50 L52.5,58 L60,60 L52.5,62 L50,70 L47.5,62 L40,60 L47.5,58 Z" fill="#0A3D38" />
    <Circle cx="50" cy="60" r="2" fill="#D4B570" />
  </Svg>
);

// =================== الورد اليومي (شمس) ===================
export const IllDailyWird: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-wird" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F5A742" />
        <Stop offset="100%" stopColor="#C77B2F" />
      </LinearGradient>
      <LinearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FBF7EA" />
        <Stop offset="100%" stopColor="#F5C9A8" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-wird)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* أشعة الشمس */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * Math.PI * 2) / 12;
      const x1 = 50 + 26 * Math.cos(angle);
      const y1 = 50 + 26 * Math.sin(angle);
      const x2 = 50 + 36 * Math.cos(angle);
      const y2 = 50 + 36 * Math.sin(angle);
      return <Path key={i} d={`M${x1},${y1} L${x2},${y2}`} stroke="#FBF7EA" strokeWidth="2.5" strokeLinecap="round" />;
    })}

    {/* قرص الشمس */}
    <Circle cx="50" cy="50" r="20" fill="url(#sun)" stroke="#D4B570" strokeWidth="0.8" />

    {/* وجه (ابتسامة لطيفة) */}
    <Circle cx="44" cy="48" r="1.5" fill="#823821" />
    <Circle cx="56" cy="48" r="1.5" fill="#823821" />
    <Path d="M 44 56 Q 50 60, 56 56" stroke="#823821" strokeWidth="1.4" fill="none" strokeLinecap="round" />

    {/* كتاب صغير في الأسفل */}
    <Path d="M 38 72 L 50 70 L 62 72 L 62 78 L 50 76 L 38 78 Z" fill="#FBF7EA" stroke="#823821" strokeWidth="0.5" />
    <Path d="M 50 70 L 50 76" stroke="#823821" strokeWidth="0.5" />
  </Svg>
);

// =================== الأدعية (يدان) ===================
export const IllDuas: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-duas" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#3F8F6E" />
        <Stop offset="100%" stopColor="#1F5F49" />
      </LinearGradient>
      <LinearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F5C9A8" />
        <Stop offset="100%" stopColor="#D49C7A" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-duas)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* أشعة من الأعلى */}
    <Path d="M 50 18 L 50 30" stroke="#D4B570" strokeWidth="1.2" opacity="0.7" />
    <Path d="M 38 22 L 42 32" stroke="#D4B570" strokeWidth="0.9" opacity="0.6" />
    <Path d="M 62 22 L 58 32" stroke="#D4B570" strokeWidth="0.9" opacity="0.6" />
    <Circle cx="50" cy="16" r="3" fill="#D4B570" opacity="0.9" />
    <Circle cx="50" cy="16" r="6" fill="#D4B570" opacity="0.2" />

    {/* اليد اليمنى */}
    <Path
      d="M 30 60 L 30 78 L 48 76 L 48 60 L 48 48 C 48 44, 42 44, 42 48 L 42 56 L 40 56 L 40 50 C 40 46, 34 46, 34 50 L 34 58 L 32 58 L 32 52 C 32 48, 28 48, 28 52 L 28 60 Z"
      fill="url(#skin)" stroke="#823821" strokeWidth="0.6"
    />
    {/* اليد اليسرى */}
    <Path
      d="M 70 60 L 70 78 L 52 76 L 52 60 L 52 48 C 52 44, 58 44, 58 48 L 58 56 L 60 56 L 60 50 C 60 46, 66 46, 66 50 L 66 58 L 68 58 L 68 52 C 68 48, 72 48, 72 52 L 72 60 Z"
      fill="url(#skin)" stroke="#823821" strokeWidth="0.6"
    />

    {/* نجمة بين اليدين */}
    <Path d="M50,38 L51.5,42 L55.5,43 L52,45 L50,49 L48,45 L44.5,43 L48.5,42 Z" fill="#D4B570" />
  </Svg>
);

// =================== القبلة (بوصلة) ===================
export const IllQibla: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-qibla" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5EB3A7" />
        <Stop offset="100%" stopColor="#2D6F65" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-qibla)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* قرص البوصلة */}
    <Circle cx="50" cy="50" r="30" fill="#FBF7EA" stroke="#B8923B" strokeWidth="1.2" />
    <Circle cx="50" cy="50" r="26" fill="none" stroke="#B8923B" strokeWidth="0.4" opacity="0.5" />

    {/* الجهات */}
    <Path d="M50 24 L48 32 L52 32 Z" fill="#A2384B" />
    <Path d="M50 76 L48 68 L52 68 Z" fill="#1B2747" />
    <Circle cx="50" cy="50" r="3" fill="#1B2747" />

    {/* علامات الجهات الإضافية */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * Math.PI * 2) / 12;
      const x1 = 50 + 22 * Math.cos(angle);
      const y1 = 50 + 22 * Math.sin(angle);
      const x2 = 50 + 26 * Math.cos(angle);
      const y2 = 50 + 26 * Math.sin(angle);
      return <Path key={i} d={`M${x1},${y1} L${x2},${y2}`} stroke="#1B2747" strokeWidth={i % 3 === 0 ? 1 : 0.4} />;
    })}

    {/* الكعبة الصغيرة في الأعلى (الاتجاه) */}
    <Rect x="46" y="14" width="8" height="8" fill="#1A1815" stroke="#D4B570" strokeWidth="0.4" />
    <Path d="M 47 16 L 53 16" stroke="#D4B570" strokeWidth="0.5" />
  </Svg>
);

// =================== حاسبة الزكاة ===================
export const IllZakat: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-zakat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F5C76A" />
        <Stop offset="100%" stopColor="#C9A22A" />
      </LinearGradient>
      <LinearGradient id="bag" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FBF7EA" />
        <Stop offset="100%" stopColor="#D4B570" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-zakat)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#1A1815" strokeWidth="0.8" opacity="0.3" />

    {/* كيس النقود */}
    <Path
      d="M 30 42 L 32 30 L 68 30 L 70 42 C 80 50, 80 78, 50 78 C 20 78, 20 50, 30 42 Z"
      fill="url(#bag)" stroke="#8C7430" strokeWidth="0.8"
    />
    <Path d="M 32 30 L 68 30" stroke="#8C7430" strokeWidth="1.5" />
    <Path d="M 38 30 Q 40 25, 50 25 Q 60 25, 62 30" fill="none" stroke="#8C7430" strokeWidth="1" />

    {/* علامة الدرهم في الوسط */}
    <Circle cx="50" cy="58" r="11" fill="#0A3D38" />
    <Circle cx="50" cy="58" r="11" fill="none" stroke="#D4B570" strokeWidth="0.6" />
    <Path d="M 46 53 L 46 63 M 50 53 L 50 63 M 54 53 L 54 63 M 44 58 L 56 58" stroke="#D4B570" strokeWidth="1.2" />

    {/* قطع ذهبية صغيرة */}
    <Circle cx="22" cy="72" r="3" fill="#D4B570" stroke="#8C7430" strokeWidth="0.4" />
    <Circle cx="78" cy="74" r="2.5" fill="#D4B570" stroke="#8C7430" strokeWidth="0.4" />
    <Circle cx="76" cy="68" r="1.5" fill="#D4B570" />
  </Svg>
);

// =================== التقويم ===================
export const IllCalendar: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-cal" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#AD93D1" />
        <Stop offset="100%" stopColor="#6B4FBB" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-cal)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* رأس التقويم - أحمر */}
    <Path d="M 24 30 L 76 30 L 76 40 L 24 40 Z" fill="#A2384B" />
    {/* جسم التقويم - أبيض */}
    <Path d="M 24 40 L 76 40 L 76 76 L 24 76 Z" fill="#FBF7EA" stroke="#7C2E25" strokeWidth="0.6" />

    {/* مشابك */}
    <Rect x="34" y="22" width="3" height="14" rx="1.5" fill="#5C4012" />
    <Rect x="63" y="22" width="3" height="14" rx="1.5" fill="#5C4012" />

    {/* شبكة الأيام */}
    {[0, 1, 2, 3, 4].map((row) =>
      [0, 1, 2, 3, 4].map((col) => (
        <Circle
          key={`${row}-${col}`}
          cx={32 + col * 9}
          cy={48 + row * 6}
          r="1.4"
          fill={row === 2 && col === 2 ? '#A2384B' : '#1B2747'}
          opacity={row === 2 && col === 2 ? 1 : 0.7}
        />
      ))
    )}
    {/* اليوم المختار - دائرة محيطة */}
    <Circle cx="50" cy="60" r="3.5" fill="none" stroke="#D4B570" strokeWidth="1" />
  </Svg>
);

// =================== مساجد ===================
export const IllMosques: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-mosque" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5EB3A7" />
        <Stop offset="100%" stopColor="#2D6F65" />
      </LinearGradient>
      <LinearGradient id="dome" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FBF7EA" />
        <Stop offset="100%" stopColor="#D4B570" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-mosque)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* أرضية */}
    <Path d="M 14 78 L 86 78" stroke="#FBF7EA" strokeWidth="0.6" opacity="0.5" />

    {/* المئذنة اليمنى */}
    <Rect x="24" y="42" width="6" height="36" fill="#FBF7EA" stroke="#8C7430" strokeWidth="0.4" />
    <Circle cx="27" cy="40" r="3" fill="url(#dome)" stroke="#8C7430" strokeWidth="0.4" />
    <Path d="M 27 36 L 27 30" stroke="#D4B570" strokeWidth="0.6" />
    <Circle cx="27" cy="30" r="1.2" fill="#D4B570" />

    {/* المئذنة اليسرى */}
    <Rect x="70" y="42" width="6" height="36" fill="#FBF7EA" stroke="#8C7430" strokeWidth="0.4" />
    <Circle cx="73" cy="40" r="3" fill="url(#dome)" stroke="#8C7430" strokeWidth="0.4" />
    <Path d="M 73 36 L 73 30" stroke="#D4B570" strokeWidth="0.6" />
    <Circle cx="73" cy="30" r="1.2" fill="#D4B570" />

    {/* الجسم الرئيسي */}
    <Rect x="32" y="50" width="36" height="28" fill="#FBF7EA" stroke="#8C7430" strokeWidth="0.4" />

    {/* القبة الرئيسية */}
    <Path d="M 32 50 C 32 32, 68 32, 68 50 Z" fill="url(#dome)" stroke="#8C7430" strokeWidth="0.6" />
    <Path d="M 50 30 L 50 22" stroke="#D4B570" strokeWidth="0.8" />
    <Circle cx="50" cy="20" r="1.8" fill="#D4B570" />
    <Path d="M 48 22 C 48 18, 52 18, 52 22" fill="#D4B570" />

    {/* قبيبتان صغيرتان */}
    <Path d="M 36 50 C 36 44, 44 44, 44 50 Z" fill="url(#dome)" stroke="#8C7430" strokeWidth="0.4" />
    <Path d="M 56 50 C 56 44, 64 44, 64 50 Z" fill="url(#dome)" stroke="#8C7430" strokeWidth="0.4" />

    {/* الباب */}
    <Path d="M 46 78 L 46 64 C 46 62, 50 60, 50 60 C 50 60, 54 62, 54 64 L 54 78" fill="#1A1815" />
    <Circle cx="52" cy="71" r="0.7" fill="#D4B570" />
  </Svg>
);

// =================== الإحصائيات (رسم بياني) ===================
export const IllStats: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-stats" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#7AB0D9" />
        <Stop offset="100%" stopColor="#2F5A8C" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-stats)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* خلفية الرسم */}
    <Rect x="22" y="28" width="56" height="48" rx="2" fill="#FBF7EA" stroke="#8C7430" strokeWidth="0.6" />

    {/* خطوط شبكة */}
    <Path d="M 22 40 L 78 40" stroke="#D4B570" strokeWidth="0.3" opacity="0.5" />
    <Path d="M 22 52 L 78 52" stroke="#D4B570" strokeWidth="0.3" opacity="0.5" />
    <Path d="M 22 64 L 78 64" stroke="#D4B570" strokeWidth="0.3" opacity="0.5" />

    {/* أعمدة البيانات */}
    <Rect x="28" y="52" width="6" height="20" fill="#2F5A8C" />
    <Rect x="38" y="44" width="6" height="28" fill="#3F8F6E" />
    <Rect x="48" y="36" width="6" height="36" fill="#D4B570" />
    <Rect x="58" y="48" width="6" height="24" fill="#B5563C" />
    <Rect x="68" y="40" width="6" height="32" fill="#6B4FBB" />

    {/* خط نمو */}
    <Path d="M 31 52 L 41 44 L 51 36 L 61 48 L 71 40" fill="none" stroke="#A2384B" strokeWidth="1.4" strokeLinecap="round" />
    <Circle cx="31" cy="52" r="1.5" fill="#A2384B" />
    <Circle cx="41" cy="44" r="1.5" fill="#A2384B" />
    <Circle cx="51" cy="36" r="1.5" fill="#A2384B" />
    <Circle cx="61" cy="48" r="1.5" fill="#A2384B" />
    <Circle cx="71" cy="40" r="1.5" fill="#A2384B" />

    {/* سهم صاعد */}
    <Path d="M 78 32 L 74 26 L 76 26 L 76 22 L 80 22 L 80 26 L 82 26 Z" fill="#3F8F6E" />
  </Svg>
);

// =================== الإنجازات (كأس) ===================
export const IllAchievements: React.FC<IProps> = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="bg-ach" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E0743D" />
        <Stop offset="100%" stopColor="#A14422" />
      </LinearGradient>
      <LinearGradient id="cup" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FBF7EA" />
        <Stop offset="50%" stopColor="#D4B570" />
        <Stop offset="100%" stopColor="#8C7430" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="48" fill="url(#bg-ach)" />
    <Circle cx="50" cy="50" r="48" fill="none" stroke="#D4B570" strokeWidth="0.8" opacity="0.4" />

    {/* الكأس - الجسم */}
    <Path
      d="M 32 30
         L 68 30
         L 66 50
         C 66 58, 60 64, 50 64
         C 40 64, 34 58, 34 50 Z"
      fill="url(#cup)" stroke="#5C4012" strokeWidth="0.8"
    />
    {/* المقبضان */}
    <Path d="M 32 34 C 22 36, 22 48, 32 48" fill="none" stroke="#D4B570" strokeWidth="2.4" />
    <Path d="M 68 34 C 78 36, 78 48, 68 48" fill="none" stroke="#D4B570" strokeWidth="2.4" />

    {/* نجمة في القلب */}
    <Path d="M50,38 L52,44 L58,46 L52,48 L50,54 L48,48 L42,46 L48,44 Z" fill="#A2384B" />

    {/* الساق */}
    <Rect x="46" y="64" width="8" height="6" fill="#D4B570" />
    {/* القاعدة */}
    <Path d="M 36 70 L 64 70 L 60 78 L 40 78 Z" fill="url(#cup)" stroke="#5C4012" strokeWidth="0.6" />

    {/* ومضات */}
    <Circle cx="22" cy="26" r="1.5" fill="#FBF7EA" />
    <Circle cx="78" cy="24" r="1.2" fill="#FBF7EA" />
    <Path d="M18,68 L19,71 L22,72 L19,73 L18,76 L17,73 L14,72 L17,71 Z" fill="#FBF7EA" opacity="0.8" />
  </Svg>
);
