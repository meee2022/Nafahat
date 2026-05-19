/**
 * شاشة الحفظ - الخطة + المهام + المراجعات.
 * تبدأ فارغة. عند الضغط على "إنشاء خطة"، يختار المستخدم قالبًا فينطلق.
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Brain, Plus, CheckCircle2, RotateCcw, Mic, Target,
  Calendar, Flame, ListChecks, Trophy, BookOpen, Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SceneMemo } from '@components/illustrations/scenes';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, ProgressBar, Chip, SectionHeader, AppHeader, Button, EmptyState } from '@components/ui';
import { MemorizationHeatmap } from '@components/common';
import { useMemoStore } from '@store/index';
import { computePlanProgress, getTodaysTasks } from '@services/memorization';
import { scheduleDaily, requestPermission, isNotificationsSupported } from '@services/notifications';
import { arabicNumber, getSurahById, SURAHS } from '@data/surahs';
import { MemorizationStrength } from '@/types/index';
import { useT } from '@store/languageStore';

interface PlanTemplate {
  id: string;
  title: string;
  description: string;
  startSurah: number;
  endSurah: number;
  dailyAmount: number;
  color: string;
}

const TEMPLATES: PlanTemplate[] = [
  { id: 'amma',    title: 'جزء عمّ',         description: 'من النبأ إلى الناس (37 سورة قصيرة)', startSurah: 78,  endSurah: 114, dailyAmount: 5,  color: '#14746F' },
  { id: 'tabarak', title: 'جزء تبارك',       description: 'من الملك إلى المرسلات (11 سورة)',    startSurah: 67,  endSurah: 77,  dailyAmount: 7,  color: '#7C3AED' },
  { id: 'short',   title: 'قصار المفصّل',    description: 'من الضحى إلى الناس (22 سورة)',       startSurah: 93,  endSurah: 114, dailyAmount: 3,  color: '#D97706' },
  { id: 'kahf',    title: 'سورة الكهف',      description: 'حفظ سورة الكهف كاملة',               startSurah: 18,  endSurah: 18,  dailyAmount: 10, color: '#0284C7' },
];

export default function MemorizationScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { plans, tasks, markTaskMemorized, markTaskReviewed, createPlan, addTask } = useMemoStore();
  const [tab, setTab] = useState<'today' | 'all' | 'plan'>('today');
  const [showTemplates, setShowTemplates] = useState(false);

  const plan = plans[0];
  const planProgress = useMemo(() => computePlanProgress(tasks), [tasks]);
  const todayTasks = useMemo(() => getTodaysTasks(tasks, plan), [tasks, plan]);

  const handleCreate = (template: PlanTemplate) => {
    const newPlan = createPlan({
      title: `خطة ${template.title}`,
      unit: 'ayah',
      dailyAmount: template.dailyAmount,
      startSurah: template.startSurah,
      endSurah: template.endSurah,
      daysPerWeek: 6,
      reminderTime: '06:30',
    });

    // إنشاء أول مهمة من السورة الأولى - يبقى الباقي يُضاف تدريجيًا مع التقدم
    const firstSurah = SURAHS.find((s) => s.id === template.startSurah);
    if (firstSurah) {
      const ayahTo = Math.min(template.dailyAmount, firstSurah.versesCount);
      addTask({
        surahId: template.startSurah,
        ayahFrom: 1,
        ayahTo,
        status: 'new',
      });
    }
    setShowTemplates(false);
  };

  return (
    <Screen>
      <AppHeader title={tr('memo.title')} subtitle={tr('memo.subtitle')} />

      {/* 🔥 Heat-map النشاط آخر 14 يوم */}
      <View style={{ marginBottom: t.spacing.md }}>
        <MemorizationHeatmap />
      </View>

      {/* بطاقة الخطة أو حالة فارغة */}
      {plan ? (
        <LinearGradient
          colors={[t.colors.primary, t.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planHero}
        >
          {/* عناصر زخرفية في الخلفية */}
          <View style={[styles.planDecor, { top: -10, end: -10 }]} pointerEvents="none">
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </View>
          <View style={[styles.planDecor, { bottom: -20, start: -20 }]} pointerEvents="none">
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)' }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.planIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Brain size={22} color="#FBF7EA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: 'rgba(251,247,234,0.75)', fontWeight: '700', letterSpacing: 2 }}>
                خطتك النشطة
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FBF7EA', marginTop: 2 }}>
                {plan.title}
              </Text>
              <Text style={{ fontSize: 11, color: 'rgba(251,247,234,0.7)', marginTop: 2 }}>
                {arabicNumber(plan.dailyAmount)} {plan.unit === 'ayah' ? 'آيات' : plan.unit === 'page' ? 'صفحات' : 'حزب'} يوميًا · تذكير {plan.reminderTime}
              </Text>
            </View>
            <View style={[styles.percentBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FBF7EA' }}>{planProgress.percent}%</Text>
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <View style={[styles.planProgress, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <View style={[styles.planProgressFill, { width: `${planProgress.percent}%`, backgroundColor: t.colors.accent }]} />
            </View>
          </View>

          <View style={[styles.heroStatsRow, { borderTopColor: 'rgba(255,255,255,0.18)' }]}>
            <HeroStat icon={<CheckCircle2 size={14} color="#FBF7EA" />} label="محفوظ"   value={arabicNumber(planProgress.memorized)} />
            <View style={styles.heroStatDivider} />
            <HeroStat icon={<Brain size={14} color="#FBF7EA" />}        label="قيد الحفظ" value={arabicNumber(planProgress.inProgress)} />
            <View style={styles.heroStatDivider} />
            <HeroStat icon={<RotateCcw size={14} color="#FBF7EA" />}    label="مراجعة"   value={arabicNumber(planProgress.due)} />
          </View>
        </LinearGradient>
      ) : !showTemplates ? (
        <Card padding={t.spacing.xl} elevation="sm" style={{ alignItems: 'center' }} bordered>
          {/* مشهد توضيحي للحفظ */}
          <View style={{ marginBottom: 8 }}>
            <SceneMemo size={120} />
          </View>
          <Text variant="h3" style={{ marginTop: 8 }}>ابدأ خطتك الأولى</Text>
          <Text variant="body" color={t.colors.textSecondary} align="center" style={{ marginTop: 8, lineHeight: 22 }}>
            حدّد ما تريد حفظه ومقدارك اليومي،{'\n'}
            وستتولى نَفَحات جدولة المراجعة عنك.
          </Text>
          <Button
            label="اختر قالبًا"
            iconLeft={<Sparkles size={16} color="#fff" />}
            onPress={() => setShowTemplates(true)}
            style={{ marginTop: 22 }}
          />

          {/* نصائح أسفل */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <TipChip icon="⏱️" text="٥ دقائق يومياً" />
            <TipChip icon="🧠" text="تكرار متباعد" />
            <TipChip icon="🔔" text="تذكيرات ذكية" />
          </View>
        </Card>
      ) : (
        <View>
          <SectionHeader title="اختر قالب حفظ" subtitle="ابدأ بسرعة بقالب جاهز" />
          <View style={{ gap: t.spacing.md }}>
            {TEMPLATES.map((tmpl) => (
              <Pressable key={tmpl.id} onPress={() => handleCreate(tmpl)}>
                <Card padding={t.spacing.lg} elevation="xs" bordered>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: tmpl.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={22} color={tmpl.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="subtitle">{tmpl.title}</Text>
                      <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 2 }}>{tmpl.description}</Text>
                      <Text variant="caption" color={tmpl.color} style={{ marginTop: 4 }}>
                        {arabicNumber(tmpl.dailyAmount)} آيات يوميًا
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}

            {/* 🎯 خطة مخصّصة - يفتح wizard كامل */}
            <Pressable
              onPress={() => { setShowTemplates(false); router.push('/memo-create'); }}
              accessibilityRole="button"
              accessibilityLabel="إنشاء خطة حفظ مخصّصة"
            >
              <Card padding={t.spacing.lg} elevation="xs" bordered style={{ borderColor: t.colors.accent, borderWidth: 1.5, backgroundColor: t.colors.accent + '0A' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: t.colors.accent + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.accent }}>
                    <Sparkles size={22} color={t.colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="subtitle" color={t.colors.accent}>خطة مخصّصة ✨</Text>
                    <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                      اختر السور والكمّ اليومي والجدول بنفسك
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>

            <Button label="إلغاء" variant="ghost" onPress={() => setShowTemplates(false)} />
          </View>
        </View>
      )}

      {/* التبويبات والمهام - تظهر فقط مع وجود خطة */}
      {plan ? (
        <>
          <View style={[styles.tabs, { backgroundColor: t.colors.surfaceAlt, borderRadius: t.radius.md, marginTop: t.spacing.lg }]}>
            {(['today', 'all', 'plan'] as const).map((id) => {
              const active = tab === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setTab(id)}
                  style={[
                    styles.tab,
                    active && { backgroundColor: t.colors.surface, ...t.shadows.xs },
                    { borderRadius: t.radius.sm },
                  ]}
                >
                  <Text variant="label" color={active ? t.colors.primary : t.colors.textSecondary} align="center">
                    {id === 'today' ? 'مهام اليوم' : id === 'all' ? 'كل المهام' : 'تفاصيل الخطة'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {tab === 'today' ? (
            <View style={{ marginTop: t.spacing.md, gap: t.spacing.md }}>
              {todayTasks.due.length > 0 ? (
                <View>
                  <SectionRow icon={<RotateCcw size={16} color={t.colors.info} />} title="مراجعات مستحقة اليوم" />
                  {todayTasks.due.map((task) => (
                    <TaskCard
                      key={task.id}
                      surahId={task.surahId}
                      range={`${arabicNumber(task.ayahFrom)} - ${arabicNumber(task.ayahTo)}`}
                      status="مراجعة"
                      strength={task.strength}
                      onStartSession={() => router.push({ pathname: '/memo-session', params: { taskId: task.id } })}
                      onDone={(s) => markTaskReviewed(task.id, s)}
                    />
                  ))}
                </View>
              ) : null}

              {todayTasks.new.length > 0 ? (
                <View>
                  <SectionRow icon={<Plus size={16} color={t.colors.primary} />} title="حفظ جديد اليوم" />
                  {todayTasks.new.map((task) => (
                    <TaskCard
                      key={task.id}
                      surahId={task.surahId}
                      range={`${arabicNumber(task.ayahFrom)} - ${arabicNumber(task.ayahTo)}`}
                      status="جديد"
                      strength={task.strength}
                      onStartSession={() => router.push({ pathname: '/memo-session', params: { taskId: task.id } })}
                      onDone={(s) => markTaskMemorized(task.id, s)}
                      hint="اضغط ابدأ الجلسة للحفظ التفاعلي"
                    />
                  ))}
                </View>
              ) : null}

              {todayTasks.due.length === 0 && todayTasks.new.length === 0 && (
                <Card padding={t.spacing.xl} elevation="xs" style={{ alignItems: 'center' }}>
                  <Trophy size={36} color={t.colors.accent} />
                  <Text variant="subtitle" style={{ marginTop: 12 }}>أحسنت! لا توجد مهام لليوم</Text>
                  <Text variant="bodySm" color={t.colors.textSecondary} align="center" style={{ marginTop: 6 }}>
                    عُد غدًا لمتابعة الخطة، أو أضف مهامًا جديدة.
                  </Text>
                </Card>
              )}
            </View>
          ) : tab === 'all' ? (
            <View style={{ marginTop: t.spacing.md, gap: t.spacing.md }}>
              {tasks.length === 0 ? (
                <EmptyState
                  icon={<ListChecks size={36} color={t.colors.primary} />}
                  title="لا توجد مهام بعد"
                  description="ستظهر هنا المقاطع التي تحفظها وتراجعها"
                />
              ) : (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    surahId={task.surahId}
                    range={`${arabicNumber(task.ayahFrom)} - ${arabicNumber(task.ayahTo)}`}
                    status={task.status === 'memorized' ? 'محفوظ' : task.status === 'learning' ? 'يتعلم' : 'جديد'}
                    strength={task.strength}
                    hint={task.nextReviewAt ? `المراجعة القادمة خلال ${Math.max(1, Math.round((task.nextReviewAt - Date.now()) / 86400000))} أيام` : 'لم يبدأ بعد'}
                    onStartSession={() => router.push({ pathname: '/memo-session', params: { taskId: task.id } })}
                    onDone={(s) => markTaskMemorized(task.id, s)}
                  />
                ))
              )}
            </View>
          ) : (
            <View style={{ marginTop: t.spacing.md, gap: t.spacing.md }}>
              <Card padding={t.spacing.lg} elevation="xs">
                <Text variant="subtitle">إعدادات الخطة</Text>
                <View style={{ marginTop: 12, gap: 10 }}>
                  <SettingRow label="المقدار اليومي" value={`${arabicNumber(plan.dailyAmount)} آيات`} icon={<Target size={16} color={t.colors.primary} />} />
                  <SettingRow label="أيام الأسبوع"   value={`${arabicNumber(plan.daysPerWeek)} أيام`}  icon={<Calendar size={16} color={t.colors.primary} />} />
                  <SettingRow label="موعد التذكير"   value={plan.reminderTime} icon={<Flame size={16} color={t.colors.primary} />} />
                  <SettingRow label="نوع التقسيم"    value={plan.unit === 'ayah' ? 'آيات' : plan.unit === 'page' ? 'صفحات' : 'أحزاب'} icon={<ListChecks size={16} color={t.colors.primary} />} />
                </View>
              </Card>

              <Card padding={t.spacing.lg} elevation="xs">
                <Text variant="subtitle">جلسات سريعة</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <Chip
                    label="جلسة حفظ"
                    iconLeft={<Brain size={14} color={t.colors.primary} />}
                    onPress={() => {
                      // ابدأ بأول مهمة جديدة في الخطة
                      const firstNew = tasks.find((task) => task.status === 'new');
                      if (firstNew) router.push({ pathname: '/memo-session', params: { taskId: firstNew.id } });
                    }}
                  />
                  <Chip
                    label="جلسة مراجعة"
                    iconLeft={<RotateCcw size={14} color={t.colors.primary} />}
                    onPress={() => router.push('/review')}
                  />
                  <Chip label="جلسة تسميع"   iconLeft={<Mic size={14} color={t.colors.primary} />} onPress={() => router.push('/tasmee')} />
                </View>
              </Card>
            </View>
          )}
        </>
      ) : null}
    </Screen>
  );
}

// ─── إحصائية داخل بطاقة الـ hero للخطة ───
const HeroStat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon}
      <Text style={{ fontSize: 10, color: 'rgba(251,247,234,0.78)', fontWeight: '600', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
    <Text style={{ fontSize: 20, fontWeight: '800', color: '#FBF7EA', marginTop: 4 }}>{value}</Text>
  </View>
);

// ─── شارة نصيحة سريعة ───
const TipChip: React.FC<{ icon: string; text: string }> = ({ icon, text }) => {
  const t = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: t.colors.surfaceAlt,
    }}>
      <Text style={{ fontSize: 11 }}>{icon}</Text>
      <Text style={{ fontSize: 11, fontWeight: '600', color: t.colors.textSecondary }}>{text}</Text>
    </View>
  );
};

const MiniBox: React.FC<{ label: string; value: number; tint: string }> = ({ label, value, tint }) => {
  const t = useTheme();
  return (
    <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: tint + '14', alignItems: 'center' }}>
      <Text variant="h2" color={tint}>{arabicNumber(value)}</Text>
      <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 2 }}>{label}</Text>
    </View>
  );
};

const SectionRow: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 10 }}>
      {icon}
      <Text variant="label" color={t.colors.textSecondary}>{title}</Text>
    </View>
  );
};

interface TaskCardProps {
  surahId: number;
  range: string;
  status: string;
  strength: MemorizationStrength;
  hint?: string;
  onDone?: (s: MemorizationStrength) => void;
  onStartSession?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ surahId, range, status, strength, hint, onDone, onStartSession }) => {
  const t = useTheme();
  const surah = getSurahById(surahId);
  const strengthColor = strength === 'strong' ? t.colors.success : strength === 'medium' ? t.colors.warning : t.colors.error;
  const strengthLabel = strength === 'strong' ? 'قوي' : strength === 'medium' ? 'متوسط' : 'ضعيف';

  return (
    <Card padding={t.spacing.lg} elevation="xs">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text variant="subtitle">{surah?.nameAr}</Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: t.colors.primarySoft }}>
              <Text variant="caption" color={t.colors.primary}>{status}</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: strengthColor + '20' }}>
              <Text variant="caption" color={strengthColor}>{strengthLabel}</Text>
            </View>
          </View>
          <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 6 }}>
            الآيات: {range}
          </Text>
          {hint ? <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 4 }}>{hint}</Text> : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        {onStartSession ? (
          <Pressable onPress={onStartSession} style={[styles.strengthBtn, { borderColor: t.colors.primary, backgroundColor: t.colors.primary + '12' }]}>
            <Brain size={14} color={t.colors.primary} />
            <Text variant="caption" color={t.colors.primary}>ابدأ الجلسة</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => onDone?.('weak')} style={[styles.strengthBtn, { borderColor: t.colors.error }]}>
          <Text variant="caption" color={t.colors.error}>صعب</Text>
        </Pressable>
        <Pressable onPress={() => onDone?.('strong')} style={[styles.strengthBtn, { borderColor: t.colors.success, backgroundColor: t.colors.successSurface }]}>
          <CheckCircle2 size={14} color={t.colors.success} />
          <Text variant="caption" color={t.colors.success}>أتقنت</Text>
        </Pressable>
      </View>
    </Card>
  );
};

const SettingRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon}
        <Text variant="body">{label}</Text>
      </View>
      <Text variant="body" color={t.colors.textSecondary}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bigIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row' },

  // بطاقة الخطة الـ hero
  planHero: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  planDecor: { position: 'absolute' },
  planIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  percentBadge: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
  },
  planProgress: {
    height: 8, borderRadius: 4, overflow: 'hidden',
  },
  planProgressFill: {
    height: '100%', borderRadius: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth, height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
  },
  tabs: { flexDirection: 'row', padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  strengthBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth * 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
});
