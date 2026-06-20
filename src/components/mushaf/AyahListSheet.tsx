/**
 * 📋 قائمة آيات الصفحة - bottom sheet للوصول السريع للتفسير.
 *
 * يعرض كل الآيات في الصفحة الحالية، والمستخدم يضغط على أي آية ليفتح
 * AyahDetailSheet (تفسير + ترجمة + مفضّلة + إشارة مرجعية).
 */
import React from 'react';
import { View, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { X, BookOpen } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { Ayah } from '@/types/index';
import { arabicNumber } from '@data/surahs';
import { AyahRosette } from './AyahRosette';

interface Props {
  visible: boolean;
  onClose: () => void;
  pageNumber: number;
  surahName: string;
  ayahs: Ayah[];
  onAyahPress: (ayahNumber: number) => void;
  quranFont: string;
}

export const AyahListSheet: React.FC<Props> = ({
  visible,
  onClose,
  pageNumber,
  surahName,
  ayahs,
  onAyahPress,
  quranFont,
}) => {
  const t = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      {/* الحاوية - View عادي (مش Pressable) لتجنّب nested buttons */}
      <View style={styles.overlay}>
        {/* الـ backdrop شقيق منفصل - Pressable يغلق عند الضغط */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="إغلاق"
        />
        {/* الـ sheet - View عادي عشان نقدر نضع Pressables بداخله بدون تداخل */}
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.colors.surface,
              borderTopColor: t.colors.accent,
            },
          ]}
        >
          {/* المقبض العلوي */}
          <View style={[styles.handle, { backgroundColor: t.colors.borderStrong }]} />

          {/* الهيدر */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: t.colors.accent + '20' }]}>
                <BookOpen size={18} color={t.colors.accent} strokeWidth={2} />
              </View>
              <View>
                <Text variant="subtitle" style={{ fontWeight: '800' }}>
                  آيات الصفحة {arabicNumber(pageNumber)}
                </Text>
                <Text variant="caption" color={t.colors.textSecondary} style={{ marginTop: 2 }}>
                  {surahName} · {arabicNumber(ayahs.length)} آية في الصفحة
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <X size={20} color={t.colors.textSecondary} />
            </Pressable>
          </View>

          {/* قائمة الآيات */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 14, gap: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {ayahs.map((ayah) => (
              <Pressable
                key={ayah.number}
                onPress={() => onAyahPress(ayah.number)}
                style={({ pressed }) => [
                  styles.ayahCard,
                  {
                    backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface,
                    borderColor: t.colors.borderGold,
                  },
                ]}
              >
                <View style={styles.ayahRow}>
                  <View style={styles.rosetteWrap}>
                    <AyahRosette
                      number={ayah.number}
                      size={38}
                      goldColor={t.colors.accent}
                      innerColor={t.colors.surface}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.ayahText,
                        {
                          fontFamily: quranFont,
                          color: t.colors.textPrimary,
                        },
                      ]}
                      numberOfLines={3}
                    >
                      {ayah.text}
                    </Text>
                    <View style={[styles.tapHint, { borderColor: t.colors.accent + '40' }]}>
                      <Text variant="caption" color={t.colors.accent} style={{ fontWeight: '700' }}>
                        اضغط للتفسير والإجراءات ←
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}

            {ayahs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodySm" color={t.colors.textTertiary} align="center">
                  لا توجد آيات في هذه الصفحة
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '78%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 3,
    paddingTop: 8,
  },
  handle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(184, 146, 59, 0.25)',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  ayahRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rosetteWrap: {
    width: 42,
    alignItems: 'center',
    paddingTop: 2,
  },
  ayahText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tapHint: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
});
