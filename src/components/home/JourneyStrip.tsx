import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { Award, BookOpen, Flame, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { arabicNumber } from '@data/surahs';

interface Props {
  streakDays: number;
  pagesRead: number;
  totalPages?: number;
  versesMemorized: number;
  unlockedAchievements: number;
  totalAchievements: number;
  onPressJourney?: () => void;
  onPressKhatma?: () => void;
  onPressAchievements?: () => void;
}

/**
 * شريط "رحلتي مع القرآن" - 3 بطاقات متلاصقة:
 * 1. السلسلة (streak) - بألوان دافئة
 * 2. الختمة - بشريط تقدّم
 * 3. الإنجازات - عداد المفتوحة
 */
export const JourneyStrip: React.FC<Props> = ({
  streakDays, pagesRead, totalPages = 604,
  versesMemorized, unlockedAchievements, totalAchievements,
  onPressJourney, onPressKhatma, onPressAchievements,
}) => {
  const t = useTheme();
  const khatmaPct = Math.min(1, pagesRead / totalPages);

  return (
    <View style={styles.wrap}>
      {/* بطاقة كبيرة على اليمين - السلسلة */}
      <Pressable
        onPress={onPressJourney}
        style={({ pressed }) => [{ flex: 1.4, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      >
        <LinearGradient
          colors={['#E0743D', '#B5563C', '#823821']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.streakCard]}
        >
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
            <Circle cx="80%" cy="20%" r="32" fill="rgba(255,255,255,0.06)" />
            <Circle cx="90%" cy="90%" r="48" fill="rgba(255,255,255,0.04)" />
          </Svg>
          <View style={styles.streakIcon}>
            <Flame size={20} color="#FBF7EA" strokeWidth={1.6} fill="#FBF7EA" />
          </View>
          <Text style={[styles.eyebrow, { color: 'rgba(251, 247, 234, 0.7)' }]}>سلسلة الأيام</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={[styles.bigNum, { color: '#FBF7EA' }]}>{arabicNumber(streakDays)}</Text>
            <Text style={{ fontSize: 14, color: 'rgba(251, 247, 234, 0.7)' }}>يوم</Text>
          </View>
          <Text variant="caption" color="rgba(251, 247, 234, 0.65)" style={{ marginTop: 8 }}>
            {streakDays > 0 ? 'حافظ على الاستمرار!' : 'ابدأ اليوم لإشعال السلسلة'}
          </Text>
        </LinearGradient>
      </Pressable>

      {/* بطاقتان عموديتان على اليسار */}
      <View style={{ flex: 1, gap: 8 }}>
        {/* الختمة */}
        <Pressable onPress={onPressKhatma} style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
          <View style={[styles.miniCard, { backgroundColor: t.colors.primary, borderColor: t.colors.accent }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <BookOpen size={14} color={t.colors.accent} />
              <Text style={[styles.miniEyebrow, { color: t.colors.accent }]}>الختمة</Text>
            </View>
            <Text style={[styles.miniBigNum, { color: '#FBF7EA' }]}>
              {Math.round(khatmaPct * 100)}<Text style={{ fontSize: 14, color: 'rgba(251, 247, 234, 0.7)' }}>٪</Text>
            </Text>
            <View style={[styles.miniProgress, { backgroundColor: 'rgba(212, 181, 112, 0.2)' }]}>
              <View style={{ width: `${khatmaPct * 100}%`, height: '100%', backgroundColor: '#D4B570' }} />
            </View>
          </View>
        </Pressable>

        {/* الإنجازات */}
        <Pressable onPress={onPressAchievements} style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
          <View style={[styles.miniCard, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Award size={14} color={t.colors.accent} />
              <Text style={[styles.miniEyebrow, { color: t.colors.accent }]}>الإنجازات</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
              <Text style={[styles.miniBigNum, { color: t.colors.textPrimary }]}>
                {arabicNumber(unlockedAchievements)}
              </Text>
              <Text style={{ fontSize: 14, color: t.colors.textTertiary }}>
                / {arabicNumber(totalAchievements)}
              </Text>
            </View>
            <Text variant="caption" color={t.colors.textTertiary} style={{ letterSpacing: 0.5 }}>
              شارة مفتوحة
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 168,
  },
  streakCard: {
    flex: 1,
    padding: 16,
    borderRadius: 4,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  streakIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 'auto',
  },
  eyebrow: {
    fontSize: 10, letterSpacing: 2, fontWeight: '700',
    marginBottom: 2, marginTop: 12,
  },
  bigNum: { fontSize: 38, fontWeight: '300', lineHeight: 44, letterSpacing: -1 },

  miniCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'space-between',
  },
  miniEyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  miniBigNum: { fontSize: 22, fontWeight: '700', lineHeight: 26, letterSpacing: -0.5 },
  miniProgress: { height: 3, borderRadius: 0, overflow: 'hidden' },
});
