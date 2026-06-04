/**
 * 🎁 Premium Gate — يلفّ المحتوى المدفوع ويعرض paywall لو المستخدم مش premium.
 *
 * استخدام:
 *   <PremiumGate feature="custom-themes">
 *     <CustomThemesScreen />
 *   </PremiumGate>
 *
 * لو المستخدم premium → يعرض children مباشرة.
 * لو لا → يعرض paywall بتصميم Nafahat (أخضر + ذهبي) مع زر "اشترك" + "لاحقاً".
 *
 * ملاحظة: الـ paywall feature_id بيتسجّل للـ analytics لتعرف أكتر features
 *  جذباً للترقية. زر "اشترك" دلوقتي بيعمل setPremium(true) كـ stub، لاحقاً
 *  هيـ integrate مع RevenueCat/Stripe.
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Sparkles, Check, X } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useSettingsStore } from '@store/index';
import { OrnamentalRule } from '@components/ornaments';

interface Props {
  feature: string;
  title?: string;
  description?: string;
  benefits?: string[];
  children: React.ReactNode;
  onSkip?: () => void;
}

export const PremiumGate: React.FC<Props> = ({
  feature,
  title = 'ترقية لـ نَفَحات Premium',
  description = 'افتح المميزات الكاملة وادعم تطوير التطبيق.',
  benefits = [
    'كل القرّاء (٢٤+ قارئ)',
    'كل التفاسير والترجمات',
    'تحميل غير محدود للاستماع بدون نت',
    'مزامنة سحابية عبر أجهزتك',
    'مظاهر مصحف حصرية',
    'بدون إعلانات للأبد',
  ],
  children,
  onSkip,
}) => {
  const t = useTheme();
  const isPremium = useSettingsStore((s) => s.isPremium);
  const setPremium = useSettingsStore((s) => s.setPremium);

  // 🆓 التطبيق مجاني بالكامل — لا يوجد paywall إطلاقاً، كل المميزات مفتوحة للجميع.
  return <>{children}</>;

  // 📊 telemetry hook لاحقاً
  // useEffect(() => { trackPaywallView(feature); }, [feature]);

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { backgroundColor: t.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.iconBox, { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent + '40' }]}>
        <Sparkles size={32} color={t.colors.accent} />
      </View>

      <Text style={[styles.title, { color: t.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: t.colors.textSecondary }]}>{description}</Text>

      <View style={{ marginVertical: 16 }}>
        <OrnamentalRule width={140} color={t.colors.accent} variant="rosette" />
      </View>

      {/* الفوائد */}
      <View style={[styles.benefitsBox, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
        {benefits.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <View style={[styles.checkCircle, { backgroundColor: t.colors.accent + '20', borderColor: t.colors.accent }]}>
              <Check size={12} color={t.colors.accent} />
            </View>
            <Text style={{ color: t.colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 }}>{b}</Text>
          </View>
        ))}
      </View>

      {/* السعر */}
      <View style={[styles.priceCard, { backgroundColor: t.colors.primary, borderColor: t.colors.accent }]}>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
          الباقة السنوية
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <Text style={{ color: '#FFF', fontSize: 30, fontWeight: '800' }}>$39.99</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>/سنة</Text>
        </View>
        <Text style={{ color: t.colors.accent, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
          توفير 33% مقارنة بالشهري · أقل من $4 شهرياً
        </Text>
      </View>

      <Pressable
        onPress={() => setPremium(true)}
        accessibilityRole="button"
        accessibilityLabel="اشترك الآن"
        style={({ pressed }) => [
          styles.subscribeBtn,
          { backgroundColor: t.colors.accent, borderColor: t.colors.accentDeep, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Sparkles size={16} color="#0A1815" />
        <Text style={{ color: '#0A1815', fontSize: 16, fontWeight: '800' }}>اشترك الآن</Text>
      </Pressable>

      <Pressable
        onPress={onSkip}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="لاحقاً"
        style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={{ color: t.colors.textTertiary, fontSize: 13, fontWeight: '600' }}>ربما لاحقاً</Text>
      </Pressable>

      <Text style={{ color: t.colors.textTertiary, fontSize: 10, textAlign: 'center', marginTop: 14, paddingHorizontal: 20 }}>
        يمكنك الإلغاء في أي وقت من إعدادات الحساب. الاشتراك يتجدّد تلقائياً ما لم يُلغَ قبل ٢٤ ساعة من انتهاء الفترة.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 56,
  },
  iconBox: {
    width: 80, height: 80,
    borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 340,
  },
  benefitsBox: {
    width: '100%',
    maxWidth: 380,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 22, height: 22,
    borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  priceCard: {
    width: '100%',
    maxWidth: 380,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 16,
    alignItems: 'center',
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 380,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 14,
  },
  skipBtn: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
