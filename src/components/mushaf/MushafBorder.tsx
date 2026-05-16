/**
 * 📜 إطار صفحة المصحف - تصميم Royal Manuscript على غرار مصاحف المخطوطات الأصلية.
 *
 * الطبقات (من الخارج للداخل):
 *  ١. حدود ذهبية سميكة (frame outline)
 *  ٢. فراغ كريمي رفيع
 *  ٣. شريط زخرفي كثيف (4 جوانب) بنقش هندسي إسلامي
 *  ٤. رصائع زاوية (medallion) بمعيّن مزدوج + نقاط
 *  ٥. إطار داخلي مزدوج
 *  ٦. خلفية الصفحة الكريمية
 *
 * النقش الزخرفي مصمّم ليكون كثيفاً ومتراصاً (lacework) مثل مصاحف المدينة.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Defs, Pattern, G } from 'react-native-svg';

interface Props {
  children: React.ReactNode;
  goldColor?: string;
  goldDeep?: string;
  pageColor?: string;
  ornamentBg?: string;
}

export const MushafBorder: React.FC<Props> = ({
  children,
  goldColor   = '#BE995E',
  goldDeep    = '#8B6239',
  pageColor   = '#FFFFFF',
  ornamentBg  = '#FFFFFF',
}) => {
  return (
    <View style={[styles.outer, { backgroundColor: pageColor }]}>
      {/* Outer thin border */}
      <View style={[styles.thickFrame, { borderColor: goldDeep, borderWidth: 1 }]}>
        <View style={[styles.gap, { backgroundColor: pageColor }]}>
          {/* Main ornament band */}
          <View style={[styles.ornamentBand, { backgroundColor: ornamentBg }]}>

            {/* النقش المزخرف الكثيف - الجوانب الأربعة */}
            <DenseOrnament color={goldDeep} accent={goldColor} pageColor={pageColor} />

            {/* رصائع الزوايا الأربع */}
            <CornerMedallion style={styles.cornerTL} color={goldDeep} accent={goldColor} pageColor={pageColor} />
            <CornerMedallion style={styles.cornerTR} color={goldDeep} accent={goldColor} pageColor={pageColor} />
            <CornerMedallion style={styles.cornerBL} color={goldDeep} accent={goldColor} pageColor={pageColor} />
            <CornerMedallion style={styles.cornerBR} color={goldDeep} accent={goldColor} pageColor={pageColor} />

            <View style={[styles.gap, { padding: 3, backgroundColor: pageColor }]}>
              {/* Inner thin frame */}
              <View style={[styles.contentFrame, { borderColor: goldDeep, backgroundColor: pageColor, borderWidth: 1 }]}>
                <View style={styles.content}>
                  {children}
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// ════════ نقش لاسية كثيفة جداً (lacework) ════════

/**
 * نمط أفقي مكثّف جداً - وحدة 8×10 px (نصف الحجم السابق).
 * شبكة ضيقة من النجوم الصغيرة + علامات + متشابكة - زي مصحف المدينة.
 */
const HorizontalLace: React.FC<{ color: string; accent: string; pageColor: string; id: string }> = ({
  color, accent, pageColor, id,
}) => (
  <Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <Defs>
      <Pattern id={id} x="0" y="0" width="8" height="10" patternUnits="userSpaceOnUse">
        <G>
          {/* نجمة 4 بتلات صغيرة في المركز */}
          <Path d="M4 1 L5 4 L4 5 L3 4 Z M4 9 L5 6 L4 5 L3 6 Z" fill={color} />
          {/* علامات + صغيرة */}
          <Path d="M0 5 L3 5 L4 5 L4 4 L4 6 L4 5 L5 5 L8 5" stroke={color} strokeWidth={0.5} fill="none" />
          {/* نقاط الأطراف */}
          <Circle cx="0" cy="5" r="0.6" fill={accent} />
          <Circle cx="8" cy="5" r="0.6" fill={accent} />
          {/* نقاط زاوية صغيرة */}
          <Circle cx="0" cy="0" r="0.3" fill={color} opacity={0.7} />
          <Circle cx="8" cy="0" r="0.3" fill={color} opacity={0.7} />
          <Circle cx="0" cy="10" r="0.3" fill={color} opacity={0.7} />
          <Circle cx="8" cy="10" r="0.3" fill={color} opacity={0.7} />
        </G>
      </Pattern>
    </Defs>
    <Rect x="0" y="0" width="100%" height="0.5" fill={color} opacity={0.9} />
    <Rect width="100%" height="100%" fill={`url(#${id})`} />
    <Rect x="0" y="0" width="100%" height="0.4" fill={color} opacity={0.7} />
  </Svg>
);

const VerticalLace: React.FC<{ color: string; accent: string; pageColor: string; id: string }> = ({
  color, accent, pageColor, id,
}) => (
  <Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <Defs>
      <Pattern id={id} x="0" y="0" width="10" height="8" patternUnits="userSpaceOnUse">
        <G>
          {/* نجمة 4 بتلات صغيرة */}
          <Path d="M1 4 L4 5 L5 4 L4 3 Z M9 4 L6 5 L5 4 L6 3 Z" fill={color} />
          {/* علامات + */}
          <Path d="M5 0 L5 3 L5 4 L4 4 L6 4 L5 4 L5 5 L5 8" stroke={color} strokeWidth={0.5} fill="none" />
          <Circle cx="5" cy="0" r="0.6" fill={accent} />
          <Circle cx="5" cy="8" r="0.6" fill={accent} />
          <Circle cx="0" cy="0" r="0.3" fill={color} opacity={0.7} />
          <Circle cx="10" cy="0" r="0.3" fill={color} opacity={0.7} />
          <Circle cx="0" cy="8" r="0.3" fill={color} opacity={0.7} />
          <Circle cx="10" cy="8" r="0.3" fill={color} opacity={0.7} />
        </G>
      </Pattern>
    </Defs>
    <Rect x="0" y="0" width="0.5" height="100%" fill={color} opacity={0.9} />
    <Rect width="100%" height="100%" fill={`url(#${id})`} />
    <Rect x="0" y="0" width="0.4" height="100%" fill={color} opacity={0.7} />
  </Svg>
);

const DenseOrnament: React.FC<{ color: string; accent: string; pageColor: string }> = ({
  color, accent, pageColor,
}) => (
  <>
    <View style={styles.bandTop} pointerEvents="none">
      <HorizontalLace color={color} accent={accent} pageColor={pageColor} id="ornH1" />
    </View>
    <View style={styles.bandBottom} pointerEvents="none">
      <HorizontalLace color={color} accent={accent} pageColor={pageColor} id="ornH2" />
    </View>
    <View style={styles.bandLeft} pointerEvents="none">
      <VerticalLace color={color} accent={accent} pageColor={pageColor} id="ornV1" />
    </View>
    <View style={styles.bandRight} pointerEvents="none">
      <VerticalLace color={color} accent={accent} pageColor={pageColor} id="ornV2" />
    </View>
  </>
);

// ════════ رصيعة الزاوية ════════

const CornerMedallion: React.FC<{
  style: any; color: string; accent: string; pageColor: string;
}> = ({ style, color, accent, pageColor }) => (
  <View style={[styles.medallion, style]} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 32 32">
      {/* الإطار المربّع */}
      <Rect x="1" y="1" width="30" height="30" fill={pageColor} stroke={color} strokeWidth="0.8" />
      {/* رصيعة معيّن خارجية ممتلئة */}
      <Path d="M 16 3 L 29 16 L 16 29 L 3 16 Z" fill={color} opacity={0.95} />
      {/* معيّن داخلي فاتح */}
      <Path d="M 16 7 L 25 16 L 16 25 L 7 16 Z" fill={pageColor} />
      {/* معيّن داخلي بلون الـ accent */}
      <Path d="M 16 10 L 22 16 L 16 22 L 10 16 Z" fill={accent} />
      {/* نواة معيّن صغيرة */}
      <Path d="M 16 13 L 19 16 L 16 19 L 13 16 Z" fill={color} />
      {/* 4 نقاط على الأطراف */}
      <Circle cx="16" cy="6" r="1.2" fill={color} />
      <Circle cx="26" cy="16" r="1.2" fill={color} />
      <Circle cx="16" cy="26" r="1.2" fill={color} />
      <Circle cx="6" cy="16" r="1.2" fill={color} />
      {/* خطوط قطرية رقيقة */}
      <Path d="M 5 5 L 27 27" stroke={accent} strokeWidth={0.25} opacity={0.5} />
      <Path d="M 27 5 L 5 27" stroke={accent} strokeWidth={0.25} opacity={0.5} />
    </Svg>
  </View>
);

// ════════ الأنماط ════════

const BORDER_GAP   = 2;
const ORNAMENT_W   = 16;
const MEDALLION    = 20;

const styles = StyleSheet.create({
  outer: { flex: 1, paddingHorizontal: 4, paddingVertical: 0 },
  thickFrame: { flex: 1, padding: BORDER_GAP },
  gap: { flex: 1, padding: BORDER_GAP },
  ornamentBand: { flex: 1, padding: ORNAMENT_W, position: 'relative' },

  bandTop:    { position: 'absolute', top: 0,    left: 0, right: 0,  height: ORNAMENT_W },
  bandBottom: { position: 'absolute', bottom: 0, left: 0, right: 0,  height: ORNAMENT_W },
  bandLeft:   { position: 'absolute', top: ORNAMENT_W, bottom: ORNAMENT_W, left: 0,  width: ORNAMENT_W },
  bandRight:  { position: 'absolute', top: ORNAMENT_W, bottom: ORNAMENT_W, right: 0, width: ORNAMENT_W },

  medallion: { position: 'absolute', width: MEDALLION, height: MEDALLION, zIndex: 5 },
  cornerTL: { top: -2, left: -2 },
  cornerTR: { top: -2, right: -2 },
  cornerBL: { bottom: -2, left: -2 },
  cornerBR: { bottom: -2, right: -2 },

  contentFrame: { flex: 1, padding: 0 },
  content: { flex: 1, padding: 0 },
});
