/**
 * 🎨 Tajweed Legend Sheet — bottom sheet يعرض قواعد التجويد + ألوانها.
 *
 * يفتح من الـ Mushaf reader عبر زر "أحكام التجويد". المستخدم يقدر:
 *  - يقرأ قواعد التجويد + ألوانها
 *  - يضغط على قاعدة لرؤية أمثلة في القرآن (روابط لآيات)
 *
 * V2: الـ overlay الفعلي على الكلمات في QPC مؤجّل (يحتاج text analysis
 *  دقيق لكل قاعدة). الـ Legend Sheet ميزة تعليمية قائمة بذاتها.
 *
 * Identity: أخضر primary + ذهبي accent.
 */
import React from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { X, ChevronLeft, Palette } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { TAJWEED_RULES, type TajweedRule } from '@data/tajweedRules';
import { arabicNumber, getSurahById } from '@data/surahs';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const TajweedLegendSheet: React.FC<Props> = ({ visible, onClose }) => {
  const t = useTheme();
  const router = useRouter();

  const handleExamplePress = (rule: TajweedRule, idx: number) => {
    const ex = rule.examples[idx];
    onClose();
    setTimeout(() => router.push(`/surah/${ex.surahId}?ayah=${ex.ayah}` as any), 200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Palette size={18} color={t.colors.accent} />
              <Text variant="h3">أحكام التجويد</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
            >
              <X size={20} color={t.colors.textSecondary} />
            </Pressable>
          </View>

          <Text variant="caption" color={t.colors.textSecondary} style={{ marginBottom: 12 }}>
            دليل بألوان أحكام التجويد المستخدمة في مصاحف مجمع الملك فهد.
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <OrnamentalRule width={120} color={t.colors.accent} variant="rosette" />
          </View>

          <ScrollView style={{ maxHeight: '80%' }} showsVerticalScrollIndicator={false}>
            {TAJWEED_RULES.map((rule) => (
              <View
                key={rule.id}
                style={[styles.ruleCard, { backgroundColor: t.colors.background, borderColor: t.colors.border }]}
              >
                <View style={styles.ruleHeader}>
                  <View style={[styles.colorSwatch, { backgroundColor: rule.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: t.colors.textPrimary }}>
                      {rule.nameAr}
                    </Text>
                    <Text variant="caption" color={t.colors.textTertiary}>
                      {rule.nameEn}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{ color: t.colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 }}
                >
                  {rule.description}
                </Text>
                {rule.examples.length > 0 ? (
                  <View style={styles.examplesRow}>
                    {rule.examples.map((ex, idx) => {
                      const surah = getSurahById(ex.surahId);
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => handleExamplePress(rule, idx)}
                          accessibilityRole="button"
                          accessibilityLabel={`اذهب إلى ${surah?.nameAr} الآية ${ex.ayah}`}
                          style={({ pressed }) => [
                            styles.exampleChip,
                            {
                              backgroundColor: rule.color + '14',
                              borderColor: rule.color + '40',
                              opacity: pressed ? 0.7 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={{ color: rule.color, fontSize: 11, fontWeight: '700' }}
                            numberOfLines={1}
                          >
                            {surah?.nameAr} {arabicNumber(ex.ayah)}
                          </Text>
                          <ChevronLeft size={11} color={rule.color} />
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '92%',
  },
  dragHandle: {
    alignSelf: 'center',
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ruleCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorSwatch: {
    width: 28, height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
});
