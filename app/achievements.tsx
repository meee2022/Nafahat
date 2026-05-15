/**
 * شاشة الإنجازات والشارات - تُحسب من إحصائيات المستخدم الفعلية.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Flame, BookOpen, Headphones, Heart, Feather, Award, Sunrise, Lock, Trophy } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader, ProgressBar, EmptyState } from '@components/ui';
import { computeAchievements, CHALLENGES } from '@data/achievements';
import { useStatsStore } from '@store/index';
import { arabicNumber } from '@data/surahs';
import { useT } from '@store/languageStore';

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles size={26} />,
  Flame:    <Flame size={26} />,
  BookOpen: <BookOpen size={26} />,
  Headphones: <Headphones size={26} />,
  Heart:    <Heart size={26} />,
  Feather:  <Feather size={26} />,
  Award:    <Award size={26} />,
  Sunrise:  <Sunrise size={26} />,
};

export default function AchievementsScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const stats = useStatsStore((s) => s.stats);
  const achievements = useMemo(() => computeAchievements(stats), [stats]);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title={tr('achievements.title')} />

      {/* ملخص */}
      <Card padding={t.spacing.lg} elevation="sm" background={t.colors.primarySoft}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text variant="caption" color={t.colors.textSecondary}>تم فتحه</Text>
            <Text variant="h1" color={t.colors.primary}>{arabicNumber(unlocked)} / {arabicNumber(achievements.length)}</Text>
          </View>
          <Award size={48} color={t.colors.primary} />
        </View>
        <ProgressBar value={unlocked / achievements.length} color={t.colors.primary} style={{ marginTop: 12 }} />
      </Card>

      {/* التحديات النشطة */}
      {CHALLENGES.length > 0 ? (
        <>
          <Text variant="h3" style={{ marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>تحديات نشطة</Text>
          <View style={{ gap: t.spacing.md }}>
            {CHALLENGES.map((c) => {
              const progress = c.progress / c.goal;
              return (
                <Card key={c.id} padding={t.spacing.lg} elevation="xs">
                  <Text variant="subtitle">{c.title}</Text>
                  <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 4 }}>{c.description}</Text>
                  <ProgressBar value={progress} color={t.colors.accent} style={{ marginTop: 12 }} />
                </Card>
              );
            })}
          </View>
        </>
      ) : null}

      {/* شارات */}
      <Text variant="h3" style={{ marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>الشارات</Text>
      {unlocked === 0 ? (
        <Card padding={t.spacing.xl} elevation="xs">
          <EmptyState
            icon={<Trophy size={36} color={t.colors.accent} />}
            title={tr('achievements.startJourney')}
            description="كل قراءة، حفظ، تسبيحة تقربك من إنجاز جديد. واصل، وستجد شاراتك هنا قريبًا."
          />
        </Card>
      ) : null}

      <View style={[styles.badgeGrid, { gap: t.spacing.md }]}>
        {achievements.map((a) => (
          <View key={a.id} style={{ width: '47%' }}>
            <Card padding={t.spacing.lg} elevation="xs" style={{ alignItems: 'center', minHeight: 170 }}>
              <View style={[styles.badgeIcon, { backgroundColor: a.unlocked ? t.colors.accent + '22' : t.colors.surfaceAlt }]}>
                {a.unlocked
                  ? React.cloneElement(ICON_MAP[a.icon] as React.ReactElement, { color: t.colors.accent })
                  : <Lock size={22} color={t.colors.textTertiary} />}
              </View>
              <Text variant="subtitle" align="center" style={{ marginTop: 10 }}>{a.title}</Text>
              <Text variant="caption" color={t.colors.textSecondary} align="center" style={{ marginTop: 4 }} numberOfLines={2}>
                {a.description}
              </Text>
              {!a.unlocked ? (
                <View style={{ width: '100%', marginTop: 10 }}>
                  <ProgressBar value={a.progress} color={t.colors.primary} height={4} />
                  <Text variant="caption" color={t.colors.textTertiary} align="center" style={{ marginTop: 4 }}>
                    {arabicNumber(Math.round(a.progress * a.target))} / {arabicNumber(a.target)}
                  </Text>
                </View>
              ) : null}
            </Card>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  badgeIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
