import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { mColors, mText, mSpacing, mShadows } from '@theme/manuscript';
import { StatBadge } from './StatBadge';
import { IslamicArch, OrnamentLine } from './GeometricPattern';

interface Props {
  surahName: string;
  ayahNumber?: number;
  page?: number;
  khatmaPercent?: number;
  onContinue?: () => void;
  hasLastRead?: boolean;
}

/**
 * بطاقة "آخر قراءة" - البطل التحريري في الـ HomeScreen.
 *
 * عناصر:
 *  - تدرّج خلفي #162B21 → #0F1E18
 *  - قوس إسلامي ذهبي مزخرف أعلى البطاقة
 *  - إطار ذهبي بنقش هندسي على الحواف
 *  - اسم السورة بخط Naskh Bold 34px ذهبي
 *  - 3 إحصائيات مفصولة بنقاط ذهبية
 *  - زر CTA pill بحدّ ذهبي + خلفية glass
 *
 * تأثيرات:
 *  - shimmer ذهبي يجري على الحدود (3s loop)
 *  - floating خفيف ±4px على المحور Y (4s loop)
 */
export const HeroReadingCard: React.FC<Props> = ({
  surahName,
  ayahNumber,
  page,
  khatmaPercent = 0,
  onContinue,
  hasLastRead = true,
}) => {
  const floatY = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -4, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 4, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    // shimmer
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [floatY, shimmer]);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <Animated.View style={[styles.outer, { transform: [{ translateY: floatY }] }]}>
      {/* البطاقة View (مش Pressable) - CTA الزرّ الداخلي هو الـ Pressable الوحيد */}
      <View>
        <LinearGradient
          colors={[mColors.bg.elevated, mColors.bg.surface]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.card}
        >
          {/* القوس الإسلامي - زخرفة في الأعلى */}
          <View style={styles.archWrap} pointerEvents="none">
            <IslamicArch width={160} color={mColors.gold.primary} opacity={0.85} />
          </View>

          {/* إطار ذهبي رقيق على الحواف */}
          <View style={styles.frameOuter} />
          <View style={styles.frameInner} />

          {/* shimmer ذهبي يجري على البطاقة */}
          <View style={styles.shimmerMask} pointerEvents="none">
            <Animated.View style={[styles.shimmerBand, { transform: [{ translateX: shimmerTranslate }] }]}>
              <LinearGradient
                colors={['transparent', 'rgba(232,201,106,0.18)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          {/* المحتوى */}
          <View style={styles.content}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={[mText.eyebrow, styles.eyebrowText]}>
                {hasLastRead ? '◇  آخر قراءة  ◇' : '◇  ابدأ رحلتك  ◇'}
              </Text>
              <View style={styles.eyebrowDot} />
            </View>

            {/* اسم السورة */}
            <Text style={[styles.surahName]} numberOfLines={1}>
              {surahName}
            </Text>

            {/* خط زخرفي */}
            <View style={{ marginTop: 8, marginBottom: 12 }}>
              <OrnamentLine width={100} color={mColors.gold.primary} />
            </View>

            {/* الإحصائيات */}
            <StatBadge
              items={[
                { value: ayahNumber ? String(ayahNumber).padStart(0, '٠') : '٠', label: 'آية' },
                { value: page ? String(page) : '١', label: 'صفحة' },
                { value: `${Math.round(khatmaPercent * 100)}٪`, label: 'من الختمة' },
              ]}
            />

            {/* CTA pill بحد ذهبي + خلفية glass */}
            <Pressable
              onPress={onContinue}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[mText.button, styles.ctaText]}>
                {hasLastRead ? 'تابع القراءة  ←' : 'افتح المصحف  ←'}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outer: {
    ...mShadows.hero,
  },
  card: {
    minHeight: 240,
    borderRadius: mSpacing.cardRadius,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 24,
    backgroundColor: mColors.bg.elevated, // fallback in case gradient fails
  },
  archWrap: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  frameOuter: {
    position: 'absolute',
    top: 10, left: 10, right: 10, bottom: 10,
    borderWidth: 1,
    borderColor: mColors.gold.primary,
    opacity: 0.32,
    borderRadius: mSpacing.cardRadius - 6,
  },
  frameInner: {
    position: 'absolute',
    top: 16, left: 16, right: 16, bottom: 16,
    borderWidth: 0.5,
    borderColor: mColors.gold.primary,
    opacity: 0.18,
    borderRadius: mSpacing.cardRadius - 12,
  },
  shimmerMask: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: mSpacing.cardRadius,
  },
  shimmerBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 160,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowDot: {
    width: 4, height: 4,
    backgroundColor: mColors.gold.primary,
    transform: [{ rotate: '45deg' }],
  },
  eyebrowText: {
    color: mColors.gold.primary,
  },
  surahName: {
    fontFamily: mText.h1.fontFamily,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    color: mColors.gold.light,
    letterSpacing: -0.5,
    marginTop: 8,
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: mSpacing.pillRadius,
    borderWidth: 1.5,
    borderColor: mColors.gold.primary,
    backgroundColor: 'rgba(201,168,76,0.12)',
  },
  ctaText: {
    color: mColors.gold.light,
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
