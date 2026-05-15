import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { mColors, mText, mSpacing } from '@theme/manuscript';

interface Props {
  icon: React.ReactNode;       // SVG/Feather icon, ذهبي اللون (#C9A84C), size 24
  title: string;
  subtitle?: string;
  onPress?: () => void;
  active?: boolean;            // يُظهر نقطة نبضة خضراء أعلى-يمين
  badge?: string;              // مثل "جديد" - شارة قرمزية
}

/**
 * بطاقة عنصر "رحلتك اليومية" - حاوية أيقونة مربّعة مع عنوان وعنوان فرعي.
 *
 * Strict spec:
 *  - bg: #0F1E18 + border #1C3628 (NEVER white)
 *  - radius 20, padding 20
 *  - Icon container: 48×48 SQUARE rounded 12, bg #162B21, border 1px #2D6A4F
 *  - Inside: SVG icon ذهبي #C9A84C size 24
 *  - Title: Arabic 16px #F0EAD6 bold
 *  - Subtitle: Arabic 12px #A89B7A
 *  - Active dot: top-right, size 6, #52B788 with pulse animation
 *  - "جديد" badge: pill bg #7B1D1D color #F0EAD6 fontSize 10
 */
export const JourneyCard: React.FC<Props> = ({ icon, title, subtitle, onPress, active, badge }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [active, pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { backgroundColor: mColors.bg.overlay, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* حاوية الأيقونة المربّعة */}
      <View style={styles.iconBox}>
        {icon}
      </View>

      {/* العنوان */}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      ) : null}

      {/* نقطة active مع نبضة */}
      {active ? (
        <View style={styles.activeWrap}>
          <Animated.View
            style={[
              styles.activePulse,
              { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
            ]}
          />
          <View style={styles.activeDot} />
        </View>
      ) : null}

      {/* شارة "جديد" */}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const ICON_BOX = 48;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 130,
    backgroundColor: mColors.bg.surface,
    borderWidth: 1,
    borderColor: mColors.bg.overlay,
    borderRadius: mSpacing.cardRadius,
    padding: mSpacing.xl,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: 12,
    backgroundColor: mColors.bg.elevated,
    borderWidth: 1,
    borderColor: mColors.green.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: mText.h3.fontFamily,
    fontSize: 16,
    color: mColors.text.primary,
    fontWeight: '700',
    marginTop: 16,
  },
  subtitle: {
    fontFamily: mText.caption.fontFamily,
    fontSize: 12,
    color: mColors.text.secondary,
    marginTop: 4,
  },
  // نقطة active
  activeWrap: {
    position: 'absolute',
    top: 14,
    end: 14,
    width: 14, height: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  activePulse: {
    position: 'absolute',
    width: 14, height: 14,
    borderRadius: 7,
    backgroundColor: mColors.green.light,
  },
  activeDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: mColors.green.light,
  },
  // شارة "جديد"
  badge: {
    position: 'absolute',
    top: 12,
    end: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: mSpacing.pillRadius,
    backgroundColor: mColors.ruby,
  },
  badgeText: {
    color: mColors.text.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
