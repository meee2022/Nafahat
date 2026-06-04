/**
 * شاشة الورد اليومي - خطّة قراءة يومية.
 * تربط بحفظ آخر موضع قراءة + هدف يومي محدّد.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Sunrise, BookOpen, Check, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, Button, ProgressBar } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useReadingStore, useStatsStore, useWirdStore } from '@store/index';
import { arabicNumber, SURAHS } from '@data/surahs';
import { useT } from '@store/languageStore';
import { TOP_BAR_PAD } from '@utils/safeArea';

export default function WirdScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const lastRead = useReadingStore((s) => s.lastRead);
  const stats = useStatsStore((s) => s.stats);

  // الورد المحفوظ (يصفّر العدّاد تلقائياً مع تغيّر اليوم)
  const {
    dailyTarget, pagesReadToday, completedDays,
    setDailyTarget, incrementPages, decrementPages, refreshIfNewDay,
  } = useWirdStore();

  // عند فتح الشاشة، تأكّد من تصفير العدّاد إذا تغيّر اليوم
  useEffect(() => { refreshIfNewDay(); }, [refreshIfNewDay]);

  const progress = dailyTarget > 0 ? pagesReadToday / dailyTarget : 0;
  const done = pagesReadToday >= dailyTarget;
  const remaining = Math.max(0, dailyTarget - pagesReadToday);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={t.hitSlop} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('wird.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('wird.title')}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 18 }}>
        {/* بطاقة الورد الكبيرة */}
        <Card padding={t.spacing.xl} elevation="sm" bordered>
          <View style={{ alignItems: 'center' }}>
            <View style={[styles.iconHero, { backgroundColor: t.colors.accent + '12', borderColor: t.colors.accent }]}>
              <Sunrise size={28} color={t.colors.accent} strokeWidth={1.5} />
            </View>

            <Text style={[styles.eyebrow, { color: t.colors.accent, marginTop: 14 }]}>{tr('wird.dailyTarget')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
              <Text style={[styles.bigNum, { color: t.colors.textPrimary }]}>
                {arabicNumber(pagesReadToday)}
              </Text>
              <Text style={{ fontSize: 24, color: t.colors.textTertiary, fontWeight: '300' }}>
                / {arabicNumber(dailyTarget)}
              </Text>
            </View>
            <Text variant="caption" color={t.colors.textTertiary} style={{ letterSpacing: 1.5, marginTop: 2 }}>{tr('wird.pages')}</Text>

            <View style={{ marginTop: 14, width: '100%' }}>
              <ProgressBar value={progress} color={done ? t.colors.success : t.colors.accent} height={8} />
            </View>

            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <OrnamentalRule width={140} color={t.colors.accent} variant="rosette" />
            </View>

            {done ? (
              <View style={[styles.donePill, { backgroundColor: t.colors.success + '14', borderColor: t.colors.success }]}>
                <Check size={14} color={t.colors.success} />
                <Text variant="label" color={t.colors.success}>{tr('wird.completedToday')}</Text>
              </View>
            ) : (
              <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 14 }}>
                {tr('wird.remainingFmt').replace('{n}', arabicNumber(remaining))}
              </Text>
            )}
          </View>
        </Card>

        {/* عدّاد سريع */}
        <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: 14 }} bordered>
          <Text variant="subtitle" align="center">{tr('wird.recordReading')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 14 }}>
            <Pressable
              onPress={decrementPages}
              style={[styles.counterBtn, { borderColor: t.colors.error }]}
              hitSlop={t.hitSlop}
              accessible
              accessibilityRole="button"
              accessibilityLabel="إنقاص صفحة"
            >
              <Minus size={20} color={t.colors.error} />
            </Pressable>
            <View style={[styles.counterBox, { borderColor: t.colors.borderGold }]}>
              <Text style={[styles.counterNum, { color: t.colors.accent }]}>
                {arabicNumber(pagesReadToday)}
              </Text>
              <Text variant="caption" color={t.colors.textTertiary}>{tr('common.page')}</Text>
            </View>
            <Pressable
              onPress={() => incrementPages(1)}
              style={[styles.counterBtn, { borderColor: t.colors.success }]}
              hitSlop={t.hitSlop}
              accessible
              accessibilityRole="button"
              accessibilityLabel="إضافة صفحة مقروءة"
            >
              <Plus size={20} color={t.colors.success} />
            </Pressable>
          </View>
        </Card>

        {/* تعديل الهدف */}
        <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: 14 }} bordered>
          <Text variant="subtitle">{tr('wird.adjustGoal')}</Text>
          <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 4 }}>
            {tr('wird.adjustGoalDesc')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {[2, 5, 10, 20, 30].map((v) => (
              <Pressable
                key={v}
                onPress={() => setDailyTarget(v)}
                style={[
                  styles.targetChip,
                  {
                    borderColor: dailyTarget === v ? t.colors.accent : t.colors.border,
                    backgroundColor: dailyTarget === v ? t.colors.accent + '14' : 'transparent',
                  },
                ]}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: dailyTarget === v ? t.colors.accent : t.colors.textSecondary,
                }}>
                  {arabicNumber(v)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* متابعة القراءة */}
        {lastRead ? (
          <Pressable onPress={() => router.push(`/surah/${lastRead.surahId}?ayah=${lastRead.ayahNumber}`)}>
            <Card padding={t.spacing.lg} elevation="sm" style={{ marginTop: 14 }} bordered>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.continueIcon, { backgroundColor: t.colors.primary }]}>
                  <BookOpen size={22} color={t.colors.onPrimary} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('wird.continueFromLast')}</Text>
                  <Text variant="subtitle" style={{ marginTop: 2 }}>{lastRead.surahName}</Text>
                  <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                    {tr('wird.ayahPage').replace('{a}', arabicNumber(lastRead.ayahNumber)).replace('{p}', arabicNumber(lastRead.page))}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/mushaf')}>
            <Card padding={t.spacing.lg} elevation="sm" style={{ marginTop: 14 }} bordered>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.continueIcon, { backgroundColor: t.colors.primary }]}>
                  <BookOpen size={22} color={t.colors.onPrimary} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('wird.startReading')}</Text>
                  <Text variant="subtitle" style={{ marginTop: 2 }}>{tr('wird.openMushaf')}</Text>
                  <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                    {tr('wird.pickSurahHint')}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}

        {/* إحصائيات */}
        <View style={[styles.statsRow, { marginTop: 14, gap: 10 }]}>
          <StatBox label={tr('wird.totalPages')} value={arabicNumber(stats.pagesRead)} color={t.colors.primary} />
          <StatBox label={tr('wird.streak')} value={`${arabicNumber(stats.streakDays)} ${tr('wird.streakDay')}`} color="#E0743D" />
        </View>
      </Screen>
    </View>
  );
}

const StatBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  const t = useTheme();
  return (
    <View style={{ flex: 1, padding: 14, borderWidth: 1, borderColor: t.colors.borderGold, backgroundColor: t.colors.surface, alignItems: 'center' }}>
      <Text style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: t.colors.textTertiary }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color, marginTop: 4 }}>{value}</Text>
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
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '600' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  iconHero: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  bigNum: { fontSize: 56, fontWeight: '300', lineHeight: 64, letterSpacing: -1.5 },

  donePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1,
  },

  counterBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  counterBox: {
    minWidth: 100, padding: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  counterNum: { fontSize: 32, fontWeight: '300', letterSpacing: -1, lineHeight: 36 },

  targetChip: {
    flex: 1, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: 999,
  },

  continueIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },

  statsRow: { flexDirection: 'row' },
});
