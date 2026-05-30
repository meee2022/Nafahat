/**
 * شاشة درس التجويد — تعرض صفحات الكتاب الأصلية (المرجع المعتمد) للدرس،
 * مع إمكانية التكبير ملء الشاشة، وزر تعليم الدرس كمكتمل.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Maximize2, X as XIcon, FileText } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, AppHeader, Button } from '@components/ui';
import { getTajweedLesson, TAJWEED_LESSONS } from '@data/tajweedBook';
import { TAJWEED_PAGE_IMAGES } from '@data/tajweedPages';
import { useTajweedStore } from '@store/index';

export default function TajweedLesson() {
  const t = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getTajweedLesson(id ?? '');
  const { isCompleted, completeLesson } = useTajweedStore();
  const [zoomPage, setZoomPage] = useState<number | null>(null);

  if (!lesson) return null;

  const completed = isCompleted(lesson.id);
  const idx = TAJWEED_LESSONS.findIndex((l) => l.id === lesson.id);
  const next = TAJWEED_LESSONS[idx + 1];
  // عرض الصورة بعرض الشاشة مع نسبة A4 تقريبية (1.41) كحدّ أدنى للارتفاع
  const imgW = Math.min(width - 32, 720);
  const imgH = imgW * 1.41;

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title="أحكام التجويد" />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: t.colors.accent + '1A' }}>
          <Text variant="label" color={t.colors.accentDeep}>{lesson.category}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <FileText size={12} color={t.colors.textTertiary} />
          <Text variant="caption" color={t.colors.textTertiary}>
            {lesson.pages.length > 1 ? `صفحات ${lesson.pages[0]}–${lesson.pages[lesson.pages.length - 1]}` : `صفحة ${lesson.pages[0]}`}
          </Text>
        </View>
        {completed ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: t.colors.success + '20' }}>
            <CheckCircle2 size={11} color={t.colors.success} />
            <Text variant="caption" color={t.colors.success} style={{ fontWeight: '700' }}>مكتمل</Text>
          </View>
        ) : null}
      </View>

      <Text variant="h1">{lesson.title}</Text>
      <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 6 }}>
        من كتاب «تيسير أحكام التجويد للمبتدئين» — اضغط على الصفحة لعرضها مكبّرة.
      </Text>

      {/* صفحات الكتاب الأصلية */}
      <View style={{ gap: 16, marginTop: t.spacing.lg, alignItems: 'center' }}>
        {lesson.pages.map((p) => (
          <Pressable
            key={p}
            onPress={() => setZoomPage(p)}
            style={({ pressed }) => [
              styles.pageWrap,
              { width: imgW, borderColor: t.colors.borderGold, opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <Image source={TAJWEED_PAGE_IMAGES[p]} style={{ width: imgW, height: imgH }} resizeMode="contain" />
            <View style={[styles.zoomBadge, { backgroundColor: t.colors.primary }]}>
              <Maximize2 size={13} color="#fff" />
            </View>
            <View style={[styles.pageNum, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
              <Text variant="caption" color="#fff">صفحة {p}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* تعليم كمكتمل */}
      <Button
        label={completed ? 'تم الإنهاء ✓' : 'أنهيت الدرس'}
        iconLeft={<CheckCircle2 size={16} color="#fff" />}
        variant="primary"
        fullWidth
        onPress={() => completeLesson(lesson.id)}
        disabled={completed}
        style={{ marginTop: t.spacing.xl }}
      />

      {next ? (
        <Button
          label={`الدرس التالي: ${next.title}`}
          variant="outline"
          fullWidth
          onPress={() => router.replace(`/tajweed/${next.id}`)}
          style={{ marginTop: 10 }}
        />
      ) : null}

      {/* عرض مكبّر ملء الشاشة مع تكبير/تحريك */}
      <Modal visible={zoomPage !== null} transparent animationType="fade" onRequestClose={() => setZoomPage(null)}>
        <View style={styles.modalBg}>
          <Pressable onPress={() => setZoomPage(null)} hitSlop={12} style={styles.modalClose}>
            <XIcon size={26} color="#fff" />
          </Pressable>
          {zoomPage !== null ? (
            <ScrollView
              maximumZoomScale={4}
              minimumZoomScale={1}
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <Image
                source={TAJWEED_PAGE_IMAGES[zoomPage]}
                style={{ width, height: width * 1.41 }}
                resizeMode="contain"
              />
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  zoomBadge: {
    position: 'absolute', top: 8, end: 8,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  pageNum: {
    position: 'absolute', bottom: 8, start: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  modalClose: {
    position: 'absolute', top: 44, end: 20, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
});
