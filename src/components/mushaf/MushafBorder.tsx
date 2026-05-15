/**
 * إطار صفحات المصحف - تصميم لاسية مزخرفة كثيفة (Dense Manuscript Lacework).
 * مستوحى من إطار مصاحف المخطوطات الكلاسيكية ومجمع الملك فهد.
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
  goldColor   = '#A87C3F',
  goldDeep    = '#6F4F22',
  pageColor   = '#FDF8EA',
  ornamentBg  = '#F4EACE',
}) => {
  return (
    <View style={[styles.outer, { backgroundColor: pageColor }]}>
      <View style={[styles.thickFrame, { borderColor: goldDeep }]}>
        <View style={[styles.gap, { backgroundColor: pageColor }]}>
          <View style={[styles.thinFrame, { borderColor: goldColor }]}>
            <View style={[styles.ornamentBand, { backgroundColor: ornamentBg }]}>

              {/* نقش لاسية كثيفة على الجوانب الأربعة */}
              <DenseLacework color={goldDeep} accent={goldColor} pageColor={pageColor} />

              {/* رصائع الزوايا الأربع */}
              <CornerMedallion style={styles.cornerTL} color={goldDeep} accent={goldColor} pageColor={pageColor} />
              <CornerMedallion style={styles.cornerTR} color={goldDeep} accent={goldColor} pageColor={pageColor} />
              <CornerMedallion style={styles.cornerBL} color={goldDeep} accent={goldColor} pageColor={pageColor} />
              <CornerMedallion style={styles.cornerBR} color={goldDeep} accent={goldColor} pageColor={pageColor} />

              {/* إطار رفيع داخلي حول النص */}
              <View style={[styles.contentFrame, { borderColor: goldColor, backgroundColor: pageColor }]}>
                <View style={[styles.contentFrameInner, { borderColor: goldColor }]}>
                  <View style={styles.content}>
                    {children}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─────────── نقش لاسية كثيفة ───────────

const HorizontalLace: React.FC<{ color: string; accent: string; pageColor: string; id: string }> = ({ color, accent, pageColor, id }) => (
  <Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <Defs>
      <Pattern id={id} x="0" y="0" width="14" height="20" patternUnits="userSpaceOnUse">
        <G>
          {/* معيّن مركزي صغير */}
          <Path d="M7 5 L10 10 L7 15 L4 10 Z" fill={color} />
          {/* نواة فاتحة */}
          <Path d="M7 7.5 L8.5 10 L7 12.5 L5.5 10 Z" fill={pageColor} />
          {/* نقاط زخرفية بين المعيّنات */}
          <Circle cx="0" cy="10" r="1" fill={accent} />
          <Circle cx="14" cy="10" r="1" fill={accent} />
          {/* خطوط رابطة رفيعة - مرسومة بـ Path */}
          <Path d="M0 10 L4 10" stroke={color} strokeWidth={0.4} />
          <Path d="M10 10 L14 10" stroke={color} strokeWidth={0.4} />
          {/* أوراق صغيرة فوق وتحت */}
          <Path d="M7 0 L8.2 2 L7 5 L5.8 2 Z" fill={accent} opacity={0.9} />
          <Path d="M7 20 L8.2 18 L7 15 L5.8 18 Z" fill={accent} opacity={0.9} />
          {/* نقاط صغيرة جداً للكثافة */}
          <Circle cx="0" cy="3" r="0.5" fill={color} opacity={0.7} />
          <Circle cx="14" cy="3" r="0.5" fill={color} opacity={0.7} />
          <Circle cx="0" cy="17" r="0.5" fill={color} opacity={0.7} />
          <Circle cx="14" cy="17" r="0.5" fill={color} opacity={0.7} />
        </G>
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill={`url(#${id})`} />
  </Svg>
);

const VerticalLace: React.FC<{ color: string; accent: string; pageColor: string; id: string }> = ({ color, accent, pageColor, id }) => (
  <Svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <Defs>
      <Pattern id={id} x="0" y="0" width="20" height="14" patternUnits="userSpaceOnUse">
        <G>
          {/* معيّن مركزي صغير */}
          <Path d="M5 7 L10 10 L15 7 L10 4 Z" fill={color} />
          {/* نواة فاتحة */}
          <Path d="M7.5 7 L10 8.5 L12.5 7 L10 5.5 Z" fill={pageColor} />
          {/* نقاط زخرفية أعلى وأسفل */}
          <Circle cx="10" cy="0" r="1" fill={accent} />
          <Circle cx="10" cy="14" r="1" fill={accent} />
          {/* خطوط رابطة عمودية - مرسومة بـ Path */}
          <Path d="M10 0 L10 4" stroke={color} strokeWidth={0.4} />
          <Path d="M10 10 L10 14" stroke={color} strokeWidth={0.4} />
          {/* أوراق جانبية */}
          <Path d="M0 7 L2 8.2 L5 7 L2 5.8 Z" fill={accent} opacity={0.9} />
          <Path d="M20 7 L18 8.2 L15 7 L18 5.8 Z" fill={accent} opacity={0.9} />
          {/* نقاط صغيرة للكثافة */}
          <Circle cx="3" cy="0" r="0.5" fill={color} opacity={0.7} />
          <Circle cx="17" cy="0" r="0.5" fill={color} opacity={0.7} />
          <Circle cx="3" cy="14" r="0.5" fill={color} opacity={0.7} />
          <Circle cx="17" cy="14" r="0.5" fill={color} opacity={0.7} />
        </G>
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill={`url(#${id})`} />
  </Svg>
);

const DenseLacework: React.FC<{ color: string; accent: string; pageColor: string }> = ({ color, accent, pageColor }) => {
  return (
    <>
      <View style={styles.bandTop} pointerEvents="none">
        <HorizontalLace color={color} accent={accent} pageColor={pageColor} id="dlH1" />
      </View>
      <View style={styles.bandBottom} pointerEvents="none">
        <HorizontalLace color={color} accent={accent} pageColor={pageColor} id="dlH2" />
      </View>
      <View style={styles.bandRight} pointerEvents="none">
        <VerticalLace color={color} accent={accent} pageColor={pageColor} id="dlV1" />
      </View>
      <View style={styles.bandLeft} pointerEvents="none">
        <VerticalLace color={color} accent={accent} pageColor={pageColor} id="dlV2" />
      </View>
    </>
  );
};

// ─────────── رصيعة الزاوية ───────────

const CornerMedallion: React.FC<{ style: any; color: string; accent: string; pageColor: string }> = ({ style, color, accent, pageColor }) => {
  return (
    <View style={[styles.medallion, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 32 32">
        <Rect x="1" y="1" width="30" height="30" fill={pageColor} stroke={color} strokeWidth="0.8" />
        <Path d="M 16 3 L 29 16 L 16 29 L 3 16 Z" fill={color} opacity={0.95} />
        <Path d="M 16 7 L 25 16 L 16 25 L 7 16 Z" fill={pageColor} opacity={0.95} />
        <Path d="M 16 10 L 22 16 L 16 22 L 10 16 Z" fill={accent} opacity={0.9} />
        <Path d="M 16 13 L 19 16 L 16 19 L 13 16 Z" fill={color} />
        <Circle cx="16" cy="6" r="1.1" fill={color} />
        <Circle cx="26" cy="16" r="1.1" fill={color} />
        <Circle cx="16" cy="26" r="1.1" fill={color} />
        <Circle cx="6" cy="16" r="1.1" fill={color} />
      </Svg>
    </View>
  );
};

// ─────────── الأنماط ───────────

const BORDER_THICK = 3;
const BORDER_GAP   = 3;
const BORDER_THIN  = 1;
const ORNAMENT_W   = 22;
const MEDALLION    = 28;

const styles = StyleSheet.create({
  outer: { flex: 1, padding: 6 },
  thickFrame: { flex: 1, borderWidth: BORDER_THICK, padding: BORDER_GAP },
  gap: { flex: 1, padding: BORDER_GAP },
  thinFrame: { flex: 1, borderWidth: BORDER_THIN },
  ornamentBand: { flex: 1, padding: ORNAMENT_W, position: 'relative' },

  bandTop:    { position: 'absolute', top: 0,    left: 0, right: 0,  height: ORNAMENT_W },
  bandBottom: { position: 'absolute', bottom: 0, left: 0, right: 0,  height: ORNAMENT_W },
  bandLeft:   { position: 'absolute', top: ORNAMENT_W, bottom: ORNAMENT_W, left: 0,  width: ORNAMENT_W },
  bandRight:  { position: 'absolute', top: ORNAMENT_W, bottom: ORNAMENT_W, right: 0, width: ORNAMENT_W },

  medallion: { position: 'absolute', width: MEDALLION, height: MEDALLION, zIndex: 5 },
  cornerTL: { top: -3, left: -3 },
  cornerTR: { top: -3, right: -3 },
  cornerBL: { bottom: -3, left: -3 },
  cornerBR: { bottom: -3, right: -3 },

  contentFrame: { flex: 1, borderWidth: BORDER_THIN, padding: 2 },
  contentFrameInner: { flex: 1, borderWidth: 0.5 },
  content: { flex: 1, padding: 4 },
});
