/**
 * شاشة درس «مناعة إيمانية» — عرض أسئلة وأجوبة الدرس بشكل منظّم.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader, Button } from '@components/ui';
import { getManaaLesson, MANAA_LESSONS } from '@data/manaaEmaniyah';

export default function ManaaLesson() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getManaaLesson(id ?? '');

  if (!lesson) return null;

  const idx = MANAA_LESSONS.findIndex((l) => l.id === lesson.id);
  const next = MANAA_LESSONS[idx + 1];

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title="مناعة إيمانية" />

      <Text variant="caption" color={t.colors.accentDeep} style={{ fontWeight: '700' }}>
        {lesson.title}
      </Text>
      <Text variant="h1" style={{ marginTop: 4 }}>{lesson.topic}</Text>

      <View style={{ gap: t.spacing.md, marginTop: t.spacing.lg }}>
        {lesson.items.map((item, i) => (
          <Card key={i} padding={t.spacing.lg} elevation="xs" bordered>
            {/* السؤال */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.qBadge, { backgroundColor: t.colors.primary }]}>
                <Text variant="caption" color="#fff" style={{ fontWeight: '800' }}>س</Text>
              </View>
              <Text variant="subtitle" style={{ flex: 1, lineHeight: 26 }}>{item.q}</Text>
            </View>

            {/* الجواب */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={[styles.qBadge, { backgroundColor: t.colors.success }]}>
                <Text variant="caption" color="#fff" style={{ fontWeight: '800' }}>ج</Text>
              </View>
              <Text variant="body" color={t.colors.textSecondary} style={{ flex: 1, lineHeight: 28 }}>
                {item.a}
              </Text>
            </View>

            {/* الدليل */}
            {item.ref ? (
              <View style={[styles.refBox, { backgroundColor: t.colors.accent + '12', borderColor: t.colors.accent + '30' }]}>
                <BookOpen size={13} color={t.colors.accentDeep} />
                <Text variant="caption" color={t.colors.accentDeep} style={{ fontWeight: '700' }}>
                  الدليل: {item.ref}
                </Text>
              </View>
            ) : null}
          </Card>
        ))}
      </View>

      {next ? (
        <Button
          label={`الدرس التالي: ${next.title}`}
          variant="outline"
          fullWidth
          iconLeft={<ChevronLeft size={16} color={t.colors.primary} />}
          onPress={() => router.replace(`/manaa/${next.id}`)}
          style={{ marginTop: t.spacing.xl }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  qBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  refBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start',
  },
});
