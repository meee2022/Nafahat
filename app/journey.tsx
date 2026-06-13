/**
 * شاشة "رحلتي مع القرآن" - لوحة شاملة لتقدّم المستخدم:
 * - الإحصائيات الكبرى
 * - الختمات
 * - الإنجازات
 * - الرسم الأسبوعي
 */
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Flame, BookOpen, Brain, Headphones, Heart, Calendar, Award, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useStatsStore } from '@store/index';
import { computeAchievements } from '@data/achievements';
import { arabicNumber } from '@data/surahs';
import { WeeklyChart } from '@components/common';
import { useT } from '@store/languageStore';
import { StreakTree } from '@components/StreakTree';
import { TOP_BAR_PAD } from '@utils/safeArea';

export default function JourneyScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const stats = useStatsStore((s) => s.stats);
  const achievements = computeAchievements(stats);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('home.yourProgress')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('journey.title')}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 18 }}>
        {/* بطاقة السلسلة الكبيرة - مع شجرة الاستمرار 🌳 */}
        <View style={[styles.heroCard, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold, borderWidth: 1, borderRadius: 16, alignItems: 'center' }]}>
          <Text style={[styles.heroEyebrow, { color: t.colors.accent }]}>{tr('journey.streakSubtitle')}</Text>
          <StreakTree streakDays={stats.streakDays} size={210} />
          <View style={{ marginTop: 4 }}>
            <OrnamentalRule width={140} color={t.colors.accent} variant="simple" />
          </View>
          <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
            {stats.streakDays > 0 ? tr('journey.streakKeepGoing') : tr('journey.streakStart')}
          </Text>
        </View>

        {/* الإحصائيات الكبرى */}
        <View style={[styles.statsGrid, { gap: 8, marginTop: 14 }]}>
          <StatBox icon={<BookOpen size={18} />} label={tr('journey.pagesRead')}  value={arabicNumber(stats.pagesRead)}       color={t.colors.primary}   />
          <StatBox icon={<Brain size={18} />}    label={tr('journey.versesMemorized')}    value={arabicNumber(stats.versesMemorized)} color="#A2384B"          />
        </View>
        <View style={[styles.statsGrid, { gap: 8, marginTop: 8 }]}>
          <StatBox icon={<Headphones size={18} />} label={tr('journey.listenMinutes')} value={arabicNumber(stats.listenedMinutes)} color="#2F5A8C"        />
          <StatBox icon={<Heart size={18} />}      label={tr('journey.tasbeehs')}      value={arabicNumber(stats.tasbeehCount)}    color={t.colors.accent} />
        </View>

        {/* النشاط الأسبوعي */}
        <Card padding={18} elevation="xs" bordered style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} color={t.colors.accent} />
              <Text variant="subtitle">{tr('journey.weeklyActivity')}</Text>
            </View>
            <Text variant="caption" color={t.colors.textTertiary}>{tr('journey.minutesUnit')}</Text>
          </View>

          <View style={{ marginTop: 14 }}>
            <WeeklyChart data={stats.weeklyMinutes} unit={tr('common.minute')} height={180} />
          </View>
        </Card>

        {/* الإنجازات */}
        <Pressable onPress={() => router.push('/achievements')}>
          <Card padding={18} elevation="xs" bordered background={t.colors.accent + '08'} style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={[styles.achIcon, { backgroundColor: t.colors.accent }]}>
                <Award size={22} color={t.colors.surface} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('journey.achievements')}</Text>
                <Text variant="h3" style={{ marginTop: 2 }}>
                  {arabicNumber(unlocked)} {tr('journey.badgesFrom')} {arabicNumber(achievements.length)} {tr('journey.badgesSuffix')}
                </Text>
                <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>
                  {tr('journey.keepGoing')}
                </Text>
              </View>
              <TrendingUp size={20} color={t.colors.accent} />
            </View>
          </Card>
        </Pressable>

        {/* رابط الختمة */}
        <Pressable onPress={() => router.push('/khatma')}>
          <Card padding={18} elevation="xs" bordered style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={[styles.achIcon, { backgroundColor: t.colors.primary }]}>
                <BookOpen size={22} color={t.colors.surface} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: t.colors.primary }]}>{tr('journey.khatma')}</Text>
                <Text variant="h3" style={{ marginTop: 2 }}>
                  {Math.round(Math.min(1, stats.pagesRead / 604) * 100)}٪ {tr('journey.quranPercent')}
                </Text>
                <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>
                  {arabicNumber(stats.pagesRead)} / {arabicNumber(604)} {tr('common.page')}
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>
      </Screen>
    </View>
  );
}

const StatBox: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => {
  const t = useTheme();
  return (
    <View style={{ flex: 1, padding: 14, borderWidth: 1, borderColor: t.colors.borderGold, backgroundColor: t.colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" color={t.colors.textTertiary} style={{ letterSpacing: 1, fontWeight: '700' }}>{label}</Text>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color + '14', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(icon as any, { color })}
        </View>
      </View>
      <Text style={{ fontSize: 28, fontWeight: '300', color: t.colors.textPrimary, marginTop: 6, letterSpacing: -0.5 }}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: TOP_BAR_PAD, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  heroCard: { padding: 22, overflow: 'hidden' },
  heroIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroEyebrow: { fontSize: 11, letterSpacing: 3, fontWeight: '700', marginBottom: 4 },
  heroBig: { fontSize: 64, fontWeight: '300', lineHeight: 70, letterSpacing: -2 },

  statsGrid: { flexDirection: 'row' },

  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
    gap: 4,
  },

  achIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
});
