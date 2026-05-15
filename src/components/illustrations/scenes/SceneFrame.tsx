/**
 * إطار قوس مسجد - يحتضن أي مشهد بأسلوب الرسومات الإسلامية الحديثة.
 * مستوحى من تصميم الـ "Illustrated Islamic Cards":
 *   - قوس مدبّب أعلى البطاقة
 *   - خلفية بـ gradient ناعم
 *   - سحب بسيطة (اختياري)
 *   - أرضية أو خط أساس
 */
import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, ClipPath, Rect, Circle } from 'react-native-svg';

interface SceneFrameProps {
  size: number;
  /** ألوان الخلفية - top + bottom. */
  bgTop: string;
  bgBottom: string;
  /** لون داكن للجدران/الإطار الداخلي. */
  wallColor?: string;
  /** الـ children = المشهد الذي يُرسَم داخل القوس (يستخدم نفس viewBox 100×100). */
  children?: React.ReactNode;
  /** الـ children المخفيّة - تُرسم خارج clip path (مثل النجوم خارج الإطار). */
  decorations?: React.ReactNode;
  /** عرض الإطار الذهبي حول البطاقة. */
  borderColor?: string;
  /** سحب في الخلفية - true يضيفها افتراضياً. */
  clouds?: boolean;
  /** أرضية تحت المشهد - true يضيف خطًا أساسيًا. */
  ground?: boolean;
  /** اسم فريد للـ clipPath (لتجنّب التصادمات). */
  uid: string;
}

export const SceneFrame: React.FC<SceneFrameProps> = ({
  size,
  bgTop,
  bgBottom,
  wallColor,
  children,
  decorations,
  borderColor = '#B8923B',
  clouds = true,
  ground = true,
  uid,
}) => {
  // قوس مدبّب إسلامي: قاعدة مستقيمة + قوسان منحنيان يلتقيان أعلى
  // الأبعاد: 100×100 viewBox، القوس من y=22 إلى الأطراف
  const archPath =
    'M 12 92 ' +              // أسفل اليسار
    'L 12 50 ' +              // صعود مستقيم
    'Q 12 22 50 14 ' +        // قوس يسار → قمّة
    'Q 88 22 88 50 ' +        // قمّة → قوس يمين
    'L 88 92 Z';              // أسفل اليمين + إغلاق

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* تدرّج الخلفية */}
        <LinearGradient id={`bg-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={bgTop} />
          <Stop offset="100%" stopColor={bgBottom} />
        </LinearGradient>

        {/* تدرّج للحوائط (اختياري) */}
        {wallColor && (
          <LinearGradient id={`wall-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={wallColor} stopOpacity="0.0" />
            <Stop offset="100%" stopColor={wallColor} stopOpacity="0.35" />
          </LinearGradient>
        )}

        {/* clip path للقوس - أي شيء داخله يكون داخل القوس */}
        <ClipPath id={`clip-${uid}`}>
          <Path d={archPath} />
        </ClipPath>
      </Defs>

      {/* المساحة خارج القوس - يمكن وضع decorations فيها */}
      {decorations}

      {/* خلفية القوس */}
      <Path d={archPath} fill={`url(#bg-${uid})`} />

      {/* داخل القوس - clip للمشهد */}
      <Rect width="100" height="100" fill={`url(#bg-${uid})`} clipPath={`url(#clip-${uid})`} />

      {/* سحب في الخلفية */}
      {clouds && (
        <Path
          d="M 20 36 Q 23 32 28 33 Q 31 30 35 32 Q 39 31 40 36 L 20 36 Z M 60 30 Q 64 26 68 28 Q 72 27 73 31 L 60 30 Z"
          fill="#FBF7EA"
          opacity={0.5}
          clipPath={`url(#clip-${uid})`}
        />
      )}

      {/* المشهد الفعلي - clipped to arch */}
      <Rect width="0" height="0" clipPath={`url(#clip-${uid})`} />
      <Path d={archPath} fill="transparent" />
      {/* children - يُلَفّ تلقائياً بـ clipPath عبر <g> */}
      {children && (
        // ملاحظة: react-native-svg <G> لا يدعم clipPath بنفس الجودة عبر المنصات؛
        // لذا الأفضل أن يضيف كل child الخاصية clipPath="url(#clip-uid)" بنفسه.
        // لكن للأسلوب الموحّد، نضمن الـ clip عبر تمرير uid للأبناء.
        children
      )}

      {/* أرضية - خط أساس داخل القوس */}
      {ground && (
        <Path
          d="M 12 86 L 88 86"
          stroke="#FBF7EA"
          strokeWidth="0.6"
          strokeOpacity="0.45"
          clipPath={`url(#clip-${uid})`}
        />
      )}

      {/* إطار القوس - خط ذهبي رفيع */}
      <Path
        d={archPath}
        fill="none"
        stroke={borderColor}
        strokeWidth="1.5"
        strokeOpacity="0.85"
      />
      {/* إطار داخلي خفيف */}
      <Path
        d={archPath}
        fill="none"
        stroke={borderColor}
        strokeWidth="0.4"
        strokeOpacity="0.45"
        transform="translate(0 0)"
      />

      {/* رصيعة القمّة (تاج صغير) */}
      <Circle cx="50" cy="14" r="1.8" fill={borderColor} />
      <Path d="M 48 14 L 50 10 L 52 14 L 50 18 Z" fill={borderColor} opacity={0.85} />
    </Svg>
  );
};

/**
 * مكوّن مساعد لرسم أي شكل داخل القوس - يلفّ children بـ clipPath بنفس uid.
 * يُستخدم داخل children الـ SceneFrame.
 */
export const InsideArch: React.FC<{ uid: string; children: React.ReactNode }> = ({ uid, children }) => {
  return (
    <>
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, { clipPath: `url(#clip-${uid})` }),
      )}
    </>
  );
};
