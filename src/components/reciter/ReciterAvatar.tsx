/**
 * أفاتار قارئ - تصميم فاخر:
 *  - حلقة خارجية ذهبية مزخرفة
 *  - خلفية دائرية بتدرّج
 *  - الحرف الأول بخط القرآن
 *  - نقطة نبضة خضراء إذا "now playing"
 *  - أيقونة تشغيل عند الـ hover (web) / دائماً عند active
 */
import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';

interface Props {
  /** الحرف أو الحرفان للعرض (اسم القارئ). */
  letter: string;
  size?: number;
  /** لون تدرّج الخلفية - يأخذ accent تلقائياً. */
  accentColor?: string;
  /** يُظهر مؤشر "يُشغّل الآن" أخضر نابض. */
  isPlaying?: boolean;
  /** يُظهر دائرة "popular" ذهبية. */
  isPopular?: boolean;
}

export const ReciterAvatar: React.FC<Props> = ({
  letter,
  size = 84,
  accentColor,
  isPlaying = false,
  isPopular = false,
}) => {
  const t = useTheme();
  const color = accentColor ?? t.colors.primary;

  // نبضة الـ playing dot
  const pulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!isPlaying) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [isPlaying, pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* الحلقة الخارجية المزخرفة + التدرّج */}
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`av-${letter}-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {/* الحلقة الذهبية الخارجية (للـ popular فقط بـ stroke ذهبي عريض) */}
        {isPopular && (
          <>
            <Circle cx="50" cy="50" r="48" fill="none" stroke={t.colors.accent} strokeWidth="1.5" strokeOpacity="0.85" />
            {/* 8 رصائع صغيرة على الحلقة */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + 48 * Math.cos(rad);
              const cy = 50 + 48 * Math.sin(rad);
              return <Circle key={angle} cx={cx} cy={cy} r="1.4" fill={t.colors.accent} />;
            })}
          </>
        )}

        {/* الدائرة الداخلية بالتدرّج */}
        <Circle cx="50" cy="50" r={isPopular ? 42 : 46} fill={`url(#av-${letter}-${color.replace('#', '')})`} />
        {/* highlight ناعم في الأعلى-اليسار */}
        <Circle cx="38" cy="38" r="14" fill="#fff" opacity={0.18} />
      </Svg>

      {/* الحرف */}
      <Text
        style={{
          fontFamily: t.fontFamilies.arabicQuran,
          fontSize: size * 0.42,
          fontWeight: '700',
          color: '#fff',
          letterSpacing: -0.5,
        }}
      >
        {letter}
      </Text>

      {/* مؤشر "يُشغّل الآن" نابض */}
      {isPlaying ? (
        <View style={[styles.playingWrap, { top: size * 0.06, end: size * 0.06 }]}>
          <Animated.View
            style={[
              styles.playingPulse,
              { backgroundColor: '#22C55E', transform: [{ scale: pulseScale }], opacity: pulseOpacity },
            ]}
          />
          <View style={[styles.playingDot, { backgroundColor: '#22C55E', borderColor: t.colors.surface }]} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  playingWrap: {
    position: 'absolute',
    width: 14, height: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  playingPulse: {
    position: 'absolute',
    width: 14, height: 14,
    borderRadius: 7,
  },
  playingDot: {
    width: 10, height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
