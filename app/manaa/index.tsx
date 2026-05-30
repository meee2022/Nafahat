/**
 * شاشة «مناعة إيمانية» — قائمة الدروس (سؤال وجواب).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ChevronLeft, HelpCircle } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, AppHeader } from '@components/ui';
import { MANAA_LESSONS, MANAA_BOOK } from '@data/manaaEmaniyah';

export default function ManaaScreen() {
  const t = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <AppHeader onBack={() => router.back()} title={MANAA_BOOK.title} subtitle={MANAA_BOOK.subtitle} />

      <LinearGradient colors={['#1B4D3E', '#2E7D5B']} style={[styles.heroCard, { borderRadius: t.radius.xl }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <ShieldCheck size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h2" color="#fff">مناعة إيمانية</Text>
            <Text variant="bodySm" color="rgba(255,255,255,0.88)" style={{ marginTop: 2 }}>
              {MANAA_LESSONS.length} من {MANAA_BOOK.lessonsCount} درسًا · سؤال وجواب
            </Text>
          </View>
        </View>
        <Text variant="bodySm" color="rgba(255,255,255,0.85)" style={{ marginTop: 14, lineHeight: 22 }}>
          دروس تبني الحصانة الإيمانية بأسلوب مبسّط من السؤال والجواب، مدعومة بأدلّة القرآن.
        </Text>
      </LinearGradient>

      <View style={{ gap: t.spacing.sm, marginTop: t.spacing.xl }}>
        {MANAA_LESSONS.map((lesson) => (
          <Card key={lesson.id} onPress={() => router.push(`/manaa/${lesson.id}`)} padding={t.spacing.lg} elevation="xs">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.numCircle, { backgroundColor: t.colors.primary + '14' }]}>
                <Text variant="subtitle" color={t.colors.primary}>{lesson.order}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="subtitle">{lesson.title}</Text>
                <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 2 }} numberOfLines={1}>
                  {lesson.topic}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <HelpCircle size={11} color={t.colors.textTertiary} />
                  <Text variant="caption" color={t.colors.textTertiary}>{lesson.items.length} أسئلة</Text>
                </View>
              </View>
              <ChevronLeft size={18} color={t.colors.textTertiary} />
            </View>
          </Card>
        ))}
      </View>

      <Text variant="caption" color={t.colors.textTertiary} style={{ textAlign: 'center', marginTop: t.spacing.xl }}>
        المحتوى من كتاب «مناعة إيمانية» — منهج سؤال وجواب لطلاب مدارس القرآن.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { padding: 20 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
