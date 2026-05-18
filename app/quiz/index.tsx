/**
 * شاشة الاختبارات الرئيسية:
 * - بطاقة المرتبة الحالية والنقاط الإجمالية
 * - اختيار المستوى (مبتدئ/متوسط/متقدم)
 * - اختيار الأجزاء (افتراضي/تخصيص)
 * - عرض سجل آخر الاختبارات
 * - زر البدء يفتح جلسة جديدة
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Sparkles, Trophy, Flame, Target, Award, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, Button, ProgressBar } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useQuizStore, getRankForPoints, defaultQuestionsForLevel } from '@store/index';
import { defaultJuzsForLevel } from '@services/quiz';
import { QuizLevel } from '@/types/index';
import { useT } from '@store/languageStore';
import { arabicNumber } from '@data/surahs';

type ScopeMode = 'default' | 'custom' | 'all';
type QuizMode = 'algorithmic' | 'curated' | 'mixed';

export default function QuizHubScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { totalPoints, bestStreak, totalSessions, totalCorrect, totalQuestions, history } = useQuizStore();

  const [level, setLevel] = useState<QuizLevel>('beginner');
  const [scopeMode, setScopeMode] = useState<ScopeMode>('default');
  const [customJuzs, setCustomJuzs] = useState<number[]>([30]);
  // نوع الأسئلة: خوارزمية (افتراضي)، منسَّقة، أو خليط
  const [quizMode, setQuizMode] = useState<QuizMode>('algorithmic');

  const rank = useMemo(() => getRankForPoints(totalPoints), [totalPoints]);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const rankProgress = rank.nextAt ? Math.min(1, totalPoints / rank.nextAt) : 1;

  const resolveJuzs = (): number[] => {
    if (scopeMode === 'all')    return Array.from({ length: 30 }, (_, i) => i + 1);
    if (scopeMode === 'custom') return customJuzs.length > 0 ? customJuzs : defaultJuzsForLevel(level);
    return defaultJuzsForLevel(level);
  };

  const toggleJuz = (j: number) => {
    setCustomJuzs((prev) => (prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j].sort((a, b) => a - b)));
  };

  const handleStart = () => {
    const juzs = resolveJuzs();
    const questions = defaultQuestionsForLevel(level);
    router.push({
      pathname: '/quiz/session',
      params: {
        level,
        juzs: juzs.join(','),
        total: String(questions),
        mode: quizMode,
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('quiz.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('quiz.title')}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}>
        {/* بطاقة المرتبة - "Editorial Hero" */}
        <View style={{ position: 'relative' }}>
          {/* ظل ملوّن خلف البطاقة */}
          <View style={{
            position: 'absolute', top: 16, left: 12, right: 12, height: '100%',
            backgroundColor: '#7C3AED',
            opacity: 0.18, borderRadius: 28,
            transform: [{ scale: 0.96 }],
          }} />

          <LinearGradient
            colors={['#4C1D95', '#7C3AED', '#A78BFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard]}
          >
            {/* نقش هندسي خلفي - رصائع نجمية شفّافة */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {[...Array(6)].map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    top: 10 + (i * 40) % 200,
                    left: 20 + (i * 60) % 280,
                    width: 6, height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                  }}
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)' }} />
                  <Text style={[styles.heroEyebrow, { color: 'rgba(255,255,255,0.8)' }]}>{tr('quiz.yourRank')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <View style={styles.rankEmojiCircle}>
                    <Text style={{ fontSize: 32 }}>{rank.emoji}</Text>
                  </View>
                  <Text style={[styles.heroRank, { color: '#fff' }]}>{tr(rank.titleKey as any)}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.heroPoints, { color: '#fff' }]}>{arabicNumber(totalPoints)}</Text>
                <Text style={[styles.heroEyebrow, { color: 'rgba(255,255,255,0.9)' }]}>{tr('quiz.points')}</Text>
              </View>
            </View>

            {rank.nextAt ? (
              <View style={{ marginTop: 22 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>
                    {arabicNumber(totalPoints)} / {arabicNumber(rank.nextAt)}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>
                    {arabicNumber(Math.max(0, rank.nextAt - totalPoints))} {tr('quiz.toNextRank')}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${rankProgress * 100}%` }]} />
                </View>
              </View>
            ) : null}

            <View style={styles.heroStatsRow}>
              <MiniStat icon={<Flame size={14} color="#fff" />} label={tr('quiz.bestStreak')} value={arabicNumber(bestStreak)} />
              <View style={styles.heroStatDivider} />
              <MiniStat icon={<Trophy size={14} color="#fff" />} label={tr('quiz.sessions')} value={arabicNumber(totalSessions)} />
              <View style={styles.heroStatDivider} />
              <MiniStat icon={<Target size={14} color="#fff" />} label={tr('quiz.accuracy')} value={`${accuracy}%`} />
            </View>
          </LinearGradient>
        </View>

        {/* اختيار المستوى */}
        <Text variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>{tr('quiz.chooseLevel')}</Text>

        <View style={{ gap: 10 }}>
          <LevelCard
            id="beginner"
            active={level === 'beginner'}
            onPress={() => { setLevel('beginner'); setScopeMode('default'); setCustomJuzs(defaultJuzsForLevel('beginner')); }}
            accent="#10B981"
            title={tr('quiz.levelBeginner')}
            desc={tr('quiz.levelBeginnerDesc')}
            icon="🌱"
          />
          <LevelCard
            id="intermediate"
            active={level === 'intermediate'}
            onPress={() => { setLevel('intermediate'); setScopeMode('default'); setCustomJuzs(defaultJuzsForLevel('intermediate')); }}
            accent="#F59E0B"
            title={tr('quiz.levelIntermediate')}
            desc={tr('quiz.levelIntermediateDesc')}
            icon="⚡"
          />
          <LevelCard
            id="advanced"
            active={level === 'advanced'}
            onPress={() => { setLevel('advanced'); setScopeMode('default'); }}
            accent="#EF4444"
            title={tr('quiz.levelAdvanced')}
            desc={tr('quiz.levelAdvancedDesc')}
            icon="🔥"
          />
        </View>

        {/* اختيار الأجزاء */}
        <Text variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>{tr('quiz.chooseScope')}</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => setScopeMode('default')}
            style={[styles.scopeChip, { borderColor: scopeMode === 'default' ? t.colors.accent : t.colors.border, backgroundColor: scopeMode === 'default' ? t.colors.accent + '14' : 'transparent' }]}
          >
            <Text variant="caption" color={scopeMode === 'default' ? t.colors.accent : t.colors.textSecondary} style={{ fontWeight: '700' }}>
              {tr('quiz.scopeDefault')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setScopeMode('all')}
            style={[styles.scopeChip, { borderColor: scopeMode === 'all' ? t.colors.accent : t.colors.border, backgroundColor: scopeMode === 'all' ? t.colors.accent + '14' : 'transparent' }]}
          >
            <Text variant="caption" color={scopeMode === 'all' ? t.colors.accent : t.colors.textSecondary} style={{ fontWeight: '700' }}>
              {tr('quiz.scopeAll')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setScopeMode('custom')}
            style={[styles.scopeChip, { borderColor: scopeMode === 'custom' ? t.colors.accent : t.colors.border, backgroundColor: scopeMode === 'custom' ? t.colors.accent + '14' : 'transparent' }]}
          >
            <Text variant="caption" color={scopeMode === 'custom' ? t.colors.accent : t.colors.textSecondary} style={{ fontWeight: '700' }}>
              {tr('quiz.scopeCustom')}
            </Text>
          </Pressable>
        </View>

        {scopeMode === 'custom' ? (
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => {
                const selected = customJuzs.includes(j);
                return (
                  <Pressable
                    key={j}
                    onPress={() => toggleJuz(j)}
                    style={[
                      styles.juzChip,
                      {
                        borderColor: selected ? t.colors.accent : t.colors.border,
                        backgroundColor: selected ? t.colors.accent + '20' : 'transparent',
                      },
                    ]}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: selected ? t.colors.accent : t.colors.textSecondary,
                    }}>
                      {arabicNumber(j)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 10 }}>
              {customJuzs.length > 0
                ? `${arabicNumber(customJuzs.length)} ${tr('quiz.juz')} · ${arabicNumber(defaultQuestionsForLevel(level))} ${tr('quiz.questions')}`
                : 'اختر جزءاً واحداً على الأقل'}
            </Text>
          </View>
        ) : null}

        {/* 🎯 اختيار نوع الأسئلة */}
        <View style={{ marginTop: 18 }}>
          <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginBottom: 8, fontWeight: '700' }}>
            نوع الأسئلة:
          </Text>
          <View style={styles.scopeRow}>
            <Pressable
              onPress={() => setQuizMode('algorithmic')}
              style={[styles.scopeChip, {
                borderColor: quizMode === 'algorithmic' ? t.colors.accent : t.colors.border,
                backgroundColor: quizMode === 'algorithmic' ? t.colors.accent + '14' : 'transparent',
              }]}
            >
              <Text variant="caption" color={quizMode === 'algorithmic' ? t.colors.accent : t.colors.textSecondary} style={{ fontWeight: '700' }}>
                خوارزمية
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setQuizMode('curated')}
              style={[styles.scopeChip, {
                borderColor: quizMode === 'curated' ? t.colors.accent : t.colors.border,
                backgroundColor: quizMode === 'curated' ? t.colors.accent + '14' : 'transparent',
              }]}
            >
              <Text variant="caption" color={quizMode === 'curated' ? t.colors.accent : t.colors.textSecondary} style={{ fontWeight: '700' }}>
                ⭐ منسَّقة
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setQuizMode('mixed')}
              style={[styles.scopeChip, {
                borderColor: quizMode === 'mixed' ? t.colors.accent : t.colors.border,
                backgroundColor: quizMode === 'mixed' ? t.colors.accent + '14' : 'transparent',
              }]}
            >
              <Text variant="caption" color={quizMode === 'mixed' ? t.colors.accent : t.colors.textSecondary} style={{ fontWeight: '700' }}>
                خليط
              </Text>
            </Pressable>
          </View>
          <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 8 }}>
            {quizMode === 'algorithmic' && 'أسئلة مُولَّدة من الآيات والسور'}
            {quizMode === 'curated' && 'أسئلة منسَّقة من امتحانات حفظ معتمدة (5 خيارات)'}
            {quizMode === 'mixed' && 'خليط من الخوارزمية والمنسَّقة - تنوّع أكبر'}
          </Text>
        </View>

        {/* زر البدء */}
        <View style={{ marginTop: 22 }}>
          <Button
            label={tr('quiz.start')}
            iconLeft={<Sparkles size={18} color={t.colors.onPrimary} />}
            onPress={handleStart}
            disabled={scopeMode === 'custom' && customJuzs.length === 0}
            fullWidth
          />
        </View>

        {/* سجل الاختبارات */}
        <Text variant="h3" style={{ marginTop: 28, marginBottom: 12 }}>{tr('quiz.history')}</Text>

        {history.length === 0 ? (
          <Card padding={t.spacing.lg} elevation="xs" bordered style={{ alignItems: 'center' }}>
            <Award size={36} color={t.colors.accent} />
            <Text variant="subtitle" style={{ marginTop: 12 }}>{tr('quiz.noHistory')}</Text>
            <Text variant="caption" color={t.colors.textSecondary} align="center" style={{ marginTop: 4 }}>
              {tr('quiz.startFirst')}
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 8 }}>
            {history.slice(0, 10).map((entry) => {
              const levelLabel = entry.level === 'beginner' ? tr('quiz.levelBeginner') : entry.level === 'intermediate' ? tr('quiz.levelIntermediate') : tr('quiz.levelAdvanced');
              const acc = entry.totalQuestions > 0 ? Math.round((entry.correctCount / entry.totalQuestions) * 100) : 0;
              const passed = acc >= 60;
              return (
                <Card key={entry.id} padding={14} elevation="xs" bordered>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: passed ? t.colors.success + '20' : t.colors.error + '20',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {passed ? <CheckCircle2 size={18} color={t.colors.success} /> : <ChevronRight size={18} color={t.colors.error} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text variant="subtitle">{levelLabel}</Text>
                        <Text variant="caption" color={t.colors.textTertiary}>· {arabicNumber(entry.totalQuestions)} {tr('quiz.questions')}</Text>
                      </View>
                      <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                        {arabicNumber(entry.correctCount)}/{arabicNumber(entry.totalQuestions)} · {acc}% · +{arabicNumber(entry.points)} {tr('quiz.points')}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const MiniStat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {icon}
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.78)', letterSpacing: 1, fontWeight: '600' }}>{label}</Text>
    </View>
    <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 4, letterSpacing: -0.3 }}>{value}</Text>
  </View>
);

interface LevelCardProps {
  id: QuizLevel;
  active: boolean;
  accent: string;
  title: string;
  desc: string;
  icon: string;
  onPress: () => void;
}

const LevelCard: React.FC<LevelCardProps> = ({ active, accent, title, desc, icon, onPress }) => {
  const t = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        {
          padding: 18,
          borderRadius: 20,
          borderWidth: active ? 2 : StyleSheet.hairlineWidth,
          borderColor: active ? accent : t.colors.border,
          backgroundColor: active ? accent + '0E' : t.colors.surface,
          transform: [
            { scale: pressed ? 0.985 : (hovered && Platform.OS === 'web' ? 1.01 : 1) },
            { translateY: hovered && !pressed && Platform.OS === 'web' ? -2 : 0 },
          ],
          shadowColor: active ? accent : t.colors.shadowColor,
          shadowOffset: { width: 0, height: active || hovered ? 8 : 2 },
          shadowOpacity: active ? 0.20 : (hovered ? 0.08 : 0.04),
          shadowRadius: active ? 20 : (hovered ? 14 : 6),
          elevation: active ? 6 : (hovered ? 4 : 1),
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {/* أيقونة بـ glow عند active */}
        <View style={{
          width: 56, height: 56, borderRadius: 18,
          backgroundColor: active ? accent + '28' : accent + '14',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: active ? accent : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: active ? 0.4 : 0,
          shadowRadius: 8,
        }}>
          <Text style={{ fontSize: 26 }}>{icon}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 17,
            fontWeight: '800',
            color: active ? accent : t.colors.textPrimary,
            letterSpacing: -0.3,
          }}>
            {title}
          </Text>
          <Text style={{ fontSize: 13, color: t.colors.textSecondary, marginTop: 4 }}>
            {desc}
          </Text>
        </View>

        {/* مؤشر دائري الاختيار */}
        <View style={{
          width: 26, height: 26, borderRadius: 13,
          borderWidth: 2,
          borderColor: active ? accent : t.colors.borderStrong,
          backgroundColor: active ? accent : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {active ? (
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', lineHeight: 16 }}>✓</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  heroCard: {
    padding: 24,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 32,
    elevation: 10,
  },
  heroEyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  heroRank: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  heroPoints: { fontSize: 44, fontWeight: '300', letterSpacing: -1.5, lineHeight: 50 },

  rankEmojiCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  progressTrack: {
    height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#fff',
    borderRadius: 4,
  },

  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth, height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  scopeChip: {
    flex: 1, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: 999,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
  },

  juzChip: {
    width: 44, height: 44,
    borderWidth: 1, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
});
