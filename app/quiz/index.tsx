/**
 * شاشة الاختبارات الرئيسية - نسخة محسّنة:
 * ✅ ألوان هوية التطبيق (زمرد + ذهب)
 * ✅ اختيار عدد الأسئلة (5/10/15/20)
 * ✅ رسالة تحفيزية يومية
 * ✅ تاريخ في سجل الاختبارات
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Sparkles, Trophy, Flame, Target, Award, CheckCircle2, XCircle, Clock } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, Card, Button } from '@components/ui';
import { useQuizStore, getRankForPoints } from '@store/index';
import { defaultJuzsForLevel } from '@services/quiz';
import { QuizLevel } from '@/types/index';
import { useT } from '@store/languageStore';
import { arabicNumber } from '@data/surahs';
import { TOP_BAR_PAD } from '@utils/safeArea';

type ScopeMode = 'default' | 'custom' | 'all';
type QuizMode = 'algorithmic' | 'curated' | 'mixed';

const QUESTION_COUNTS = [5, 10, 15, 20];

export default function QuizHubScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { totalPoints, bestStreak, totalSessions, totalCorrect, totalQuestions, history } = useQuizStore();

  const [level, setLevel] = useState<QuizLevel>('beginner');
  const [scopeMode, setScopeMode] = useState<ScopeMode>('default');
  const [customJuzs, setCustomJuzs] = useState<number[]>([30]);
  const [quizMode, setQuizMode] = useState<QuizMode>('algorithmic');
  const [questionCount, setQuestionCount] = useState(10);

  const rank = useMemo(() => getRankForPoints(totalPoints), [totalPoints]);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const rankProgress = rank.nextAt ? Math.min(1, totalPoints / rank.nextAt) : 1;

  // رسالة تحفيزية بناءً على آخر جلسة
  const motivationMsg = useMemo(() => {
    if (history.length === 0) return 'ابدأ أول اختبار وابنِ مسيرة حفظك! 🌱';
    const lastSession = history[0];
    const daysSince = Math.floor((Date.now() - lastSession.startedAt) / 86400000);
    if (daysSince === 0) {
      const acc = lastSession.totalQuestions > 0
        ? Math.round((lastSession.correctCount / lastSession.totalQuestions) * 100)
        : 0;
      return acc >= 80 ? `أداء رائع اليوم! ${acc}% دقة — واصل! 🔥` : `اختبرت اليوم — حاول مرة أخرى لتُحسّن نتيجتك`;
    }
    if (daysSince === 1) return 'انقطعت أمس — اليوم فرصة لاستعادة سلسلتك! 💪';
    if (daysSince <= 3) return `${arabicNumber(daysSince)} أيام بدون اختبار — وقت المراجعة! 📖`;
    return `${arabicNumber(daysSince)} أيام مضت — عد وراجع حفظك اليوم`;
  }, [history]);

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
    router.push({
      pathname: '/quiz/session',
      params: {
        level,
        juzs: juzs.join(','),
        total: String(questionCount),
        mode: quizMode,
      },
    });
  };

  // Emerald + Gold brand colors
  const EMERALD  = '#0A3D38';
  const EMERALD2 = '#0F4A41';
  const GOLD     = '#B8923B';
  const GOLD2    = '#9C7A2D';

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>اختبر نفسك</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>اختبر حفظك</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 }}>

        {/* ── بطاقة الرتبة بألوان الهوية ── */}
        <View style={{ position: 'relative' }}>
          <View style={{
            position: 'absolute', top: 14, left: 10, right: 10, height: '100%',
            backgroundColor: EMERALD,
            opacity: 0.22, borderRadius: 28,
            transform: [{ scale: 0.96 }],
          }} />

          <LinearGradient
            colors={[EMERALD, EMERALD2, '#1B4039']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* نقوش هندسية شفافة */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {/* خط ذهبي علوي */}
              <View style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(184,146,59,0.3)' }} />
              {/* نقاط ذهبية */}
              {[...Array(5)].map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    top: 12 + (i * 45) % 180,
                    left: 16 + (i * 65) % 260,
                    width: 4, height: 4, borderRadius: 2,
                    backgroundColor: `rgba(184,146,59,${0.15 + (i % 3) * 0.08})`,
                  }}
                />
              ))}
              {/* خط ذهبي سفلي */}
              <View style={{ position: 'absolute', bottom: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(184,146,59,0.3)' }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: GOLD }} />
                  <Text style={[styles.heroEyebrow, { color: GOLD }]}>مرتبتك الحالية</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <View style={[styles.rankEmojiCircle, { borderColor: GOLD + '60', backgroundColor: 'rgba(184,146,59,0.15)' }]}>
                    <Text style={{ fontSize: 30 }}>{rank.emoji}</Text>
                  </View>
                  <Text style={[styles.heroRank, { color: '#fff' }]}>{tr(rank.titleKey as any)}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.heroPoints, { color: '#fff' }]}>{arabicNumber(totalPoints)}</Text>
                <Text style={[styles.heroEyebrow, { color: GOLD }]}>نقطة</Text>
              </View>
            </View>

            {rank.nextAt ? (
              <View style={{ marginTop: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                    {arabicNumber(totalPoints)} / {arabicNumber(rank.nextAt)}
                  </Text>
                  <Text style={{ fontSize: 11, color: GOLD, fontWeight: '600' }}>
                    {arabicNumber(Math.max(0, rank.nextAt - totalPoints))} للمرتبة التالية
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                  <View style={[styles.progressFill, { width: `${rankProgress * 100}%`, backgroundColor: GOLD }]} />
                </View>
              </View>
            ) : null}

            <View style={[styles.heroStatsRow, { borderTopColor: 'rgba(184,146,59,0.25)' }]}>
              <MiniStat icon={<Flame size={13} color={GOLD} />} label="أفضل سلسلة" value={arabicNumber(bestStreak)} gold={GOLD} />
              <View style={[styles.heroStatDivider, { backgroundColor: 'rgba(184,146,59,0.25)' }]} />
              <MiniStat icon={<Trophy size={13} color={GOLD} />} label="الجلسات" value={arabicNumber(totalSessions)} gold={GOLD} />
              <View style={[styles.heroStatDivider, { backgroundColor: 'rgba(184,146,59,0.25)' }]} />
              <MiniStat icon={<Target size={13} color={GOLD} />} label="الدقة" value={`${accuracy}%`} gold={GOLD} />
            </View>
          </LinearGradient>
        </View>

        {/* رسالة تحفيزية */}
        <View style={[styles.motivationBanner, { backgroundColor: t.colors.accent + '12', borderColor: t.colors.accent + '30' }]}>
          <Text style={{ fontSize: 13, color: t.colors.accentDeep, fontWeight: '600', textAlign: 'center' }}>
            {motivationMsg}
          </Text>
        </View>

        {/* ── اختيار المستوى ── */}
        <SectionTitle>المستوى</SectionTitle>
        <View style={{ gap: 10 }}>
          <LevelCard
            id="beginner"   active={level === 'beginner'}
            onPress={() => { setLevel('beginner'); setScopeMode('default'); setCustomJuzs(defaultJuzsForLevel('beginner')); }}
            accent="#3F8F6E" title="مبتدئ" desc="أسئلة سهلة من جزء عمّ وما يليه" icon="🌱"
          />
          <LevelCard
            id="intermediate" active={level === 'intermediate'}
            onPress={() => { setLevel('intermediate'); setScopeMode('default'); setCustomJuzs(defaultJuzsForLevel('intermediate')); }}
            accent={GOLD2} title="متوسط" desc="أسئلة على الآيات والسور من آخر 3 أجزاء" icon="⚡"
          />
          <LevelCard
            id="advanced" active={level === 'advanced'}
            onPress={() => { setLevel('advanced'); setScopeMode('default'); }}
            accent={EMERALD} title="متقدم" desc="تحدي شامل من كل القرآن الكريم" icon="🔥"
          />
        </View>

        {/* ── اختيار عدد الأسئلة ── */}
        <SectionTitle>عدد الأسئلة</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {QUESTION_COUNTS.map((n) => (
            <Pressable
              key={n}
              onPress={() => setQuestionCount(n)}
              style={[styles.countChip, {
                borderColor: questionCount === n ? t.colors.primary : t.colors.border,
                backgroundColor: questionCount === n ? t.colors.primary + '14' : t.colors.surface,
              }]}
            >
              <Text style={{ fontSize: 16, fontWeight: '800', color: questionCount === n ? t.colors.primary : t.colors.textSecondary }}>
                {arabicNumber(n)}
              </Text>
              {n === 5 && <Text style={{ fontSize: 9, color: t.colors.textTertiary, fontWeight: '600' }}>سريع</Text>}
              {n === 20 && <Text style={{ fontSize: 9, color: t.colors.textTertiary, fontWeight: '600' }}>تحدي</Text>}
            </Pressable>
          ))}
        </View>

        {/* ── اختيار النطاق ── */}
        <SectionTitle>النطاق</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['default', 'all', 'custom'] as ScopeMode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setScopeMode(m)}
              style={[styles.scopeChip, {
                borderColor: scopeMode === m ? t.colors.accent : t.colors.border,
                backgroundColor: scopeMode === m ? t.colors.accent + '14' : 'transparent',
              }]}
            >
              <Text variant="caption" color={scopeMode === m ? t.colors.accent : t.colors.textSecondary} style={{ fontWeight: '700' }}>
                {m === 'default' ? 'افتراضي' : m === 'all' ? 'كل القرآن' : 'مخصّص'}
              </Text>
            </Pressable>
          ))}
        </View>

        {scopeMode === 'custom' && (
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => {
                const selected = customJuzs.includes(j);
                return (
                  <Pressable
                    key={j}
                    onPress={() => toggleJuz(j)}
                    style={[styles.juzChip, {
                      borderColor: selected ? t.colors.accent : t.colors.border,
                      backgroundColor: selected ? t.colors.accent + '20' : 'transparent',
                    }]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: selected ? t.colors.accent : t.colors.textSecondary }}>
                      {arabicNumber(j)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {customJuzs.length === 0 && (
              <Text variant="caption" color={t.colors.error} style={{ marginTop: 8 }}>اختر جزءاً واحداً على الأقل</Text>
            )}
          </View>
        )}

        {/* ── نوع الأسئلة ── */}
        <SectionTitle>نوع الأسئلة</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([
            { id: 'algorithmic', label: '🧠 ذكية',  desc: 'تُولَّد تلقائياً من نصوص القرآن' },
            { id: 'curated',     label: '⭐ مختارة', desc: 'من امتحانات حفظ معتمدة' },
            { id: 'mixed',       label: '🎲 متنوعة', desc: 'مزيج من النوعين' },
          ] as const).map(({ id, label }) => (
            <Pressable
              key={id}
              onPress={() => setQuizMode(id)}
              style={[styles.scopeChip, {
                borderColor: quizMode === id ? t.colors.primary : t.colors.border,
                backgroundColor: quizMode === id ? t.colors.primary + '14' : 'transparent',
              }]}
            >
              <Text variant="caption" color={quizMode === id ? t.colors.primary : t.colors.textSecondary} style={{ fontWeight: '700' }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── زر البدء ── */}
        <View style={{ marginTop: 24 }}>
          <Button
            label={`ابدأ الاختبار · ${arabicNumber(questionCount)} أسئلة`}
            iconLeft={<Sparkles size={18} color={t.colors.onPrimary} />}
            onPress={handleStart}
            disabled={scopeMode === 'custom' && customJuzs.length === 0}
            fullWidth
          />
        </View>

        {/* ── سجل الاختبارات ── */}
        <SectionTitle>آخر الاختبارات</SectionTitle>

        {history.length === 0 ? (
          <Card padding={20} elevation="xs" bordered style={{ alignItems: 'center' }}>
            <Award size={36} color={t.colors.accent} />
            <Text variant="subtitle" style={{ marginTop: 12 }}>لا توجد اختبارات سابقة</Text>
            <Text variant="caption" color={t.colors.textSecondary} align="center" style={{ marginTop: 4 }}>
              ابدأ اختبارك الأول الآن!
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 8 }}>
            {history.slice(0, 10).map((entry) => {
              const levelLabel = entry.level === 'beginner' ? 'مبتدئ' : entry.level === 'intermediate' ? 'متوسط' : 'متقدم';
              const levelAccent = entry.level === 'beginner' ? '#3F8F6E' : entry.level === 'intermediate' ? GOLD2 : EMERALD;
              const acc = entry.totalQuestions > 0 ? Math.round((entry.correctCount / entry.totalQuestions) * 100) : 0;
              const passed = acc >= 60;
              const date = new Date(entry.startedAt);
              const dateStr = `${date.getDate()}/${date.getMonth() + 1} · ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
              return (
                <Card key={entry.id} padding={14} elevation="xs" bordered>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 38, height: 38, borderRadius: 19,
                      backgroundColor: passed ? '#3F8F6E20' : t.colors.error + '20',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {passed
                        ? <CheckCircle2 size={19} color="#3F8F6E" />
                        : <XCircle size={19} color={t.colors.error} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: levelAccent + '18' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: levelAccent }}>{levelLabel}</Text>
                        </View>
                        <Text variant="caption" color={t.colors.textTertiary}>{dateStr}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: passed ? '#3F8F6E' : t.colors.error }}>
                          {arabicNumber(acc)}%
                        </Text>
                        <Text variant="caption" color={t.colors.textTertiary}>
                          {arabicNumber(entry.correctCount)}/{arabicNumber(entry.totalQuestions)} · +{arabicNumber(entry.points)} نقطة
                        </Text>
                      </View>
                    </View>
                    {/* شريط الدقة */}
                    <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 36, height: 4, backgroundColor: t.colors.border, borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ width: `${acc}%`, height: '100%', backgroundColor: passed ? '#3F8F6E' : t.colors.error, borderRadius: 2 }} />
                      </View>
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

// ── مكونات مساعدة ──

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTheme();
  return (
    <Text style={{ fontSize: 13, fontWeight: '800', color: t.colors.textSecondary, letterSpacing: 1.5, marginTop: 22, marginBottom: 10, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
};

const MiniStat: React.FC<{ icon: React.ReactNode; label: string; value: string; gold: string }> = ({ icon, label, value, gold }) => (
  <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 6 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon}
      <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8, fontWeight: '600' }}>{label}</Text>
    </View>
    <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', marginTop: 3 }}>{value}</Text>
  </View>
);

interface LevelCardProps {
  id: QuizLevel; active: boolean; accent: string;
  title: string; desc: string; icon: string; onPress: () => void;
}

const LevelCard: React.FC<LevelCardProps> = ({ active, accent, title, desc, icon, onPress }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 16, borderRadius: 18,
        borderWidth: active ? 2 : 1,
        borderColor: active ? accent : t.colors.border,
        backgroundColor: active ? accent + '0D' : t.colors.surface,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        flexDirection: 'row', alignItems: 'center', gap: 14,
      })}
    >
      <View style={{
        width: 50, height: 50, borderRadius: 16,
        backgroundColor: active ? accent + '22' : accent + '12',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: active ? accent : t.colors.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 3 }}>{desc}</Text>
      </View>
      <View style={{
        width: 24, height: 24, borderRadius: 12,
        borderWidth: 2, borderColor: active ? accent : t.colors.borderStrong,
        backgroundColor: active ? accent : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {active && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>✓</Text>}
      </View>
    </Pressable>
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

  heroCard: {
    padding: 22, borderRadius: 26, overflow: 'hidden',
    shadowColor: '#0A3D38', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 28, elevation: 10,
  },
  heroEyebrow: { fontSize: 10, letterSpacing: 2.5, fontWeight: '700' },
  heroRank:    { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  heroPoints:  { fontSize: 40, fontWeight: '300', letterSpacing: -1.5, lineHeight: 46 },

  rankEmojiCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 4 },
  heroStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 18, paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  heroStatDivider: { width: StyleSheet.hairlineWidth, height: 28 },

  motivationBanner: {
    marginTop: 14, padding: 12, borderRadius: 12,
    borderWidth: 1,
  },

  countChip: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, gap: 2,
  },
  scopeChip: {
    flex: 1, paddingVertical: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: 999,
  },
  juzChip: {
    width: 42, height: 42, borderWidth: 1, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
});
