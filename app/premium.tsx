/**
 * 💎 شاشة Premium — تستخدم PremiumGate لعرض الـ paywall أو التأكيد.
 *
 * - لو المستخدم Premium → يعرض حالة الاشتراك + الميزات المفعّلة + زر استرجاع
 * - لو لا → الـ PremiumGate يعرض الـ paywall (Subscribe / Skip)
 *
 * يصلها المستخدم من: Account → "اشترك في Premium" أو "Premium" badge
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Sparkles, Check, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { PremiumGate } from '@components/common';
import { useSettingsStore } from '@store/index';
import { restorePurchases } from '@services/premium';
import { TOP_BAR_PAD } from '@utils/safeArea';

const PREMIUM_FEATURES = [
  '٢٤ قارئ كامل بدون قيود',
  '١٧ ترجمة + ٥ تفاسير في كل وقت',
  'تحميل غير محدود للاستماع بدون نت',
  'مزامنة سحابية عبر أجهزتك',
  'مظاهر مصحف حصرية (ذهبي، فضّي، ليلي)',
  'مجلّدات مرجعيات بدون حدود',
  'تصدير + استيراد البيانات',
  'مقارنة التسميع المتقدّمة',
  'تذكيرات أذكار مخصّصة',
  'دعم فوري + ميزات قبل غيرك',
];

export default function PremiumScreen() {
  const t = useTheme();
  const router = useRouter();
  const isPremium = useSettingsStore((s) => s.isPremium);
  const setPremium = useSettingsStore((s) => s.setPremium);
  const [restoring, setRestoring] = React.useState(false);

  const handleRestore = async () => {
    setRestoring(true);
    const ok = await restorePurchases();
    setRestoring(false);
    if (ok) {
      Alert.alert('✓ تم الاسترجاع', 'تم تفعيل اشتراكك Premium.');
    } else {
      Alert.alert('لا توجد مشتريات', 'لم نعثر على اشتراك نشط على هذا الحساب.');
    }
  };

  // 🎁 لو المستخدم premium → اعرض حالة الاشتراك
  if (isPremium) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background }}>
        <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            style={[styles.iconBtn, { borderColor: t.colors.border }]}
          >
            <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>اشتراكك</Text>
            <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>نَفَحات Premium</Text>
          </View>
          <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[styles.activeBadge, { backgroundColor: t.colors.success + '14', borderColor: t.colors.success }]}>
            <Sparkles size={28} color={t.colors.success} />
            <Text style={{ color: t.colors.success, fontSize: 18, fontWeight: '800', marginTop: 6 }}>
              ✓ اشتراكك مفعّل
            </Text>
            <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 4, textAlign: 'center' }}>
              شكراً لدعمك تطوير نَفَحات. كل الميزات مفتوحة لك.
            </Text>
          </View>

          <View style={{ alignItems: 'center', marginVertical: 18 }}>
            <OrnamentalRule width={140} color={t.colors.accent} variant="rosette" />
          </View>

          <Card padding={t.spacing.lg} elevation="xs" bordered>
            <Text variant="subtitle" style={{ marginBottom: 12 }}>الميزات المفعّلة</Text>
            {PREMIUM_FEATURES.map((feat, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                <View style={[styles.checkDot, { backgroundColor: t.colors.success + '20', borderColor: t.colors.success }]}>
                  <Check size={11} color={t.colors.success} />
                </View>
                <Text variant="body" style={{ flex: 1 }}>{feat}</Text>
              </View>
            ))}
          </Card>

          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            accessibilityRole="button"
            accessibilityLabel="استرجاع المشتريات"
            style={({ pressed }) => [
              styles.restoreBtn,
              { borderColor: t.colors.border, opacity: pressed || restoring ? 0.7 : 1 },
            ]}
          >
            <RotateCcw size={14} color={t.colors.textSecondary} />
            <Text variant="bodySm" color={t.colors.textSecondary}>
              {restoring ? 'جاري...' : 'استرجاع المشتريات'}
            </Text>
          </Pressable>

          {/* dev-only: زر إلغاء التفعيل لاختبار حالة non-premium */}
          {__DEV__ ? (
            <Pressable
              onPress={() => setPremium(false)}
              style={({ pressed }) => [
                styles.restoreBtn,
                { borderColor: t.colors.error + '40', marginTop: 8, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text variant="caption" color={t.colors.error}>
                (dev) إلغاء Premium للاختبار
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  // 🚪 المستخدم non-premium → الـ paywall كامل عبر PremiumGate
  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold, backgroundColor: t.colors.background }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>الاشتراك</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>Premium</Text>
        </View>
        <Pressable
          onPress={handleRestore}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="استرجاع المشتريات"
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <RotateCcw size={16} color={t.colors.textSecondary} />
        </Pressable>
      </View>

      <PremiumGate
        feature="premium-screen"
        title="ارتقِ بتجربتك مع القرآن"
        description="اشتراك واحد يفتح كل المميزات ويدعم تطوير التطبيق."
        benefits={PREMIUM_FEATURES}
        onSkip={() => router.back()}
      >
        {/* لن يُعرض ما دام المستخدم non-premium */}
        <View />
      </PremiumGate>
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
  activeBadge: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  checkDot: {
    width: 20, height: 20,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
});
