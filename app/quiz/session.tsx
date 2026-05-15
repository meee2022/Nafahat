/**
 * شاشة جلسة الاختبار - تعرض الأسئلة واحداً تلو الآخر وتجمع النقاط.
 *
 * تدفّق العمل:
 *  1. تستلم params من شاشة Hub (level, juzs, total)
 *  2. تحضّر الأسئلة عبر generateQuiz (يأخذ ثوانٍ معدودة لجلب نصوص الآيات)
 *  3. تعرض كل سؤال + تتلقى الإجابة + تظهر تغذية راجعة فورية
 *  4. عند انتهاء كل الأسئلة تعرض ملخّصاً وتحفظ في quizStore
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight, Check, X, ChevronLeft, Sparkles, Flame, Trophy, Target, Award, AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, Card, Button, ProgressBar } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { generateQuiz, answersMatch, computeSessionStats } from '@services/quiz';
import { useQuizStore } from '@store/index';
import { useT } from '@store/languageStore';
import { QuizQuestion, QuizLevel, QuizAnswer } from '@/types/index';
import { arabicNumber } from '@data/surahs';

export default function QuizSessionScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ level: string; juzs: string; total: string }>();
  const recordSession = useQuizStore((s) => s.recordSession);

  const level = (params.level as QuizLevel) ?? 'beginner';
  const juzs = useMemo(() => {
    if (!params.juzs) return [];
    return params.juzs.split(',').map((x) => Number(x.trim())).filter((x) => x >= 1 && x <= 30);
  }, [params.juzs]);
  const totalQuestions = Math.max(1, Math.min(30, Number(params.total) || 8));

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const startedAtRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());

  // تحضير الأسئلة عند التحميل
  useEffect(() => {
    let mounted = true;
    setQuestions(null);
    setLoadError(null);
    generateQuiz({ level, juzs, totalQuestions })
      .then((qs) => {
        if (!mounted) return;
        if (qs.length === 0) {
          setLoadError(tr('quiz.failedToLoad'));
        } else {
          setQuestions(qs);
          questionStartRef.current = Date.now();
        }
      })
      .catch(() => mounted && setLoadError(tr('quiz.failedToLoad')));
    return () => { mounted = false; };
  }, []);

  // ====== Loading state ======
  if (loadError) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: t.colors.background, padding: 24 }]}>
        <AlertCircle size={40} color={t.colors.error} />
        <Text variant="subtitle" style={{ marginTop: 14 }}>{tr('quiz.failedToLoad')}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Button label={tr('common.retry')} onPress={() => router.replace(`/quiz/session?level=${level}&juzs=${juzs.join(',')}&total=${totalQuestions}`)} />
          <Button label={tr('quiz.backToHub')} variant="outline" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  if (!questions) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: t.colors.background, padding: 24 }]}>
        <ActivityIndicator color={t.colors.accent} size="large" />
        <Text variant="subtitle" style={{ marginTop: 14 }}>{tr('quiz.preparing')}</Text>
        <Text variant="caption" color={t.colors.textSecondary} align="center" style={{ marginTop: 4 }}>
          {tr('quiz.preparingDesc')}
        </Text>
      </View>
    );
  }

  // ====== Finished state - summary screen ======
  if (finished) {
    const stats = computeSessionStats(answers.map((a, i) => ({ correct: a.correct, questionPoints: questions[i]?.points ?? 10 })));
    const acc = questions.length > 0 ? Math.round((stats.correctCount / questions.length) * 100) : 0;
    const passed = acc >= 60;

    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background }}>
        <LinearGradient
          colors={passed ? ['#10B981', '#059669', '#047857'] : ['#7C3AED', '#5B21B6', '#3730A3']}
          style={styles.finishHero}
        >
          {passed ? <Sparkles size={60} color="#fff" /> : <Trophy size={60} color="#fff" />}
          <Text style={[styles.finishTitle, { color: '#fff' }]}>
            {passed ? tr('quiz.greatWork') : tr('quiz.sessionComplete')}
          </Text>
          <View style={{ marginTop: 12 }}>
            <OrnamentalRule width={140} color="#fff" variant="rosette" />
          </View>
          <Text style={[styles.finishBigPoints, { color: '#fff' }]}>+{arabicNumber(stats.totalPoints)}</Text>
          <Text style={[styles.finishPointsLabel, { color: 'rgba(255,255,255,0.8)' }]}>{tr('quiz.points')}</Text>

          <View style={styles.finishStatsRow}>
            <FinishStat icon={<Check size={16} color="#fff" />} label={tr('quiz.accuracy')} value={`${acc}%`} />
            <FinishStat icon={<Flame size={16} color="#fff" />} label={tr('quiz.bestStreakInSession')} value={arabicNumber(stats.bestStreak)} />
            <FinishStat icon={<Target size={16} color="#fff" />} label={tr('quiz.questions')} value={`${arabicNumber(stats.correctCount)}/${arabicNumber(questions.length)}`} />
          </View>
        </LinearGradient>

        <View style={{ padding: 16, gap: 12 }}>
          <Button label={tr('quiz.startNew')} iconLeft={<Sparkles size={18} color={t.colors.onPrimary} />} onPress={() => router.replace('/quiz')} fullWidth />
          <Button label={tr('quiz.backToHub')} variant="outline" onPress={() => router.replace('/quiz')} fullWidth />
        </View>
      </View>
    );
  }

  // ====== Active question state ======
  const current = questions[idx];
  const progress = (idx + (revealed ? 1 : 0.5)) / questions.length;

  const handleSelectOption = (i: number) => {
    if (revealed) return;
    setSelectedOption(i);
  };

  const handleCheck = () => {
    if (revealed) return;
    let correct = false;
    let userAnswer: string | number | undefined;

    if (current.type === 'typing') {
      if (!typedAnswer.trim()) return;
      userAnswer = typedAnswer.trim();
      correct = answersMatch(typedAnswer, current.correctAnswer ?? '');
    } else {
      if (selectedOption === null) return;
      userAnswer = selectedOption;
      correct = selectedOption === current.correctIndex;
    }

    const timeMs = Date.now() - questionStartRef.current;
    setAnswers((prev) => [...prev, { questionId: current.id, correct, userAnswer, timeMs }]);
    setRevealed(true);
  };

  const handleNext = () => {
    if (idx >= questions.length - 1) {
      // إنهاء الجلسة وحفظها
      const finalAnswers: QuizAnswer[] = answers;
      const stats = computeSessionStats(finalAnswers.map((a, i) => ({ correct: a.correct, questionPoints: questions[i]?.points ?? 10 })));
      recordSession(
        {
          startedAt: startedAtRef.current,
          finishedAt: Date.now(),
          level,
          juzs,
          correctCount: stats.correctCount,
          totalQuestions: questions.length,
          points: stats.totalPoints,
        },
        stats.bestStreak,
      );
      setFinished(true);
      return;
    }
    setIdx((i) => i + 1);
    setSelectedOption(null);
    setTypedAnswer('');
    setRevealed(false);
    questionStartRef.current = Date.now();
  };

  const renderOption = (option: string, i: number) => {
    const isSelected = selectedOption === i;
    const isCorrect = revealed && i === current.correctIndex;
    const isWrong = revealed && isSelected && i !== current.correctIndex;

    let borderColor = t.colors.border;
    let bgColor = t.colors.surface;
    let textColor = t.colors.textPrimary;
    if (isCorrect)        { borderColor = t.colors.success; bgColor = t.colors.success + '14'; textColor = t.colors.success; }
    else if (isWrong)     { borderColor = t.colors.error;   bgColor = t.colors.error + '14';   textColor = t.colors.error; }
    else if (isSelected)  { borderColor = t.colors.accent;  bgColor = t.colors.accent + '14'; }

    return (
      <Pressable
        key={i}
        onPress={() => handleSelectOption(i)}
        disabled={revealed}
        style={[styles.optionBtn, { borderColor, backgroundColor: bgColor }]}
      >
        <Text style={{
          flex: 1,
          fontSize: current.type === 'truefalse' ? 18 : 16,
          fontWeight: '600',
          color: textColor,
          textAlign: 'center',
          fontFamily: current.kind === 'nextAyah' || current.kind === 'completeVerse' ? t.fontFamilies.arabicQuran : undefined,
        }}>
          {option}
        </Text>
        {isCorrect ? <Check size={20} color={t.colors.success} /> : null}
        {isWrong   ? <X size={20} color={t.colors.error} /> : null}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {/* الترويسة + شريط التقدّم */}
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <ProgressBar value={progress} color={t.colors.accent} height={8} />
          <Text variant="caption" color={t.colors.textSecondary} align="center" style={{ marginTop: 4 }}>
            {tr('quiz.question')} {arabicNumber(idx + 1)} {tr('quiz.of')} {arabicNumber(questions.length)}
          </Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {/* السؤال */}
        <Card padding={t.spacing.lg} elevation="sm" bordered>
          <Text variant="caption" color={t.colors.accent} style={{ letterSpacing: 2, fontWeight: '700' }}>
            ◇  +{arabicNumber(current.points)} {tr('quiz.points')}  ◇
          </Text>
          <Text variant="subtitle" align="center" style={{ marginTop: 10, lineHeight: 28 }}>
            {current.prompt}
          </Text>

          {/* السياق (نص الآية إن وُجدت) */}
          {current.context ? (
            <View style={[styles.contextBox, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.borderGold }]}>
              <Text
                style={{
                  fontSize: 22,
                  lineHeight: 44,
                  textAlign: 'center',
                  fontFamily: t.fontFamilies.arabicQuran,
                  color: t.colors.textPrimary,
                  fontWeight: '500',
                }}
              >
                {current.context}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* الخيارات */}
        {current.type === 'typing' ? (
          <View style={{ marginTop: 18 }}>
            <TextInput
              value={typedAnswer}
              onChangeText={setTypedAnswer}
              editable={!revealed}
              placeholder={tr('quiz.typeAnswer')}
              placeholderTextColor={t.colors.textTertiary}
              style={[
                styles.textInput,
                {
                  borderColor: revealed
                    ? (answersMatch(typedAnswer, current.correctAnswer ?? '') ? t.colors.success : t.colors.error)
                    : t.colors.border,
                  color: t.colors.textPrimary,
                  fontFamily: t.fontFamilies.arabicQuran,
                  textAlign: 'center',
                },
              ]}
            />
          </View>
        ) : (
          <View style={{ marginTop: 14, gap: 10 }}>
            {current.options?.map((opt, i) => renderOption(opt, i))}
          </View>
        )}

        {/* لافتة الإجابة */}
        {revealed ? (
          <View style={[styles.feedbackBox, {
            backgroundColor: (answers[answers.length - 1]?.correct ? t.colors.success : t.colors.error) + '14',
            borderColor: answers[answers.length - 1]?.correct ? t.colors.success : t.colors.error,
          }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {answers[answers.length - 1]?.correct ? (
                <Check size={18} color={t.colors.success} />
              ) : (
                <X size={18} color={t.colors.error} />
              )}
              <Text variant="subtitle" color={answers[answers.length - 1]?.correct ? t.colors.success : t.colors.error}>
                {answers[answers.length - 1]?.correct ? tr('quiz.correct') : tr('quiz.wrong')}
              </Text>
            </View>
            {!answers[answers.length - 1]?.correct && current.type === 'typing' ? (
              <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 6 }}>
                {tr('quiz.correctAnswer')} {current.correctAnswer}
              </Text>
            ) : null}
            {current.explanation ? (
              <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 6 }}>
                {current.explanation}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* زر تحقّق / التالي */}
        <View style={{ marginTop: 18 }}>
          {!revealed ? (
            <Button
              label={tr('quiz.checkAnswer')}
              onPress={handleCheck}
              disabled={current.type === 'typing' ? !typedAnswer.trim() : selectedOption === null}
              fullWidth
            />
          ) : (
            <Button
              label={idx >= questions.length - 1 ? tr('quiz.finish') : tr('quiz.next')}
              iconLeft={<ChevronLeft size={18} color={t.colors.onPrimary} />}
              onPress={handleNext}
              fullWidth
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const FinishStat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon}
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 1 }}>{label}</Text>
    </View>
    <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 4 }}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  center: { alignItems: 'center', justifyContent: 'center' },

  contextBox: {
    marginTop: 14, padding: 16,
    borderWidth: 1, borderRadius: 8,
  },

  optionBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderRadius: 8,
  },

  textInput: {
    fontSize: 22, lineHeight: 32,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderRadius: 8,
  },

  feedbackBox: {
    marginTop: 16, padding: 14,
    borderWidth: 1, borderRadius: 8,
  },

  finishHero: {
    paddingTop: 80, paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  finishTitle: { fontSize: 28, fontWeight: '700', marginTop: 16 },
  finishBigPoints: { fontSize: 64, fontWeight: '300', marginTop: 14, letterSpacing: -2 },
  finishPointsLabel: { fontSize: 12, letterSpacing: 3, fontWeight: '700', marginTop: -4 },

  finishStatsRow: {
    flexDirection: 'row', gap: 12,
    marginTop: 24,
    width: '100%',
  },
});
