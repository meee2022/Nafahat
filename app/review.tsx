/**
 * شاشة المراجعة - عرض المهام المستحقّة للمراجعة (تستعمل نفس بيانات الحفظ).
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, RotateCcw, CheckCircle2, Trophy } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, EmptyState, Button } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useMemoStore } from '@store/index';
import { getDueTasks } from '@services/memorization';
import { arabicNumber, getSurahById } from '@data/surahs';
import { MemorizationStrength } from '@/types/index';
import { useT } from '@store/languageStore';
import { TOP_BAR_PAD } from '@utils/safeArea';

export default function ReviewScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { tasks, markTaskReviewed } = useMemoStore();
  const due = useMemo(() => getDueTasks(tasks), [tasks]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('review.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('review.title')}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 18 }}>
        {due.length === 0 ? (
          <Card padding={32} elevation="xs" bordered>
            <EmptyState
              icon={<Trophy size={36} color={t.colors.accent} />}
              title={tr('review.empty')}
              description="جميع محفوظاتك في وقتها المناسب. عُد غداً أو أنشئ خطة حفظ جديدة."
              actionLabel="إلى الحفظ"
              onAction={() => router.push('/memorization')}
            />
          </Card>
        ) : (
          <>
            <Card padding={20} elevation="sm" bordered background={t.colors.info + '08'}>
              <View style={{ alignItems: 'center' }}>
                <RotateCcw size={28} color={t.colors.info} />
                <Text style={[styles.eyebrow, { color: t.colors.info, marginTop: 10 }]}>مهام مستحقّة</Text>
                <Text style={[styles.bigNum, { color: t.colors.textPrimary }]}>{arabicNumber(due.length)}</Text>
                <Text variant="caption" color={t.colors.textTertiary}>للمراجعة الآن</Text>
                <View style={{ marginTop: 12 }}>
                  <OrnamentalRule width={120} color={t.colors.accent} variant="simple" />
                </View>
              </View>
            </Card>

            <View style={{ gap: 12, marginTop: 20 }}>
              {due.map((task) => {
                const surah = getSurahById(task.surahId);
                const overdueDays = task.nextReviewAt ? Math.floor((Date.now() - task.nextReviewAt) / 86400000) : 0;
                return (
                  <Card key={task.id} padding={16} elevation="xs" bordered>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View style={[styles.numBadge, { backgroundColor: t.colors.info + '14', borderColor: t.colors.info }]}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: t.colors.info }}>
                          {arabicNumber(task.ayahFrom)}-{arabicNumber(task.ayahTo)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="subtitle">{surah?.nameAr}</Text>
                        <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                          الآيات: {arabicNumber(task.ayahFrom)} - {arabicNumber(task.ayahTo)}
                        </Text>
                        {overdueDays > 0 ? (
                          <Text variant="caption" color={t.colors.warning} style={{ marginTop: 4, fontWeight: '700' }}>
                            متأخّر {arabicNumber(overdueDays)} يوم
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                      <RatingBtn
                        label="صعب"
                        color={t.colors.error}
                        onPress={() => markTaskReviewed(task.id, 'weak')}
                      />
                      <RatingBtn
                        label="متوسط"
                        color={t.colors.warning}
                        onPress={() => markTaskReviewed(task.id, 'medium')}
                      />
                      <RatingBtn
                        label="أتقنت"
                        color={t.colors.success}
                        icon={<CheckCircle2 size={14} color={t.colors.success} />}
                        onPress={() => markTaskReviewed(task.id, 'strong')}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        )}
      </Screen>
    </View>
  );
}

const RatingBtn: React.FC<{ label: string; color: string; icon?: React.ReactNode; onPress?: () => void }> = ({ label, color, icon, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      {
        flex: 1, paddingVertical: 10,
        borderWidth: 1.2, borderColor: color, borderRadius: 4,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        opacity: pressed ? 0.7 : 1,
      },
    ]}
  >
    {icon}
    <Text style={{ fontSize: 13, fontWeight: '700', color }}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: TOP_BAR_PAD, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  bigNum: { fontSize: 52, fontWeight: '300', lineHeight: 58, letterSpacing: -1.5, marginTop: 4 },
  numBadge: {
    minWidth: 60, paddingHorizontal: 10, paddingVertical: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: 4,
  },
});
