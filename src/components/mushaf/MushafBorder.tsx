/**
 * 📜 إطار صفحة المصحف - Light Beige Theme
 *
 * 4 طبقات من الخارج للداخل:
 *  ١. خط ذهبي خارجي رفيع (1px)
 *  ٢. شريط زخرفي بنقش المعيّن المتكرر (SVG pattern)
 *  ٣. خط ذهبي داخلي رفيع (1px)
 *  ٤. رصائع زاوية معيّنية في التقاطعات
 *
 * الألوان: كريمي دافئ #F5EDD8 + ذهبي #C9A84C
 */
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect, Polygon, Circle } from 'react-native-svg';

// ─────────────────────────────────────────────
// الألوان
// ─────────────────────────────────────────────
const GOLD   = '#C9A84C';
const CREAM  = '#F5EDD8';

// ─────────────────────────────────────────────
// شريط الزخرفة SVG - معيّنات متكررة أفقياً/رأسياً
// ─────────────────────────────────────────────
const STRIP_H = 13; // ارتفاع/عرض الشريط

interface StripProps {
  length: number;       // الطول المطلوب (عرض أو ارتفاع)
  isVertical?: boolean; // رأسي أم أفقي
}

const OrnamentStrip: React.FC<StripProps> = ({ length, isVertical = false }) => {
  const w = isVertical ? STRIP_H : length;
  const h = isVertical ? length : STRIP_H;

  return (
    <Svg width={w} height={h}>
      <Defs>
        {/* نمط المعيّن المتكرر */}
        <Pattern
          id={`ds-${isVertical ? 'v' : 'h'}`}
          x="0" y="0"
          width="14" height={STRIP_H}
          patternUnits="userSpaceOnUse"
          patternTransform={isVertical ? `rotate(90, 7, ${STRIP_H / 2})` : undefined}
        >
          {/* معيّن رئيسي */}
          <Polygon
            points={`7,1 13,${STRIP_H / 2} 7,${STRIP_H - 1} 1,${STRIP_H / 2}`}
            fill={GOLD}
            opacity="0.85"
          />
          {/* نقطة فاصلة بين المعيّنات */}
          <Circle cx="13.5" cy={STRIP_H / 2} r="1" fill={GOLD} opacity="0.5" />
        </Pattern>
      </Defs>

      {/* خلفية الشريط الكريمية */}
      <Rect width={w} height={h} fill={CREAM} />
      {/* نقش المعيّن */}
      <Rect width={w} height={h} fill={`url(#ds-${isVertical ? 'v' : 'h'})`} />
    </Svg>
  );
};

// ─────────────────────────────────────────────
// رصيعة زاوية معيّنية
// ─────────────────────────────────────────────
const CornerDiamond: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20">
    {/* معيّن خارجي ممتلئ */}
    <Polygon points="10,1 19,10 10,19 1,10" fill={GOLD} />
    {/* قلب كريمي */}
    <Polygon points="10,5 15,10 10,15 5,10" fill={CREAM} />
    {/* نواة ذهبية */}
    <Circle cx="10" cy="10" r="2.2" fill={GOLD} />
  </Svg>
);

// ─────────────────────────────────────────────
// الإطار الرئيسي
// ─────────────────────────────────────────────
interface Props {
  children: React.ReactNode;
  /** لا تُستخدم في Light theme - محفوظة للتوافق مع الكود الحالي */
  goldColor?: string;
  goldDeep?: string;
  pageColor?: string;
  ornamentBg?: string;
  /** مساحة علوية بالبكسل تساوي ارتفاع الهيدر العائم */
  topInset?: number;
  /** مساحة سفلية بالبكسل تساوي ارتفاع الفوتر العائم */
  bottomInset?: number;
}

export const MushafBorder: React.FC<Props> = ({ children, topInset = 0, bottomInset = 0 }) => {
  const { width: screenW } = useWindowDimensions();

  // عرض المحتوى الفعلي داخل الماقين الخارجي (6px من كل جانب)
  const innerW = screenW - 12;

  return (
    <View style={styles.root}>

      {/* ══ LAYER 1: الخط الخارجي + الهيكل الداخلي ══ */}
      <View style={styles.outerBorder}>

        {/* LAYER 2 TOP — شريط زخرفي علوي */}
        <OrnamentStrip length={innerW} isVertical={false} />

        {/* الجزء الأوسط: شريط يسار + محتوى + شريط يمين */}
        <View style={styles.middleRow}>

          {/* LAYER 2 LEFT — شريط رأسي يسار */}
          <OrnamentStrip length={1000} isVertical={true} />

          {/* LAYER 3 — الإطار الداخلي + النص */}
          <View style={styles.innerBorder}>
            <View style={[styles.content, { paddingTop: topInset, paddingBottom: bottomInset }]}>
              {children}
            </View>
          </View>

          {/* LAYER 2 RIGHT — شريط رأسي يمين */}
          <OrnamentStrip length={1000} isVertical={true} />

        </View>

        {/* LAYER 2 BOTTOM — شريط زخرفي سفلي */}
        <OrnamentStrip length={innerW} isVertical={false} />

      </View>

      {/* LAYER 4 — رصائع الزوايا الأربع */}
      <View style={[styles.corner, styles.cornerTL]} pointerEvents="none">
        <CornerDiamond size={20} />
      </View>
      <View style={[styles.corner, styles.cornerTR]} pointerEvents="none">
        <CornerDiamond size={20} />
      </View>
      <View style={[styles.corner, styles.cornerBL]} pointerEvents="none">
        <CornerDiamond size={20} />
      </View>
      <View style={[styles.corner, styles.cornerBR]} pointerEvents="none">
        <CornerDiamond size={20} />
      </View>

    </View>
  );
};

// ─────────────────────────────────────────────
// الأنماط
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
    position: 'relative',
    margin: 4,
  },
  outerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: CREAM,
    flexDirection: 'column',
  },
  middleRow: {
    flex: 1,
    flexDirection: 'row',
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: GOLD,
    margin: 2,
    backgroundColor: CREAM,
  },
  content: {
    flex: 1,
  },

  // رصائع الزوايا - موضوعة فوق التقاطعات
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    zIndex: 10,
  },
  cornerTL: { top:  -1, left:  -1 },
  cornerTR: { top:  -1, right: -1 },
  cornerBL: { bottom: -1, left:  -1 },
  cornerBR: { bottom: -1, right: -1 },
});
