import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight, BookOpen, Brain, Clock, Heart, Flame, Calendar,
  Trophy, CheckCircle2, Sparkles, AlertCircle, RotateCcw, ChevronLeft
} from 'lucide-react-native';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, Button } from '@components/ui';
import { useStatsStore, useMemoStore, useKhatmaStore } from '@store/index';
import { arabicNumber, getSurahById } from '@data/surahs';
import { computeUserLevel } from '@utils/userLevel';
import { formatReviewTimeAr } from '@services/memorization';

const EMERALD = '#0A3D38';
const GOLD    = '#B8923B';
const CRIMSON = '#BE123C';

export default function SpiritualAnalyticsScreen() {
  const t = useTheme();
  const router = useRouter();
  
  const stats = useStatsStore(s => s.stats);
  const { tasks } = useMemoStore();
  const { activePlan } = useKhatmaStore();
  
  const userLevel = useMemo(() => computeUserLevel(stats), [stats]);

  // SRS calculations
  const srsTasks = useMemo(() => tasks.filter(t => t.status === 'memorized'), [tasks]);
  const srsGroups = useMemo(() => {
    return {
      strong: srsTasks.filter(t => t.strength === 'strong'),
      medium: srsTasks.filter(t => t.strength === 'medium'),
      weak: srsTasks.filter(t => t.strength === 'weak' || !t.strength),
    };
  }, [srsTasks]);

  const memoryStability = useMemo(() => {
    if (srsTasks.length === 0) return 100;
    const score = (srsGroups.strong.length * 100 + srsGroups.medium.length * 70 + srsGroups.weak.length * 30) / srsTasks.length;
    return Math.round(score);
  }, [srsTasks, srsGroups]);

  // Next 7 days due tasks count
  const next7DaysTimeline = useMemo(() => {
    const timeline = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(23, 59, 59, 999);
      const dayName = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'][date.getDay()];
      return { dayName, timestamp: date.getTime(), count: 0, tasks: [] as typeof srsTasks };
    });

    srsTasks.forEach(task => {
      if (task.nextReviewAt) {
        const diffTime = task.nextReviewAt - Date.now();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          timeline[diffDays].count++;
          timeline[diffDays].tasks.push(task);
        }
      }
    });
    return timeline;
  }, [srsTasks]);

  return (
    <Screen scrollable={false} contentStyle={{ paddingHorizontal: 0 }}>
      {/* ── الترويسة الفاخرة ── */}
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontWeight: '900', fontSize: 17, color: t.colors.textPrimary, letterSpacing: 0.5 }}>
          لوحة الإحصائيات الروحية ✨
        </Text>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* 🏆 بطاقة الرتبة الروحية الكبرى */}
        <LinearGradient
          colors={[EMERALD, '#06201D']}
          style={[styles.levelCard, { borderColor: GOLD, borderWidth: 1.5, borderRadius: t.radius.xl }]}
        >
          {/* Decorative arabesque background */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(184, 146, 59, 0.1)' }} />
            <View style={{ position: 'absolute', bottom: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(184, 146, 59, 0.08)' }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color={GOLD} />
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 1.5 }}>
                  مرتبتك الحالية
                </Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 4 }}>
                {userLevel.emoji} {userLevel.title}
              </Text>
              <Text style={{ fontSize: 13, color: GOLD, marginTop: 4, fontWeight: '700' }}>
                المستوى {arabicNumber(userLevel.level)}
              </Text>
              
              <View style={styles.levelProgressContainer}>
                <View style={[styles.levelProgressBar, { width: `${Math.round(userLevel.progress * 100)}%` }]} />
              </View>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 6, fontWeight: '600' }}>
                {userLevel.nextMin === -1
                  ? 'وصلت لأعلى الرتب 🏆'
                  : `باقي ${arabicNumber(userLevel.pointsToNext)} نقطة للارتقاء للرتبة التالية`}
              </Text>
            </View>

            {/* Concentric Circle Badge */}
            <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={84} height={84}>
                <Circle cx={42} cy={42} r={36} stroke="rgba(184, 146, 59, 0.15)" strokeWidth={5} fill="transparent" />
                <Circle
                  cx={42} cy={42} r={36} stroke={GOLD} strokeWidth={5}
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 - (userLevel.progress) * (2 * Math.PI * 36)}
                  strokeLinecap="round" fill="transparent" transform="rotate(-90 42 42)"
                />
              </Svg>
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: GOLD }}>
                  {Math.round(userLevel.progress * 100)}%
                </Text>
                <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', marginTop: -2, fontWeight: '700' }}>
                  تقدّم
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* 📊 شبكة الإحصائيات الفخمة */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <MetricCard
              icon={<BookOpen size={20} color={GOLD} />}
              label="ورد القراءة"
              value={`${arabicNumber(stats.pagesRead)} صفحة`}
              desc={activePlan ? `الورد اليومي: ${arabicNumber(activePlan.pagesPerDay)} ص` : 'ابدأ خطة الورد اليومي'}
              t={t}
            />
            <MetricCard
              icon={<Brain size={20} color={GOLD} />}
              label="الحفظ والمراجعة"
              value={`${arabicNumber(srsTasks.length)} مقطع`}
              desc={`استقرار الحفظ: ${arabicNumber(memoryStability)}%`}
              t={t}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              icon={<Clock size={20} color={GOLD} />}
              label="الاستماع الصوتي"
              value={`${arabicNumber(stats.listenedMinutes)} دقيقة`}
              desc={`${arabicNumber(stats.sessionsCount)} جلسة استماع`}
              t={t}
            />
            <MetricCard
              icon={<Heart size={20} color={GOLD} />}
              label="الذكر والتسبيح"
              value={arabicNumber(stats.tasbeehCount)}
              desc="ألا بذكر الله تطمئن القلوب"
              t={t}
            />
          </View>
        </View>

        {/* 🏛️ رسم بياني بأعمدة الصوامع الإسلامية (Islamic Pillars Activity Chart) */}
        <Card padding={18} elevation="xs" style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text variant="subtitle" style={{ fontWeight: '800' }}>نشاطك الأسبوعي مع القرآن</Text>
              <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>الوقت المستغرق بالدقائق</Text>
            </View>
            <Trophy size={18} color={GOLD} />
          </View>

          <View style={styles.pillarsChart}>
            {stats.weeklyMinutes.map((mins, i) => {
              const max = Math.max(...stats.weeklyMinutes, 1);
              const heightPct = mins / max;
              const barHeight = Math.max(10, heightPct * 80);
              const isToday = i === 6;

              return (
                <View key={i} style={styles.pillarContainer}>
                  {/* The Islamic Arch Pillar Shape in Svg */}
                  <View style={{ height: 80, justifyContent: 'flex-end', width: 22, alignItems: 'center' }}>
                    <Svg width={22} height={barHeight}>
                      <G>
                        {/* Arched Top Path */}
                        <Path
                          d={`M 11,0 C 1,3 0,8 0,12 L 0,${barHeight} L 22,${barHeight} L 22,12 C 22,8 21,3 11,0 Z`}
                          fill={isToday ? GOLD : EMERALD}
                          opacity={isToday ? 1.0 : 0.85}
                        />
                      </G>
                    </Svg>
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: isToday ? GOLD : t.colors.textTertiary, marginTop: 6 }}>
                    {mins > 0 ? `${arabicNumber(mins)}د` : '-'}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: isToday ? GOLD : t.colors.textSecondary, marginTop: 4 }}>
                    {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* 🎯 صندوق المراجعة المتباعدة الذكي (Spaced Repetition Review Engine) */}
        <View style={{ marginTop: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: t.colors.textPrimary }}>
            🧠 نظام التكرار المتباعد الذكي (SRS)
          </Text>
          <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 2 }}>
            جدولة ذكية لمقاطعك المحفوظة بناءً على قوة الذاكرة ومكافحة النسيان.
          </Text>
        </View>

        {/* خط أنابيب قوة الذاكرة (Memory Pipeline Stats) */}
        <Card padding={16} elevation="xs">
          <Text variant="label" style={{ fontWeight: '800', marginBottom: 12 }}>توزيع المقاطع حسب قوة الحفظ</Text>
          <View style={styles.pipelineBar}>
            <View style={[styles.pipelineSegment, { flex: Math.max(1, srsGroups.strong.length), backgroundColor: GOLD }]} />
            <View style={[styles.pipelineSegment, { flex: Math.max(1, srsGroups.medium.length), backgroundColor: '#2D6A4F' }]} />
            <View style={[styles.pipelineSegment, { flex: Math.max(1, srsGroups.weak.length), backgroundColor: CRIMSON }]} />
          </View>

          <View style={styles.pipelineLegend}>
            <LegendItem dotColor={GOLD} label="متقن" count={srsGroups.strong.length} />
            <LegendItem dotColor="#2D6A4F" label="متوسط" count={srsGroups.medium.length} />
            <LegendItem dotColor={CRIMSON} label="بحاجة مراجعة" count={srsGroups.weak.length} />
          </View>
        </Card>

        {/* 📅 جدول التوقعات الأسبوعي للمراجعات */}
        <Card padding={16} elevation="xs" style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Calendar size={16} color={GOLD} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: t.colors.textPrimary }}>
              جدول المراجعات المستحقة (الأيام الـ 7 القادمة)
            </Text>
          </View>

          <View style={styles.timelineRow}>
            {next7DaysTimeline.map((day, idx) => {
              const isDueToday = idx === 0 && day.count > 0;
              return (
                <View key={idx} style={[styles.timelineDay, isDueToday && { borderColor: GOLD, borderWidth: 1, backgroundColor: 'rgba(184, 146, 59, 0.05)' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: isDueToday ? GOLD : t.colors.textPrimary }}>{day.dayName}</Text>
                  <View style={[
                    styles.timelineCounter,
                    {
                      backgroundColor: day.count > 0 ? (isDueToday ? GOLD : EMERALD) : 'rgba(0,0,0,0.04)',
                    }
                  ]}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: day.count > 0 ? '#fff' : t.colors.textTertiary }}>
                      {arabicNumber(day.count)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 9, color: t.colors.textTertiary, fontWeight: '600' }}>
                    {idx === 0 ? 'اليوم' : idx === 1 ? 'غداً' : `+${arabicNumber(idx)}ي`}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* 📋 قائمة المهام الفورية المستحقة للمراجعة */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '850', color: t.colors.textSecondary, marginBottom: 10 }}>
            📌 المقاطع المجدولة للمراجعة المتباعدة الفورية
          </Text>

          {srsTasks.length === 0 ? (
            <Card padding={20} style={{ alignItems: 'center', borderColor: t.colors.border, borderWidth: 1 }}>
              <AlertCircle size={28} color={t.colors.textTertiary} />
              <Text style={{ fontSize: 13, color: t.colors.textSecondary, marginTop: 8, fontWeight: '700' }}>
                لا توجد مقاطع محفوظة سلفاً.
              </Text>
              <Text style={{ fontSize: 11, color: t.colors.textTertiary, marginTop: 4, textAlign: 'center', lineHeight: 18 }}>
                ابدأ بحفظ وتسميع آيات جديدة من قسم التحفيظ لتنشيط نظام المراجعة المتباعدة.
              </Text>
            </Card>
          ) : (
            srsTasks.slice(0, 5).map(task => {
              const surah = getSurahById(task.surahId);
              const strengthColor = task.strength === 'strong' ? GOLD : task.strength === 'medium' ? '#2D6A4F' : CRIMSON;
              const strengthLabel = task.strength === 'strong' ? 'متقن' : task.strength === 'medium' ? 'متوسط' : 'صعب';
              const timeAr = formatReviewTimeAr(task.nextReviewAt);

              return (
                <Card key={task.id} padding={14} elevation="xs" style={styles.srsTaskCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: t.colors.textPrimary }}>{surah?.nameAr}</Text>
                      <View style={[styles.strengthBadge, { backgroundColor: strengthColor + '18' }]}>
                        <Text style={{ fontSize: 10, color: strengthColor, fontWeight: '800' }}>{strengthLabel}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 4 }}>
                      الآيات المشمولة: {arabicNumber(task.ayahFrom)} - {arabicNumber(task.ayahTo)}
                    </Text>
                    {task.nextReviewAt && (
                      <Text style={{ fontSize: 10, color: task.nextReviewAt <= Date.now() ? CRIMSON : t.colors.textTertiary, marginTop: 4, fontWeight: '700' }}>
                        ⏰ المراجعة: {timeAr}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    onPress={() => router.push({ pathname: '/memo-session', params: { taskId: task.id } })}
                    style={({ pressed }) => [
                      styles.srsActionBtn,
                      {
                        backgroundColor: pressed ? 'rgba(10, 61, 56, 0.12)' : 'rgba(10, 61, 56, 0.05)',
                      }
                    ]}
                  >
                    <RotateCcw size={12} color={EMERALD} />
                    <Text style={{ fontSize: 11, fontWeight: '850', color: EMERALD }}>راجع الآن</Text>
                  </Pressable>
                </Card>
              );
            })
          )}
        </View>

      </ScrollView>
    </Screen>
  );
}

// ── مكونات فرعية ──

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; desc: string; t: any }> = ({ icon, label, value, desc, t }) => (
  <View style={[styles.metricCard, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
    <View style={styles.metricHeader}>
      <View style={styles.metricIconBox}>
        {icon}
      </View>
      <Text style={{ fontSize: 12, color: t.colors.textSecondary, fontWeight: '800' }}>{label}</Text>
    </View>
    <Text style={{ fontSize: 18, fontWeight: '900', color: t.colors.textPrimary, marginTop: 10 }}>{value}</Text>
    <Text style={{ fontSize: 10, color: t.colors.textTertiary, marginTop: 4, fontWeight: '600' }} numberOfLines={1}>
      {desc}
    </Text>
  </View>
);

const LegendItem: React.FC<{ dotColor: string; label: string; count: number }> = ({ dotColor, label, count }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
    <Text style={{ fontSize: 11, color: '#888', fontWeight: '700' }}>
      {label} ({arabicNumber(count)})
    </Text>
  </View>
);

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 50, paddingBottom: 12,
    gap: 8, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  
  levelCard: { padding: 20, marginBottom: 16 },
  levelProgressContainer: {
    width: '100%', height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 14, overflow: 'hidden'
  },
  levelProgressBar: { height: '100%', backgroundColor: GOLD, borderRadius: 3 },

  metricsGrid: { gap: 10 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1, padding: 14, borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1
  },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricIconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(184, 146, 59, 0.08)',
    alignItems: 'center', justifyContent: 'center'
  },

  pillarsChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 10 },
  pillarContainer: { flex: 1, alignItems: 'center' },

  pipelineBar: { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden' },
  pipelineSegment: { height: '100%' },
  pipelineLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },

  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  timelineDay: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', gap: 6 },
  timelineCounter: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  srsTaskCard: {
    flexDirection: 'row', alignItems: 'center',
    borderColor: 'rgba(0,0,0,0.05)', borderWidth: 1,
    marginBottom: 8, paddingHorizontal: 12, paddingVertical: 12
  },
  strengthBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  srsActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8
  }
});
