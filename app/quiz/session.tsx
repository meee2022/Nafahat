/**
 * شاشة جلسة الاختبار — نسخة محسّنة:
 * ✅ مؤقت زمني (30 ثانية/سؤال) مع شريط تقدم لوني
 * ✅ Streak مرئي أثناء الجلسة
 * ✅ Haptic feedback عند الإجابة
 * ✅ عرض خاص لأسئلة ترتيب الآيات (كل خيار في بطاقة)
 * ✅ returnKeyType + onSubmitEditing لأسئلة الكتابة
 * ✅ شاشة ملخص تفصيلية بعد الانتهاء (الصحيح والخاطئ)
 * ✅ شاشة تحميل محسّنة مع تقدم مرئي
 * ✅ زر "بدء جديد" vs "العودة للقائمة" بوظيفتين مختلفتين
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TOP_BAR_PAD } from '@utils/safeArea';
import {
  View, StyleSheet, Pressable, ScrollView, ActivityIndicator,
  TextInput, Vibration, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight, Check, X, ChevronLeft, ChevronRight, Sparkles, Flame,
  Trophy, Target, Clock, AlertCircle, BookOpen, RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, Button } from '@components/ui';
import { generateQuiz, answersMatch, computeSessionStats } from '@services/quiz';
import { useQuizStore } from '@store/index';
import { QuizQuestion, QuizLevel, QuizAnswer } from '@/types/index';
import { arabicNumber, SURAHS } from '@data/surahs';

// ── ثوابت ──
const TIMER_SECONDS = 30;
const EMERALD = '#0A3D38';
const GOLD    = '#B8923B';

export default function QuizSessionScreen() {
  const t      = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ level: string; juzs: string; total: string; mode?: string }>();

  /** رجوع آمن: للخلف إن أمكن، وإلا إلى فهرس الاختبارات. */
  const goBackSafe = useCallback(() => {
    if (router.canGoBack?.()) router.back();
    else router.replace('/quiz');
  }, [router]);
  const recordSession = useQuizStore(s => s.recordSession);

  const level  = (params.level as QuizLevel) ?? 'beginner';
  const juzs   = (params.juzs ?? '').split(',').map(x => Number(x.trim())).filter(x => x >= 1 && x <= 30);
  const totalQ = Math.max(1, Math.min(30, Number(params.total) || 10));
  const mode   = (params.mode === 'curated' || params.mode === 'mixed') ? params.mode : 'algorithmic';

  // ── حالة التحميل ──
  const [questions,  setQuestions]  = useState<QuizQuestion[] | null>(null);
  const [loadError,  setLoadError]  = useState<string | null>(null);
  const [loadStage,  setLoadStage]  = useState('جارٍ تحضير الأسئلة...');

  // ── حالة الجلسة ──
  const [idx,            setIdx]            = useState(0);
  const [answers,        setAnswers]        = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [typedAnswer,    setTypedAnswer]    = useState('');
  const [revealed,       setRevealed]       = useState(false);
  const [finished,       setFinished]       = useState(false);

  // ── سلسلة الإجابات الصحيحة (streak) ──
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreakNow,  setBestStreakNow] = useState(0);

  // ── المؤقت ──
  const [timerLeft, setTimerLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startedAtRef      = useRef(Date.now());
  const questionStartRef  = useRef(Date.now());
  const inputRef          = useRef<TextInput>(null);

  // ── شاشة الملخص التفصيلية ──
  const [showSummary, setShowSummary] = useState(false);

  // ─── تحميل الأسئلة ───
  useEffect(() => {
    let mounted = true;
    setLoadStage('جارٍ تحميل آيات القرآن الكريم...');
    const timer = setTimeout(() => mounted && setLoadStage('جارٍ بناء الأسئلة...'), 1500);
    generateQuiz({ level, juzs, totalQuestions: totalQ, mode })
      .then(qs => {
        clearTimeout(timer);
        if (!mounted) return;
        if (qs.length === 0) {
          setLoadError('لا توجد أسئلة متاحة للنطاق المحدد.\nجرّب اختيار جزء أكبر أو مستوى مختلف.');
        } else {
          setQuestions(qs);
          questionStartRef.current = Date.now();
        }
      })
      .catch(() => mounted && setLoadError('تعذّر تحضير الأسئلة. تحقق من اتصالك بالإنترنت.'));
    return () => { mounted = false; clearTimeout(timer); };
  }, []);

  // ─── المؤقت الزمني ───
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimerLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimerLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          // انتهى الوقت — تسجيل إجابة خاطئة تلقائياً
          setAnswers(ans => {
            const next = [...ans];
            if (!next[idx]) {
              next[idx] = { questionId: '', correct: false, userAnswer: undefined, timeMs: TIMER_SECONDS * 1000 };
            }
            return next;
          });
          setRevealed(true);
          haptic('wrong');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [idx, stopTimer]);

  useEffect(() => {
    if (questions && !revealed && !finished) startTimer();
    return stopTimer;
  }, [idx, questions, finished]);

  useEffect(() => { if (revealed) stopTimer(); }, [revealed]);

  // ─── Haptic feedback ───
  function haptic(type: 'correct' | 'wrong') {
    if (Platform.OS === 'android') {
      Vibration.vibrate(type === 'correct' ? 40 : [0, 30, 50, 30]);
    }
  }

  // ─── شاشة التحميل ───
  if (loadError) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: t.colors.background, padding: 28 }]}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.colors.error + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertCircle size={36} color={t.colors.error} />
        </View>
        <Text variant="subtitle" align="center" style={{ marginBottom: 8 }}>تعذّر تحضير الأسئلة</Text>
        <Text variant="caption" color={t.colors.textSecondary} align="center" style={{ marginBottom: 24, lineHeight: 22 }}>
          {loadError}
        </Text>
        <View style={{ gap: 10, width: '100%' }}>
          <Button label="إعادة المحاولة" iconLeft={<RotateCcw size={16} color={t.colors.onPrimary} />} onPress={() => router.replace(`/quiz/session?level=${level}&juzs=${juzs.join(',')}&total=${totalQ}&mode=${mode}`)} fullWidth />
          <Button label="العودة للاختبارات" variant="outline" onPress={() => router.back()} fullWidth />
        </View>
      </View>
    );
  }

  if (!questions) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: t.colors.background }]}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: EMERALD + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <BookOpen size={38} color={EMERALD} />
        </View>
        <ActivityIndicator color={EMERALD} size="large" style={{ marginBottom: 16 }} />
        <Text variant="subtitle" style={{ color: EMERALD, fontWeight: '700' }}>جارٍ تحضير اختبارك</Text>
        <Text variant="caption" color={t.colors.textSecondary} align="center" style={{ marginTop: 8, maxWidth: 220, lineHeight: 22 }}>
          {loadStage}
        </Text>
      </View>
    );
  }

  // ─── شاشة الملخص التفصيلي ───
  if (showSummary) {
    const correctAnswers  = answers.filter(a => a.correct);
    const wrongAnswers    = answers.filter(a => !a.correct);
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background }}>
        <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
          <Pressable onPress={() => setShowSummary(false)} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
            <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: 16, color: t.colors.textPrimary }}>
            مراجعة الإجابات
          </Text>
          <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* ملخص سريع */}
          <View style={[styles.summaryTopRow, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <SummaryBadge value={arabicNumber(correctAnswers.length)} label="صحيحة" color="#3F8F6E" />
            <View style={{ width: 1, height: 40, backgroundColor: t.colors.border }} />
            <SummaryBadge value={arabicNumber(wrongAnswers.length)} label="خاطئة" color={t.colors.error} />
            <View style={{ width: 1, height: 40, backgroundColor: t.colors.border }} />
            <SummaryBadge
              value={questions.length > 0 ? `${Math.round((correctAnswers.length / questions.length) * 100)}%` : '0%'}
              label="الدقة" color={EMERALD}
            />
          </View>

          {/* الأسئلة الخاطئة أولاً */}
          {wrongAnswers.length > 0 && (
            <>
              <Text style={[styles.summarySection, { color: t.colors.error }]}>❌ الأسئلة التي أخطأت فيها</Text>
              {questions.map((q, i) => {
                if (answers[i]?.correct !== false) return null;
                return (
                  <ReviewCard
                    key={q.id}
                    question={q}
                    answer={answers[i]}
                    questionIndex={i}
                    isCorrect={false}
                    t={t}
                  />
                );
              })}
            </>
          )}

          {/* الأسئلة الصحيحة */}
          {correctAnswers.length > 0 && (
            <>
              <Text style={[styles.summarySection, { color: '#3F8F6E' }]}>✅ الأسئلة الصحيحة</Text>
              {questions.map((q, i) => {
                if (answers[i]?.correct !== true) return null;
                return (
                  <ReviewCard
                    key={q.id}
                    question={q}
                    answer={answers[i]}
                    questionIndex={i}
                    isCorrect={true}
                    t={t}
                  />
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ─── شاشة النتيجة النهائية ───
  if (finished) {
    const stats  = computeSessionStats(answers.map((a, i) => ({ correct: a.correct, questionPoints: questions[i]?.points ?? 10 })));
    const acc    = questions.length > 0 ? Math.round((stats.correctCount / questions.length) * 100) : 0;
    const passed = acc >= 60;

    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background }}>
        <LinearGradient
          colors={passed ? [EMERALD, '#0F4A41', '#1B4039'] : ['#5B21B6', '#7C3AED', '#4C1D95']}
          style={styles.finishHero}
        >
          {/* زر الرجوع */}
          <Pressable
            onPress={goBackSafe}
            hitSlop={12}
            style={[styles.finishBackBtn, { top: insets.top + 8 }]}
            accessibilityLabel="رجوع"
          >
            <ArrowRight size={20} color="#fff" strokeWidth={2} />
          </Pressable>

          {/* نقاط ذهبية زخرفية */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {[...Array(8)].map((_, i) => (
              <View key={i} style={{
                position: 'absolute',
                top: 20 + (i * 55) % 260,
                left: 10 + (i * 70) % 340,
                width: 4, height: 4, borderRadius: 2,
                backgroundColor: `rgba(184,146,59,${0.1 + (i % 4) * 0.07})`,
              }} />
            ))}
            <View style={{ position: 'absolute', top: 0, left: 30, right: 30, height: 1, backgroundColor: 'rgba(184,146,59,0.3)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 30, right: 30, height: 1, backgroundColor: 'rgba(184,146,59,0.3)' }} />
          </View>

          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(184,146,59,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD + '60' }}>
            {passed ? <Sparkles size={40} color={GOLD} /> : <Trophy size={40} color={GOLD} />}
          </View>

          <Text style={[styles.finishTitle, { color: '#fff', marginTop: 16 }]}>
            {passed ? 'أداء رائع! 🎉' : 'أحسنت المحاولة'}
          </Text>

          <Text style={[styles.finishBigPoints, { color: GOLD }]}>+{arabicNumber(stats.totalPoints)}</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 2, fontWeight: '700', marginTop: -6 }}>نقطة</Text>

          <View style={styles.finishStatsRow}>
            <FinishStat icon={<Check size={14} color={GOLD} />} label="الدقة"    value={`${acc}%`} gold={GOLD} />
            <View style={{ width: 1, height: 32, backgroundColor: 'rgba(184,146,59,0.3)' }} />
            <FinishStat icon={<Flame size={14} color={GOLD} />} label="أفضل سلسلة" value={arabicNumber(bestStreakNow)} gold={GOLD} />
            <View style={{ width: 1, height: 32, backgroundColor: 'rgba(184,146,59,0.3)' }} />
            <FinishStat icon={<Target size={14} color={GOLD} />} label="الإجابات" value={`${arabicNumber(stats.correctCount)}/${arabicNumber(questions.length)}`} gold={GOLD} />
          </View>
        </LinearGradient>

        <View style={{ padding: 20, gap: 10 }}>
          <Button
            label="مراجعة الإجابات"
            iconLeft={<BookOpen size={17} color={t.colors.onPrimary} />}
            onPress={() => setShowSummary(true)}
            fullWidth
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                label="اختبار جديد"
                iconLeft={<Sparkles size={16} color={EMERALD} />}
                variant="outline"
                onPress={() => router.replace('/quiz')}
                fullWidth
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="إعادة هذا الاختبار"
                iconLeft={<RotateCcw size={16} color={EMERALD} />}
                variant="outline"
                onPress={() => router.replace(`/quiz/session?level=${level}&juzs=${juzs.join(',')}&total=${totalQ}&mode=${mode}` as any)}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ─── حالة السؤال النشط ───
  const current  = questions[idx];
  const progress = (idx + (revealed ? 1 : 0)) / questions.length;
  const timerPct = timerLeft / TIMER_SECONDS;
  const timerColor = timerLeft <= 8 ? t.colors.error : timerLeft <= 15 ? '#F59E0B' : '#3F8F6E';
  const isArrange = current.kind === 'arrangeAyahs';
  const isTyping  = current.type === 'typing';

  const handleSelectOption = (i: number) => {
    if (revealed) return;
    setSelectedOption(i);
  };

  const handleCheck = () => {
    if (revealed) return;
    let correct = false;
    let userAnswer: string | number | undefined;

    if (isTyping) {
      if (!typedAnswer.trim()) return;
      userAnswer = typedAnswer.trim();
      correct = answersMatch(typedAnswer, current.correctAnswer ?? '');
    } else {
      if (selectedOption === null) return;
      userAnswer = selectedOption;
      correct = selectedOption === current.correctIndex;
    }

    haptic(correct ? 'correct' : 'wrong');

    const newStreak = correct ? currentStreak + 1 : 0;
    setCurrentStreak(newStreak);
    setBestStreakNow(prev => Math.max(prev, newStreak));

    const timeMs = Date.now() - questionStartRef.current;
    const newAnswer: QuizAnswer = { questionId: current.id, correct, userAnswer, timeMs };
    setAnswers(prev => { const n = [...prev]; n[idx] = newAnswer; return n; });
    setRevealed(true);
    stopTimer();
  };

  const restoreStateForIndex = (newIdx: number) => {
    const stored = answers[newIdx];
    if (stored) {
      setRevealed(true);
      if (typeof stored.userAnswer === 'number') { setSelectedOption(stored.userAnswer); setTypedAnswer(''); }
      else if (typeof stored.userAnswer === 'string') { setTypedAnswer(stored.userAnswer); setSelectedOption(null); }
      else { setSelectedOption(null); setTypedAnswer(''); }
    } else {
      setRevealed(false); setSelectedOption(null); setTypedAnswer('');
    }
    questionStartRef.current = Date.now();
  };

  const handleNext = () => {
    if (idx >= questions.length - 1) {
      const finalAnswers = answers.filter(Boolean);
      const stats = computeSessionStats(finalAnswers.map((a, i) => ({ correct: a.correct, questionPoints: questions[i]?.points ?? 10 })));
      recordSession(
        { startedAt: startedAtRef.current, finishedAt: Date.now(), level, juzs, correctCount: stats.correctCount, totalQuestions: questions.length, points: stats.totalPoints },
        stats.bestStreak,
      );
      setFinished(true);
      return;
    }
    const newIdx = idx + 1;
    setIdx(newIdx);
    restoreStateForIndex(newIdx);
  };

  const handlePrevious = () => {
    if (idx === 0) return;
    const newIdx = idx - 1;
    setIdx(newIdx);
    restoreStateForIndex(newIdx);
  };

  const renderOption = (option: string, i: number) => {
    const isSelected = selectedOption === i;
    const isCorrect  = revealed && i === current.correctIndex;
    const isWrong    = revealed && isSelected && i !== current.correctIndex;
    const isArabicQ  = ['nextAyah', 'previousAyah', 'completeVerse', 'verseBeginning', 'ayahEnding', 'firstAyahOfSurah', 'lastAyahOfSurah'].includes(current.kind);

    let borderColor = t.colors.border;
    let bgColor     = t.colors.surface;
    let textColor   = t.colors.textPrimary;
    if (isCorrect)        { borderColor = '#3F8F6E'; bgColor = '#3F8F6E14'; textColor = '#3F8F6E'; }
    else if (isWrong)     { borderColor = t.colors.error; bgColor = t.colors.error + '14'; textColor = t.colors.error; }
    else if (isSelected)  { borderColor = EMERALD; bgColor = EMERALD + '10'; }

    // ─── عرض خاص لأسئلة ترتيب الآيات ───
    if (isArrange) {
      const lines = option.split('\n');
      return (
        <Pressable
          key={i}
          onPress={() => handleSelectOption(i)}
          disabled={revealed}
          style={[styles.arrangeOptionBtn, { borderColor, backgroundColor: bgColor }]}
        >
          {lines.map((line, li) => (
            <View key={li} style={[styles.arrangeLineRow, li > 0 && { borderTopColor: borderColor + '40', borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: isCorrect ? '#3F8F6E' : isWrong ? t.colors.error : EMERALD, minWidth: 18 }}>
                {line.split('.')[0]}.
              </Text>
              <Text style={{ flex: 1, fontSize: 13, fontFamily: t.fontFamilies.arabicQuran, color: textColor, lineHeight: 26, textAlign: 'right' }}>
                {line.split('.').slice(1).join('.').trim()}
              </Text>
            </View>
          ))}
          {isCorrect && <Check size={16} color="#3F8F6E" style={{ alignSelf: 'flex-end', marginTop: 4 }} />}
          {isWrong   && <X    size={16} color={t.colors.error} style={{ alignSelf: 'flex-end', marginTop: 4 }} />}
        </Pressable>
      );
    }

    // ─── الخيارات العادية ───
    return (
      <Pressable
        key={i}
        onPress={() => handleSelectOption(i)}
        disabled={revealed}
        style={[styles.optionBtn, { borderColor, backgroundColor: bgColor }]}
      >
        <Text style={{
          flex: 1,
          fontSize: current.type === 'truefalse' ? 17 : 14,
          fontWeight: '600',
          color: textColor,
          textAlign: 'center',
          lineHeight: isArabicQ ? 34 : 22,
          fontFamily: isArabicQ ? t.fontFamilies.arabicQuran : undefined,
        }}>
          {option}
        </Text>
        {isCorrect && <Check size={18} color="#3F8F6E" />}
        {isWrong   && <X    size={18} color={t.colors.error} />}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>

      {/* ── الترويسة ── */}
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold, backgroundColor: t.colors.background }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>

        {/* شريط التقدم الرئيسي */}
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <View style={[styles.progressTrack, { backgroundColor: t.colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: EMERALD }]} />
          </View>
          <Text variant="caption" color={t.colors.textSecondary} align="center" style={{ marginTop: 4, fontSize: 11 }}>
            {arabicNumber(idx + 1)} / {arabicNumber(questions.length)}
          </Text>
        </View>

        {/* Streak + نقاط */}
        <View style={{ alignItems: 'center', gap: 2 }}>
          {currentStreak >= 2 && (
            <View style={[styles.streakBadge, { backgroundColor: GOLD + '20' }]}>
              <Flame size={11} color={GOLD} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: GOLD }}>{arabicNumber(currentStreak)}</Text>
            </View>
          )}
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.colors.textTertiary }}>
            +{arabicNumber(current.points)}
          </Text>
        </View>
      </View>

      {/* ── شريط المؤقت الفاخر المذهب ── */}
      {!revealed && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: 'rgba(10, 61, 56, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(184, 146, 59, 0.35)',
            borderRadius: 14
          }}>
            <Clock size={13} color={GOLD} />
            <View style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(184, 146, 59, 0.1)',
              flex: 1,
              overflow: 'hidden',
              borderWidth: 0.5,
              borderColor: 'rgba(184, 146, 59, 0.2)'
            }}>
              <View style={[styles.timerFill, { width: `${timerPct * 100}%`, backgroundColor: timerPct < 0.3 ? '#BE123C' : GOLD }]} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: timerPct < 0.3 ? '#BE123C' : GOLD, minWidth: 24, textAlign: 'center' }}>
              {arabicNumber(timerLeft)}ث
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── بطاقة السؤال ── */}
        <View style={[styles.questionCard, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
          {/* شريط الجزء والنوع */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={[styles.kindBadge, { backgroundColor: EMERALD + '12', borderColor: EMERALD + '30' }]}>
              <Text style={{ fontSize: 10, color: EMERALD, fontWeight: '800' }}>
                {kindLabel(current.kind)}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: GOLD, fontWeight: '700' }}>
              ◆ +{arabicNumber(current.points)} نقطة ◆
            </Text>
          </View>

          <Text style={{ fontSize: 16, fontWeight: '700', color: t.colors.textPrimary, textAlign: 'center', lineHeight: 28 }}>
            {current.prompt}
          </Text>

          {/* السياق (نص الآية) */}
          {current.context ? (
            <View style={[styles.contextBox, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.borderGold }]}>
              <Text style={{
                fontSize: current.kind === 'arrangeAyahs' ? 13 : 21,
                lineHeight: current.kind === 'arrangeAyahs' ? 24 : 42,
                textAlign: 'center',
                fontFamily: current.kind === 'arrangeAyahs' ? undefined : t.fontFamilies.arabicQuran,
                color: t.colors.textPrimary,
                fontWeight: '500',
              }}>
                {current.context}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── الخيارات ── */}
        {isTyping ? (
          <View style={{ marginTop: 16 }}>
            <TextInput
              ref={inputRef}
              value={typedAnswer}
              onChangeText={setTypedAnswer}
              editable={!revealed}
              placeholder="اكتب إجابتك هنا..."
              placeholderTextColor={t.colors.textTertiary}
              returnKeyType="done"
              onSubmitEditing={handleCheck}
              style={[styles.textInput, {
                borderColor: revealed
                  ? (answersMatch(typedAnswer, current.correctAnswer ?? '') ? '#3F8F6E' : t.colors.error)
                  : t.colors.border,
                color: t.colors.textPrimary,
                fontFamily: t.fontFamilies.arabicQuran,
                backgroundColor: t.colors.surface,
              }]}
            />
            {revealed && !answersMatch(typedAnswer, current.correctAnswer ?? '') && (
              <View style={[styles.correctAnswerBox, { backgroundColor: '#3F8F6E14', borderColor: '#3F8F6E40' }]}>
                <Text style={{ fontSize: 11, color: t.colors.textSecondary, fontWeight: '600' }}>الإجابة الصحيحة:</Text>
                <Text style={{ fontSize: 19, fontFamily: t.fontFamilies.arabicQuran, color: '#3F8F6E', marginTop: 4, textAlign: 'center' }}>
                  {current.correctAnswer}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: isArrange ? 8 : 8 }}>
            {current.options?.map((opt, i) => renderOption(opt, i))}
          </View>
        )}

        {/* ── لافتة التغذية الراجعة ── */}
        {revealed && (
          <View style={[styles.feedbackBox, {
            backgroundColor: (answers[idx]?.correct ? '#3F8F6E' : t.colors.error) + '12',
            borderColor:     answers[idx]?.correct ? '#3F8F6E40' : t.colors.error + '40',
          }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {answers[idx]?.correct
                ? <Check size={16} color="#3F8F6E" />
                : <X     size={16} color={t.colors.error} />}
              <Text style={{ fontWeight: '800', fontSize: 14, color: answers[idx]?.correct ? '#3F8F6E' : t.colors.error }}>
                {answers[idx]?.correct ? '✓ إجابة صحيحة!' : '✗ إجابة خاطئة'}
              </Text>
              {answers[idx]?.correct && currentStreak >= 3 && (
                <View style={[styles.streakBadge, { backgroundColor: GOLD + '20' }]}>
                  <Flame size={10} color={GOLD} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: GOLD }}>سلسلة {arabicNumber(currentStreak)}!</Text>
                </View>
              )}
            </View>
            {current.explanation ? (
              <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                {current.explanation}
              </Text>
            ) : null}
          </View>
        )}

        {/* ── أزرار التنقل ── */}
        <View style={{ marginTop: 14 }}>
          {!revealed ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {idx > 0 && (
                <Pressable onPress={handlePrevious} style={[styles.navBtn, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
                  <ChevronRight size={17} color={t.colors.textSecondary} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.textSecondary }}>السابق</Text>
                </Pressable>
              )}
              <View style={{ flex: 1 }}>
                <Button
                  label="تحقق من الإجابة"
                  onPress={handleCheck}
                  disabled={isTyping ? !typedAnswer.trim() : selectedOption === null}
                  fullWidth
                />
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {idx > 0 && (
                <Pressable onPress={handlePrevious} style={[styles.navBtn, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
                  <ChevronRight size={17} color={t.colors.textSecondary} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.textSecondary }}>السابق</Text>
                </Pressable>
              )}
              <View style={{ flex: 1 }}>
                <Button
                  label={idx >= questions.length - 1 ? 'انهِ الاختبار' : 'السؤال التالي'}
                  iconLeft={<ChevronLeft size={17} color={t.colors.onPrimary} />}
                  onPress={handleNext}
                  fullWidth
                />
              </View>
            </View>
          )}
        </View>

        {/* dots تقدم الأسئلة */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 18, flexWrap: 'wrap' }}>
          {questions.map((_, i) => {
            const done     = answers[i] !== undefined;
            const correct  = answers[i]?.correct;
            const isCurrent = i === idx;
            return (
              <View
                key={i}
                style={{
                  width: isCurrent ? 18 : 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: isCurrent
                    ? EMERALD
                    : done
                      ? (correct ? '#3F8F6E' : t.colors.error)
                      : t.colors.border,
                }}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ── تسمية نوع السؤال ──
function kindLabel(kind: string): string {
  const map: Record<string, string> = {
    whichSurah: 'تعرّف السورة', whichJuz: 'تعرّف الجزء',
    isFromSurah: 'صح/خطأ', ayahPosition: 'رقم الآية',
    nextAyah: 'الآية التالية', previousAyah: 'الآية السابقة',
    firstWordOfNext: 'أول كلمة', completeVerse: 'أكمل الآية',
    verseBeginning: 'بداية الآية', ayahEnding: 'نهاية الآية',
    typeNextWord: 'الكلمة التالية', fillBlank: 'أكمل الفراغ',
    meccanMedinan: 'مكية/مدنية', verseCount: 'عدد الآيات',
    surahBefore: 'السورة السابقة', surahAfter: 'السورة التالية',
    firstAyahOfSurah: 'أول آية', lastAyahOfSurah: 'آخر آية',
    surahOrder: 'ترتيب السورة', whichPage: 'رقم الصفحة',
    wordCountAyah: 'عدد الكلمات', arrangeAyahs: 'ترتيب الآيات',
    muqattaat: 'حروف مقطّعة', longestSurah: 'الأطول/الأقصر',
    pageCountSurah: 'صفحات السورة',
  };
  return map[kind] ?? kind;
}

// ── مكونات مساعدة ──

const FinishStat: React.FC<{ icon: React.ReactNode; label: string; value: string; gold: string }> = ({ icon, label, value, gold }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon}
      <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, fontWeight: '600' }}>{label}</Text>
    </View>
    <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 3 }}>{value}</Text>
  </View>
);

const SummaryBadge: React.FC<{ value: string; label: string; color: string }> = ({ value, label, color }) => (
  <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
    <Text style={{ fontSize: 24, fontWeight: '800', color }}>{value}</Text>
    <Text style={{ fontSize: 11, color: '#888', fontWeight: '600', marginTop: 2 }}>{label}</Text>
  </View>
);

const getSurahAndAyahFromQuestion = (q: QuizQuestion) => {
  if (q.kind === 'curated' && q.explanation) {
    const cleanExpl = q.explanation;
    for (const s of SURAHS) {
      if (cleanExpl.includes(s.nameAr)) {
        const match = cleanExpl.match(new RegExp(`${s.nameAr}\\s*:\\s*(\\d+)`)) || 
                      cleanExpl.match(new RegExp(`سورة\\s+${s.nameAr}\\s*:\\s*(\\d+)`)) || 
                      cleanExpl.match(new RegExp(`${s.nameAr}\\s+(\\d+)`));
        if (match) {
          return { surahId: s.id, ayahNumber: Number(match[1]) };
        }
      }
    }
  }

  const parts = q.id.split('-');
  if (parts[0] === 'q' && parts.length >= 3) {
    const surahId = Number(parts[1]);
    const ayahNumber = Number(parts[2]);
    if (!isNaN(surahId) && !isNaN(ayahNumber)) {
      return { surahId, ayahNumber };
    }
  }
  return null;
};

const ReviewCard: React.FC<{
  question: QuizQuestion; answer: QuizAnswer;
  questionIndex: number; isCorrect: boolean; t: any;
}> = ({ question, answer, questionIndex, isCorrect, t }) => {
  const router = useRouter();
  const surahAndAyah = getSurahAndAyahFromQuestion(question);

  return (
    <View style={[styles.reviewCard, {
      backgroundColor: isCorrect ? '#B8923B0A' : '#BE123C0A',
      borderColor: isCorrect ? '#B8923B30' : '#BE123C30',
    }]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: isCorrect ? '#B8923B18' : '#BE123C18', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
          {isCorrect ? <Check size={13} color="#B8923B" /> : <X size={13} color="#BE123C" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.colors.textSecondary, marginBottom: 4 }}>
            س{arabicNumber(questionIndex + 1)}: {kindLabel(question.kind)}
          </Text>
          <Text style={{ fontSize: 14, color: t.colors.textPrimary, fontWeight: '700', lineHeight: 22 }}>
            {question.prompt}
          </Text>
          {question.context && (
            <Text style={{
              fontSize: 18,
              color: t.colors.textPrimary,
              fontFamily: t.fontFamilies.arabicQuran,
              lineHeight: 32,
              marginTop: 6,
              padding: 10,
              backgroundColor: t.colors.surfaceAlt,
              borderRadius: 8,
              textAlign: 'center',
              borderWidth: 0.5,
              borderColor: t.colors.border
            }}>
              {question.context}
            </Text>
          )}
          {question.explanation && (
            <Text style={{ fontSize: 12, color: t.colors.textTertiary, marginTop: 6, lineHeight: 18, fontWeight: '600' }}>
              {question.explanation}
            </Text>
          )}
          
          {surahAndAyah && (
            <Pressable
              onPress={() => router.push(`/surah/${surahAndAyah.surahId}?ayah=${surahAndAyah.ayahNumber}`)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 10,
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#B8923B50',
                  backgroundColor: pressed ? 'rgba(184, 146, 59, 0.12)' : 'rgba(184, 146, 59, 0.04)',
                }
              ]}
            >
              <BookOpen size={12} color="#B8923B" />
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#B8923B' }}>تلاوة الآية في سياق السورة 📖</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: TOP_BAR_PAD, paddingBottom: 12,
    gap: 8, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  center:  { alignItems: 'center', justifyContent: 'center' },

  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },

  timerTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  timerFill:  { height: '100%', borderRadius: 3 },

  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },

  questionCard: {
    padding: 18, borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  kindBadge: {
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },

  contextBox: {
    marginTop: 14, padding: 14,
    borderWidth: 1, borderRadius: 12,
  },

  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 13,
    borderWidth: 1.5, borderRadius: 12,
  },

  arrangeOptionBtn: {
    padding: 12, borderWidth: 1.5, borderRadius: 14, gap: 4,
  },
  arrangeLineRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingVertical: 5,
  },

  navBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderRadius: 12,
    minWidth: 100, justifyContent: 'center',
  },

  textInput: {
    fontSize: 20, lineHeight: 32,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderRadius: 12,
    textAlign: 'center',
  },
  correctAnswerBox: {
    marginTop: 10, padding: 14, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },

  feedbackBox: {
    marginTop: 14, padding: 14,
    borderWidth: 1, borderRadius: 12,
  },

  finishHero: {
    paddingTop: 72, paddingBottom: 44,
    paddingHorizontal: 24, alignItems: 'center',
  },
  finishBackBtn: {
    position: 'absolute', start: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  finishTitle:      { fontSize: 26, fontWeight: '700' },
  finishBigPoints:  { fontSize: 58, fontWeight: '300', letterSpacing: -2, marginTop: 12 },
  finishStatsRow: {
    flexDirection: 'row', gap: 8,
    marginTop: 22, width: '100%',
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(184,146,59,0.3)',
  },

  summaryTopRow: {
    flexDirection: 'row', borderRadius: 16,
    borderWidth: 1, overflow: 'hidden', marginBottom: 8,
  },
  summarySection: {
    fontSize: 13, fontWeight: '800', marginVertical: 14,
    letterSpacing: 0.5,
  },
  reviewCard: {
    padding: 14, borderRadius: 14,
    borderWidth: 1, marginBottom: 8,
  },
});
