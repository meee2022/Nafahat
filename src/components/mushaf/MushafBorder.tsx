/**
 * 📜 إطار صفحة المصحف - تصميم عثماني زخرفي (Tezhip).
 *
 * البنية الكاملة:
 *  ١. خلفية عاجية دافئة (Warm Ivory).
 *  ٢. إطار خارجي رفيع ذهبي فاتح.
 *  ٣. إطار داخلي رفيع ذهبي بيج هادئ.
 *  ٤. شريط زخرفي علوي وسفلي بنقش نباتي متموّج.
 *  ٥. زخارف جانبية رفيعة (sideMotifs) متكرّرة على اليمين واليسار.
 *  ٦. أربع زخارف زاوية كبيرة - عقود/أقواس مزخرفة.
 *  ٧. النص القرآني فوق الكل في طبقة منفصلة (zIndex: 1).
 *
 * كل المقاييس ديناميكية (تُحسب من عرض/ارتفاع الـ container الفعلي).
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, G, Pattern, Path, Circle, Rect, Use } from 'react-native-svg';

// ─────────────────────────────────────────────
// 🎨 لوحة الألوان (Soft Ottoman)
// ─────────────────────────────────────────────
export const MUSHAF_BG         = '#FBF8F2';   // عاجي دافئ (الخلفية)
export const MUSHAF_CREAM      = '#F7F1E6';   // كريمي للأزرار
export const MUSHAF_GOLD       = '#BFA178';   // ذهبي بيج هادئ (Soft Gold)
export const MUSHAF_GOLD_DEEP  = '#9E7D4F';   // ذهبي داكن
export const MUSHAF_GOLD_LIGHT = '#D8C39B';   // ذهبي فاتح
export const MUSHAF_INK        = '#111111';   // لون النص

// ─────────────────────────────────────────────
// 🔌 OrnamentStrip - متبقّي للتوافق الخلفي مع Header/Footer
// ─────────────────────────────────────────────
interface StripProps {
  length?: number;
  isVertical?: boolean;
  /** لون النقش الذهبي - يتلقّاه من الـ palette ليتفاعل مع الـ theme. */
  goldColor?: string;
  /** لون الخلفية - عاجي في light، داكن دافئ في dark. */
  bgColor?: string;
}

/**
 * شريط زخرفي رفيع بنقش نباتي - يستخدمه الـ Header والـ Footer للتجانس.
 * نفس النمط المُستخدم داخل الإطار الرئيسي.
 */
export const OrnamentStrip: React.FC<StripProps> = ({
  length,
  isVertical = false,
  goldColor = MUSHAF_GOLD,
  bgColor = MUSHAF_BG,
}) => {
  // ID فريد لكل instance لمنع تصادم Pattern IDs بين الـ Header والـ Footer
  const patternId = useMemo(
    () => `orn-${isVertical ? 'v' : 'h'}-${Math.random().toString(36).slice(2, 8)}`,
    [isVertical],
  );
  const svg = (
    <Svg width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <Pattern
          id={patternId}
          x="0" y="0"
          width="30" height="16"
          patternUnits="userSpaceOnUse"
          patternTransform={isVertical ? 'rotate(90, 15, 8)' : undefined}
        >
          <Path
            d="M0 8 C6 0, 12 0, 15 8 C18 16, 24 16, 30 8"
            fill="none" stroke={goldColor} strokeWidth="1"
          />
          <Path
            d="M15 3 C18 6, 18 10, 15 13 C12 10, 12 6, 15 3Z"
            fill="none" stroke={goldColor} strokeWidth="0.9"
          />
          <Circle cx="15" cy="8" r="1.2" fill={goldColor} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={bgColor} />
      <Rect width="100%" height="100%" fill={`url(#${patternId})`} opacity={0.85} />
    </Svg>
  );

  if (isVertical) {
    return <View style={{ width: 14, alignSelf: 'stretch' }}>{svg}</View>;
  }
  return <View style={{ height: 14, width: length ?? '100%' }}>{svg}</View>;
};

/** رصيعة معيّنية صغيرة - متبقّية للتوافق. */
export const CornerDiamond: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    <Path d="M10,1 L19,10 L10,19 L1,10 Z" fill={MUSHAF_GOLD} opacity={0.9} />
    <Circle cx="10" cy="10" r="2.2" fill={MUSHAF_BG} />
  </Svg>
);

// ─────────────────────────────────────────────
// 🏛️ المكوّن الأساسي - الإطار العثماني الزخرفي
// ─────────────────────────────────────────────
interface BorderProps {
  children: React.ReactNode;
  /** لون الذهبي الرئيسي - يتلقّاه من السياق (theme) */
  goldColor?: string;
  /** لون الذهبي الداكن */
  goldDeep?: string;
  /** لون الصفحة (الخلفية) - عاجي في light، بني داكن في dark */
  pageColor?: string;
  /** لون خلفية الزخارف (نفس pageColor عادةً) */
  ornamentBg?: string;
}

export const MushafBorder: React.FC<BorderProps> = ({
  children,
  goldColor   = MUSHAF_GOLD,
  goldDeep    = MUSHAF_GOLD_DEEP,
  pageColor   = MUSHAF_BG,
}) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { w, h } = size;

  // ذهبي فاتح = goldColor مع خفض اللمعان (للإطار الخارجي الأرفع)
  const goldLight = goldColor;

  // ثوابت التصميم
  const OUTER_INSET = 9;    // المسافة من حافة الـ container للإطار الخارجي (أنحف لإتاحة عرض أكبر للنص)
  const INNER_INSET = 15;   // المسافة للإطار الداخلي
  const STRIP_H     = 13;   // ارتفاع شريط الزخرفة الأفقي
  const CORNER_SZ   = 30;   // حجم الزخرفة الزاوية
  const MOTIF_GAP   = 36;   // المسافة بين زخارف الجوانب
  const MOTIF_OFFSET = 6;   // مسافة بدء الزخارف الجانبية من الزوايا

  // حساب عدد الزخارف الجانبية الممكنة بناءً على الارتفاع المتاح
  const sideAvailable = Math.max(0, h - INNER_INSET * 2 - CORNER_SZ * 2 - MOTIF_OFFSET * 2);
  const motifCount    = Math.max(0, Math.floor(sideAvailable / MOTIF_GAP));
  // قسّم البقايا بالتساوي على الطرفين لتظهر الزخارف وسط الإطار
  const motifsTotalH  = motifCount * MOTIF_GAP;
  const motifTopStart = INNER_INSET + CORNER_SZ + MOTIF_OFFSET + (sideAvailable - motifsTotalH) / 2;

  // مواضع الشريط العلوي/السفلي (بين الإطارين الداخلي والخارجي)
  const stripY_top    = (OUTER_INSET + INNER_INSET) / 2 - STRIP_H / 2;
  const stripY_bottom = h - (OUTER_INSET + INNER_INSET) / 2 - STRIP_H / 2;
  const stripX_start  = INNER_INSET + CORNER_SZ + 2;
  const stripW        = Math.max(0, w - (INNER_INSET + CORNER_SZ + 2) * 2);

  return (
    <View
      style={[styles.container, { backgroundColor: pageColor }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (Math.abs(width - size.w) > 1 || Math.abs(height - size.h) > 1) {
          setSize({ w: width, h: height });
        }
      }}
    >
      {/* ════ طبقة الإطار SVG (خلفية) ════ */}
      {w > 0 && h > 0 && (
        <Svg
          width={w}
          height={h}
          style={StyleSheet.absoluteFill}
          // الإطار زخرفي فقط، لا يستقبل ضغطات
          pointerEvents="none"
        >
          <Defs>
            {/* زخرفة جانبية (موجة + قطرة + موجة) */}
            <G id="sideMotif">
              <Path
                d="M0 12 C8 8, 8 2, 0 0 C-8 2, -8 8, 0 12 Z"
                fill="none" stroke={goldColor} strokeWidth="1.1"
              />
              <Path
                d="M0 3 C3 6, 3 8, 0 10 C-3 8, -3 6, 0 3 Z"
                fill={goldColor} opacity={0.35}
              />
              <Path
                d="M0 12 C4 18, 4 24, 0 30 C-4 24, -4 18, 0 12 Z"
                fill="none" stroke={goldColor} strokeWidth="1.1"
              />
              <Circle cx="0" cy="15" r="1.5" fill={goldColor} />
            </G>

            {/* زخرفة الزاوية - عقد عثماني مزخرف */}
            <G id="cornerOrnament">
              <Path
                d="M0 28 C18 28, 28 18, 28 0"
                fill="none" stroke={goldColor} strokeWidth="1.2"
              />
              <Path
                d="M6 28 C22 24, 24 22, 28 6"
                fill="none" stroke={goldColor} strokeWidth="1.1"
              />
              <Path
                d="M0 18 C10 20, 18 10, 18 0"
                fill="none" stroke={goldColor} strokeWidth="1"
              />
              <Path
                d="M10 28 C12 18, 18 12, 28 10"
                fill="none" stroke={goldDeep} strokeWidth="0.9"
              />
              <Path
                d="M7 21 C12 21, 21 12, 21 7"
                fill="none" stroke={goldColor} strokeWidth="0.9"
              />
              <Circle cx="14" cy="14" r="2.2" fill={goldColor} />
              <Circle cx="14" cy="14" r="1" fill={pageColor} />
            </G>

            {/* نقش الشريط العلوي/السفلي - أمواج عثمانية */}
            <Pattern
              id="topPattern"
              width="30" height="16"
              patternUnits="userSpaceOnUse"
            >
              <Path
                d="M0 8 C6 0, 12 0, 15 8 C18 16, 24 16, 30 8"
                fill="none" stroke={goldColor} strokeWidth="1"
              />
              <Path
                d="M15 3 C18 6, 18 10, 15 13 C12 10, 12 6, 15 3 Z"
                fill="none" stroke={goldColor} strokeWidth="0.9"
              />
              <Circle cx="15" cy="8" r="1.2" fill={goldColor} />
            </Pattern>
          </Defs>

          {/* الخلفية - عاجية أو داكنة دافئة حسب الـ theme */}
          <Rect x="0" y="0" width={w} height={h} fill={pageColor} />

          {/* الإطار الخارجي الرفيع */}
          <Rect
            x={OUTER_INSET} y={OUTER_INSET}
            width={w - OUTER_INSET * 2} height={h - OUTER_INSET * 2}
            fill="none"
            stroke={goldLight}
            strokeWidth="0.9"
            opacity={0.55}
          />

          {/* الإطار الداخلي الرفيع */}
          <Rect
            x={INNER_INSET} y={INNER_INSET}
            width={w - INNER_INSET * 2} height={h - INNER_INSET * 2}
            fill="none"
            stroke={goldColor}
            strokeWidth="0.9"
          />

          {/* شريط الزخرفة العلوي */}
          <Rect
            x={stripX_start} y={stripY_top}
            width={stripW} height={STRIP_H}
            fill="url(#topPattern)"
            opacity={0.9}
          />

          {/* شريط الزخرفة السفلي */}
          <Rect
            x={stripX_start} y={stripY_bottom}
            width={stripW} height={STRIP_H}
            fill="url(#topPattern)"
            opacity={0.9}
          />

          {/* الزخارف الجانبية - اليسار */}
          {Array.from({ length: motifCount }, (_, i) => (
            <Use
              key={`l${i}`}
              href="#sideMotif"
              transform={`translate(${(OUTER_INSET + INNER_INSET) / 2} ${motifTopStart + i * MOTIF_GAP})`}
            />
          ))}

          {/* الزخارف الجانبية - اليمين (معكوسة) */}
          {Array.from({ length: motifCount }, (_, i) => (
            <Use
              key={`r${i}`}
              href="#sideMotif"
              transform={`translate(${w - (OUTER_INSET + INNER_INSET) / 2} ${motifTopStart + i * MOTIF_GAP}) scale(-1 1)`}
            />
          ))}

          {/* الزوايا الأربع */}
          <Use href="#cornerOrnament" transform={`translate(${INNER_INSET} ${INNER_INSET})`} />
          <Use href="#cornerOrnament" transform={`translate(${w - INNER_INSET} ${INNER_INSET}) scale(-1 1)`} />
          <Use href="#cornerOrnament" transform={`translate(${INNER_INSET} ${h - INNER_INSET}) scale(1 -1)`} />
          <Use href="#cornerOrnament" transform={`translate(${w - INNER_INSET} ${h - INNER_INSET}) scale(-1 -1)`} />
        </Svg>
      )}

      {/* ════ طبقة المحتوى (النص القرآني فوق الإطار) ════ */}
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// 🎨 الأنماط
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MUSHAF_BG,
    position: 'relative',
  },
  content: {
    flex: 1,
    // padding مُحسَّب بدقّة: نوفّر مساحة للنص أكبر قدر ممكن مع الحفاظ على
    // مسافة آمنة من الإطار والزخارف الجانبية.
    // عمودي: OUTER_INSET(14) + STRIP_H(16) + 4 = 34
    // أفقي:  OUTER_INSET(14) + sideMotif(12) + 6 = 32
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 20,
    zIndex: 1,
  },
});
