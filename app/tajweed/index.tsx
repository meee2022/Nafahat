/**
 * شاشة «أحكام التجويد» — مبنية بالكامل على كتاب
 * «تيسير أحكام التجويد للمبتدئين». قائمة دروس بترتيب الكتاب،
 * كل درس يعرض صفحاته الأصلية كمرجع معتمد.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, BookOpen, CheckCircle2, ChevronLeft, FileText } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader, ProgressBar } from '@components/ui';
import { TAJWEED_LESSONS, TAJWEED_CATEGORIES, TAJWEED_BOOK } from '@data/tajweedBook';
import { useTajweedStore } from '@store/index';

export default function TajweedScreen() {
  const t = useTheme();
  const router = useRouter();
  const { completedLessons, isCompleted, progressPercent } = useTajweedStore();

  const progress = progressPercent(TAJWEED_LESSONS.length) / 100;
  const completedCount = completedLessons.length;
  const totalCount = TAJWEED_LESSONS.length;

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title="أحكام التجويد" subtitle={TAJWEED_BOOK.subtitle} />

      {/* بطاقة الكتاب + التقدّم */}
      <LinearGradient colors={['#0A3D38', '#0F5C52']} style={[styles.heroCard, { borderRadius: t.radius.xl }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <GraduationCap size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h2" color="#fff">{TAJWEED_BOOK.bookTitle}</Text>
            <Text variant="bodySm" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
              {totalCount} درسًا · برواية حفص عن عاصم
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 16 }}>
          <ProgressBar value={progress} color="#fff" trackColor="rgba(255,255,255,0.2)" height={8} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text variant="caption" color="rgba(255,255,255,0.85)">{completedCount} من {totalCount} دروس</Text>
            <Text variant="caption" color="#fff">{Math.round(progress * 100)}%</Text>
          </View>
        </View>
      </LinearGradient>

      {/* الدروس مجمّعة بالفئات مع الحفاظ على ترتيب الكتاب */}
      {TAJWEED_CATEGORIES.map((cat) => {
        const lessons = TAJWEED_LESSONS.filter((l) => l.category === cat);
        if (lessons.length === 0) return null;
        return (
          <View key={cat} style={{ marginTop: t.spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: t.spacing.sm }}>
              <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: t.colors.accent }} />
              <Text variant="subtitle" color={t.colors.accentDeep}>{cat}</Text>
            </View>

            <View style={{ gap: t.spacing.sm }}>
              {lessons.map((lesson) => {
                const done = isCompleted(lesson.id);
                return (
                  <Card key={lesson.id} onPress={() => router.push(`/tajweed/${lesson.id}`)} padding={t.spacing.lg} elevation="xs">
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.lessonIcon, { backgroundColor: t.colors.accent + '1A' }]}>
                        {done ? <CheckCircle2 size={20} color={t.colors.success} /> : <BookOpen size={20} color={t.colors.accentDeep} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="subtitle">{lesson.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                          <FileText size={11} color={t.colors.textTertiary} />
                          <Text variant="caption" color={t.colors.textTertiary}>
                            {lesson.pages.length > 1
                              ? `صفحات ${lesson.pages[0]}–${lesson.pages[lesson.pages.length - 1]}`
                              : `صفحة ${lesson.pages[0]}`}
                          </Text>
                        </View>
                      </View>
                      <ChevronLeft size={18} color={t.colors.textTertiary} />
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        );
      })}

      <Text variant="caption" color={t.colors.textTertiary} style={{ textAlign: 'center', marginTop: t.spacing.xl }}>
        المحتوى من كتاب «{TAJWEED_BOOK.bookTitle}» — الصور المعروضة هي صفحات الكتاب الأصلية.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { padding: 20 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  lessonIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
