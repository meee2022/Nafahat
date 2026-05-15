/**
 * ترويسة المصحف الكلاسيكي - كارتوش (cartouche) ذهبي مزخرف بنمط مجمع الملك فهد:
 *  ┌────────────────────────────────────────┐
 *  │ [←]  ◆──  الجزء الأول  ──◆  سورة البقرة  ──◆  [≡]
 *  │            ◇  مكية  ·  ٢٨٦ آية  ◇
 *  └────────────────────────────────────────┘
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { ArrowLeft, Menu } from 'lucide-react-native';

interface Props {
  juzLabel: string;
  surahName: string;
  /** نوع السورة + عدد الآيات (مثلاً "مكية · ٢٨٦ آية") - يُعرض كخط سفلي. */
  subInfo?: string;
  onBack?: () => void;
  onMenu?: () => void;
  goldColor?: string;
  goldDeep?: string;
  textColor?: string;
  buttonBg?: string;
  pageColor?: string;
  quranFont: string;
}

export const MushafHeader: React.FC<Props> = ({
  juzLabel,
  surahName,
  subInfo,
  onBack,
  onMenu,
  goldColor = '#A87C3F',
  goldDeep  = '#6F4F22',
  textColor = '#3D2817',
  buttonBg  = '#EFE4C7',
  pageColor = '#FDF8EA',
  quranFont,
}) => {
  return (
    <View style={styles.wrap}>
      {/* الكارتوش الذهبي العلوي */}
      <View style={[styles.cartouche, { borderColor: goldDeep, backgroundColor: pageColor }]}>
        {/* إطار ذهبي رقيق داخلي */}
        <View style={[styles.cartoucheInner, { borderColor: goldColor }]}>

          {/* SVG decorative side ornaments */}
          <SideOrnament side="start" color={goldColor} />
          <SideOrnament side="end"   color={goldColor} />

          <View style={styles.row}>
            <Pressable
              onPress={onBack}
              hitSlop={10}
              accessible
              accessibilityRole="button"
              accessibilityLabel="رجوع"
              style={({ pressed }) => [styles.iconBtn, { backgroundColor: buttonBg, opacity: pressed ? 0.7 : 1 }]}
            >
              <ArrowLeft size={18} color={textColor} strokeWidth={2.2} />
            </Pressable>

            {/* الجزء (على اليمين/البداية) */}
            <View style={styles.leftMeta}>
              <Diamond color={goldColor} />
              <Text
                style={[styles.juzText, { color: textColor, fontFamily: quranFont }]}
                numberOfLines={1}
              >
                {juzLabel}
              </Text>
            </View>

            {/* اسم السورة في المنتصف */}
            <View style={styles.centerBlock}>
              <View style={styles.titleRow}>
                <Diamond color={goldColor} />
                <Text
                  style={[styles.surahName, { color: textColor, fontFamily: quranFont }]}
                  numberOfLines={1}
                >
                  {surahName}
                </Text>
                <Diamond color={goldColor} />
              </View>
              {subInfo ? (
                <Text style={[styles.subInfo, { color: goldDeep, fontFamily: quranFont }]} numberOfLines={1}>
                  {subInfo}
                </Text>
              ) : null}
            </View>

            {/* فراغ لمعادلة العرض */}
            <View style={styles.rightMeta}>
              <Diamond color={goldColor} />
            </View>

            <Pressable
              onPress={onMenu}
              hitSlop={10}
              accessible
              accessibilityRole="button"
              accessibilityLabel="قائمة"
              style={({ pressed }) => [styles.iconBtn, { backgroundColor: buttonBg, opacity: pressed ? 0.7 : 1 }]}
            >
              <Menu size={18} color={textColor} strokeWidth={2.2} />
            </Pressable>
          </View>

        </View>
      </View>
    </View>
  );
};

// ───── معيّن صغير كفاصل بصري ─────
const Diamond: React.FC<{ color: string; size?: number }> = ({ color, size = 6 }) => (
  <View
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      transform: [{ rotate: '45deg' }],
      marginHorizontal: 3,
    }}
  />
);

// ───── زخرفة جانبية SVG (شريط نقش هندسي رقيق) ─────
const SideOrnament: React.FC<{ side: 'start' | 'end'; color: string }> = ({ side, color }) => {
  return (
    <View
      style={[
        styles.sideOrnamentWrap,
        side === 'start' ? { start: 0 } : { end: 0 },
      ]}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%" viewBox="0 0 8 60" preserveAspectRatio="none">
        <Path d="M 4 4 L 4 56" stroke={color} strokeWidth={0.6} opacity={0.6} />
        <Circle cx="4" cy="14" r="1.2" fill={color} />
        <Circle cx="4" cy="30" r="1.6" fill={color} />
        <Circle cx="4" cy="46" r="1.2" fill={color} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginBottom: 6,
  },
  cartouche: {
    borderWidth: 1.5,
    padding: 1.5,
    borderRadius: 2,
  },
  cartoucheInner: {
    borderWidth: 0.6,
    paddingVertical: 6,
    paddingHorizontal: 6,
    position: 'relative',
  },
  sideOrnamentWrap: {
    position: 'absolute',
    top: 4, bottom: 4,
    width: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  rightMeta: {
    flex: 1,
    alignItems: 'center',
  },
  centerBlock: {
    flex: 1.4,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  juzText: {
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 3,
  },
  surahName: {
    fontSize: 17,
    fontWeight: '800',
    marginHorizontal: 3,
    letterSpacing: 0.2,
  },
  subInfo: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 1.5,
    opacity: 0.85,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
});
