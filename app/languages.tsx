/**
 * شاشة اختيار اللغة - عرض الـ 10 لغات المدعومة + علم + اسم محلي + تأكيد.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, Globe } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui';
import { useLanguageStore, useT } from '@store/languageStore';
import { LANGUAGES, getLanguageCompleteness } from '@/i18n/index';
import { TOP_BAR_PAD } from '@utils/safeArea';

export default function LanguagesScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>اللغة</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('settings.language')}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 }}>
        {/* بطاقة معلوماتية */}
        <Card padding={t.spacing.lg} elevation="xs" bordered background={t.colors.accent + '10'}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Globe size={20} color={t.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.colors.textPrimary }}>
                نظام الترجمة الذكي
              </Text>
              <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                3 لغات كاملة (العربية، الإنجليزية، الفرنسية). للغات الأخرى:
                النصوص المُترجمة تظهر بلغتك، والباقي يرجع للإنجليزية تلقائياً.
              </Text>
            </View>
          </View>
        </Card>

        {/* قائمة اللغات */}
        <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>اختر لغتك</Text>
        <Card padding={0} elevation="xs" bordered>
          {LANGUAGES.map((l, i) => {
            const isActive = l.code === lang;
            const stats = getLanguageCompleteness(l.code);
            const isFull = stats.percent >= 95;
            const isMostly = stats.percent >= 50;
            const badgeColor = isFull ? t.colors.success : (isMostly ? t.colors.info : t.colors.warning);
            const badgeLabel = isFull ? 'كاملة' : `${stats.percent}%`;
            return (
              <Pressable
                key={l.code}
                onPress={() => setLang(l.code)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isActive
                      ? t.colors.primary + '12'
                      : (pressed ? t.colors.surfaceAlt : 'transparent'),
                    borderBottomWidth: i < LANGUAGES.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: t.colors.divider,
                  },
                ]}
              >
                <Text style={{ fontSize: 26, marginEnd: 14 }}>{l.flag}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: t.colors.textPrimary }}>
                      {l.nameNative}
                    </Text>
                    <View style={{
                      paddingHorizontal: 6, paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: badgeColor + '20',
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: badgeColor }}>
                        {badgeLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: t.colors.textTertiary, marginTop: 2 }}>
                    {l.nameEn}{l.rtl ? '  ·  RTL' : ''}
                    {!isFull ? `  ·  ${stats.translated}/${stats.total} نص` : ''}
                  </Text>
                </View>
                {isActive ? (
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: t.colors.primary,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={16} color={t.colors.onPrimary} strokeWidth={3} />
                  </View>
                ) : (
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    borderWidth: 2,
                    borderColor: t.colors.borderStrong,
                  }} />
                )}
              </Pressable>
            );
          })}
        </Card>

        {/* ملاحظة */}
        <Text style={{
          marginTop: 20,
          fontSize: 12,
          color: t.colors.textTertiary,
          textAlign: 'center',
          lineHeight: 18,
        }}>
          يتم تطبيق التغيير فوراً.{'\n'}
          الـ RTL/LTR يتبدّل تلقائياً بحسب اللغة المختارة.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: TOP_BAR_PAD, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 10 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
