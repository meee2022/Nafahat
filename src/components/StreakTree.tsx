/**
 * شجرة الاستمرار (Streak Tree) - رسم SVG ينمو مع عدد الأيام المتتالية.
 *
 * مراحل النمو:
 *   0 أيام  - بذرة
 *   1-3    - برعم
 *   4-7    - شجيرة صغيرة
 *   8-14   - شجرة متوسطة
 *   15-30  - شجرة كاملة بأوراق
 *   31-60  - شجرة باسقة بأزهار
 *   61+    - بستان (شجرة + ضوء)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { arabicNumber } from '@data/surahs';

interface Props {
  streakDays: number;
  size?: number;
}

export const StreakTree: React.FC<Props> = ({ streakDays, size = 200 }) => {
  const t = useTheme();
  const stage = getStage(streakDays);

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size * 1.1} viewBox="0 0 200 220">
        <Defs>
          <LinearGradient id="sky" x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%"  stopColor={t.colors.primary + '12'} />
            <Stop offset="100%" stopColor={t.colors.background} />
          </LinearGradient>
          <LinearGradient id="ground" x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%"  stopColor="#8B5E3C" />
            <Stop offset="100%" stopColor="#5C4012" />
          </LinearGradient>
          <LinearGradient id="leaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"  stopColor="#10B981" />
            <Stop offset="100%" stopColor="#047857" />
          </LinearGradient>
          <LinearGradient id="leafGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"  stopColor="#FBB040" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>
        </Defs>

        {/* السماء */}
        <Path d="M 0 0 L 200 0 L 200 180 L 0 180 Z" fill="url(#sky)" />

        {/* الأرض */}
        <Ellipse cx="100" cy="195" rx="90" ry="20" fill="url(#ground)" />
        <Ellipse cx="100" cy="190" rx="78" ry="14" fill="#5C4012" opacity={0.6} />

        {/* مراحل النمو */}
        {stage >= 1 && <Seed />}
        {stage >= 2 && <Sprout />}
        {stage >= 3 && <SmallTree palette={t.colors} />}
        {stage >= 4 && <MediumTree palette={t.colors} />}
        {stage >= 5 && <FullTree palette={t.colors} />}
        {stage >= 6 && <FlourishingTree palette={t.colors} />}
        {stage >= 7 && <GardenAura />}

        {/* العدد الكبير في الوسط (للمراحل المتأخرة) */}
        {streakDays > 0 ? (
          <G transform="translate(100, 180)">
            <Circle r="22" fill={t.colors.surface} stroke={t.colors.accent} strokeWidth="1.5" />
            <Circle r="22" fill="none" stroke={t.colors.accent} strokeWidth="0.5" opacity={0.5} />
          </G>
        ) : null}
      </Svg>

      {streakDays > 0 ? (
        <View style={[styles.dayBadge, { backgroundColor: t.colors.surface, borderColor: t.colors.accent }]}>
          <Text style={[styles.dayValue, { color: t.colors.accentDeep }]}>{arabicNumber(streakDays)}</Text>
          <Text style={[styles.dayLabel, { color: t.colors.textSecondary }]}>يوم متتالي</Text>
        </View>
      ) : (
        <View style={styles.startWrap}>
          <Text style={[styles.startText, { color: t.colors.textPrimary }]}>ابدأ سلسلتك اليوم</Text>
          <Text style={[styles.startSub, { color: t.colors.textTertiary }]}>كل يوم خطوة للأعلى</Text>
        </View>
      )}
    </View>
  );
};

function getStage(days: number): number {
  if (days === 0)    return 0;
  if (days <= 3)     return 2;
  if (days <= 7)     return 3;
  if (days <= 14)    return 4;
  if (days <= 30)    return 5;
  if (days <= 60)    return 6;
  return 7;
}

// ─────────────── مراحل SVG ───────────────

const Seed: React.FC = () => (
  <G>
    <Circle cx="100" cy="180" r="4" fill="#5C4012" />
    <Circle cx="100" cy="178" r="2" fill="#FBB040" />
  </G>
);

const Sprout: React.FC = () => (
  <G>
    <Path d="M 100 180 Q 100 170 100 160" stroke="#10B981" strokeWidth="2" />
    <Path d="M 100 168 Q 94 164 90 162" stroke="#10B981" strokeWidth="1.5" fill="none" />
    <Path d="M 100 168 Q 106 164 110 162" stroke="#10B981" strokeWidth="1.5" fill="none" />
    <Ellipse cx="90" cy="161" rx="4" ry="2.5" fill="url(#leaf)" transform="rotate(-30 90 161)" />
    <Ellipse cx="110" cy="161" rx="4" ry="2.5" fill="url(#leaf)" transform="rotate(30 110 161)" />
  </G>
);

const SmallTree: React.FC<{ palette: any }> = () => (
  <G>
    {/* الجذع */}
    <Path d="M 96 180 L 96 130 L 104 130 L 104 180 Z" fill="#5C4012" />
    {/* تاج صغير */}
    <Ellipse cx="100" cy="124" rx="22" ry="18" fill="url(#leaf)" />
    <Ellipse cx="90" cy="120" rx="10" ry="8" fill="#34D399" />
    <Ellipse cx="110" cy="120" rx="10" ry="8" fill="#34D399" />
  </G>
);

const MediumTree: React.FC<{ palette: any }> = () => (
  <G>
    <Path d="M 95 180 L 95 105 L 105 105 L 105 180 Z" fill="#5C4012" />
    {/* فروع */}
    <Path d="M 100 130 Q 80 122 70 115" stroke="#5C4012" strokeWidth="3" fill="none" />
    <Path d="M 100 130 Q 120 122 130 115" stroke="#5C4012" strokeWidth="3" fill="none" />
    {/* تاج */}
    <Ellipse cx="100" cy="100" rx="32" ry="26" fill="url(#leaf)" />
    <Ellipse cx="70"  cy="112" rx="12" ry="10" fill="url(#leaf)" />
    <Ellipse cx="130" cy="112" rx="12" ry="10" fill="url(#leaf)" />
  </G>
);

const FullTree: React.FC<{ palette: any }> = () => (
  <G>
    <Path d="M 94 180 L 92 80 L 108 80 L 106 180 Z" fill="#5C4012" />
    {/* فروع */}
    <Path d="M 100 105 Q 70 95 55 85" stroke="#5C4012" strokeWidth="3.5" fill="none" />
    <Path d="M 100 105 Q 130 95 145 85" stroke="#5C4012" strokeWidth="3.5" fill="none" />
    <Path d="M 100 80 Q 75 65 60 55" stroke="#5C4012" strokeWidth="2.5" fill="none" />
    <Path d="M 100 80 Q 125 65 140 55" stroke="#5C4012" strokeWidth="2.5" fill="none" />
    {/* تاج كثيف */}
    <Ellipse cx="100" cy="78" rx="42" ry="35" fill="url(#leaf)" />
    <Ellipse cx="65"  cy="82" rx="16" ry="14" fill="url(#leaf)" />
    <Ellipse cx="135" cy="82" rx="16" ry="14" fill="url(#leaf)" />
    <Ellipse cx="60"  cy="50" rx="12" ry="10" fill="#34D399" />
    <Ellipse cx="140" cy="50" rx="12" ry="10" fill="#34D399" />
  </G>
);

const FlourishingTree: React.FC<{ palette: any }> = () => (
  <G>
    {/* أزهار/ثمار ذهبية */}
    <Circle cx="80"  cy="75" r="3" fill="url(#leafGold)" />
    <Circle cx="120" cy="80" r="3" fill="url(#leafGold)" />
    <Circle cx="100" cy="60" r="3.5" fill="url(#leafGold)" />
    <Circle cx="65"  cy="60" r="2.5" fill="url(#leafGold)" />
    <Circle cx="135" cy="65" r="2.5" fill="url(#leafGold)" />
    <Circle cx="100" cy="90" r="2.5" fill="url(#leafGold)" />
  </G>
);

const GardenAura: React.FC = () => (
  <G>
    {/* هالة ذهبية حول الشجرة */}
    <Circle cx="100" cy="80" r="68" fill="none" stroke="#FBB040" strokeWidth="0.5" opacity={0.4} />
    <Circle cx="100" cy="80" r="78" fill="none" stroke="#FBB040" strokeWidth="0.3" opacity={0.25} />
    {/* نجمات */}
    <Path d="M 30 30 L 32 35 L 37 36 L 32 38 L 30 43 L 28 38 L 23 36 L 28 35 Z" fill="#FBB040" opacity={0.7} />
    <Path d="M 170 40 L 172 44 L 176 45 L 172 47 L 170 51 L 168 47 L 164 45 L 168 44 Z" fill="#FBB040" opacity={0.7} />
    <Path d="M 160 100 L 162 104 L 166 105 L 162 107 L 160 111 L 158 107 L 154 105 L 158 104 Z" fill="#FBB040" opacity={0.6} />
  </G>
);

const styles = StyleSheet.create({
  dayBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  dayValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  dayLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginTop: 2 },

  startWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  startText: {
    fontSize: 16, fontWeight: '800',
  },
  startSub: {
    fontSize: 12, marginTop: 4,
  },
});
