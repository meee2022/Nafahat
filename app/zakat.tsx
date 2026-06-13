/**
 * شاشة حاسبة الزكاة - حاسبة تفاعلية.
 * النصاب الأساسي: قيمة 85 جراماً من الذهب (يتغيّر بسعر السوق - نستخدم تقريباً).
 * المعدّل: 2.5% من المال البالغ النصاب بعد مرور حول كامل.
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { ArrowRight, Coins, Info, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card, Button } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { arabicNumber } from '@data/surahs';
import { useT } from '@store/languageStore';
import { TOP_BAR_PAD } from '@utils/safeArea';

// نصاب الذهب التقريبي بالدولار (85 جرام × ~70$)
const NISAB_USD = 5950;
const ZAKAT_RATE = 0.025;

interface Field {
  key: string;
  label: string;
  hint: string;
  value: string;
}

const INITIAL_FIELDS: Field[] = [
  { key: 'cash',       label: 'نقد وحسابات بنكية',   hint: 'المبلغ المتوفّر منذ سنة كاملة', value: '' },
  { key: 'gold',       label: 'قيمة الذهب والفضة',    hint: 'القيمة السوقية حالياً',         value: '' },
  { key: 'invest',     label: 'استثمارات وأسهم',      hint: 'قيمة الأسهم والصناديق',         value: '' },
  { key: 'commerce',   label: 'بضاعة تجارية',         hint: 'قيمة البضائع المعدّة للبيع',     value: '' },
  { key: 'debt',       label: 'ديون لك على الآخرين',  hint: 'الديون التي تتوقّع استرجاعها',   value: '' },
  { key: 'owed',       label: 'ديون عليك (يُخصم)',    hint: 'الديون الواجبة عليك',           value: '' },
];

export default function ZakatScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>(INITIAL_FIELDS);

  const calculation = useMemo(() => {
    const get = (key: string) => Number(fields.find((f) => f.key === key)?.value || 0);
    const assets = get('cash') + get('gold') + get('invest') + get('commerce') + get('debt');
    const debt = get('owed');
    const taxable = Math.max(0, assets - debt);
    const reachedNisab = taxable >= NISAB_USD;
    const zakat = reachedNisab ? taxable * ZAKAT_RATE : 0;
    return { assets, debt, taxable, reachedNisab, zakat };
  }, [fields]);

  const handleChange = (key: string, value: string) => {
    // إبقاء الأرقام فقط
    const clean = value.replace(/[^0-9.]/g, '');
    setFields((arr) => arr.map((f) => (f.key === key ? { ...f, value: clean } : f)));
  };

  const handleReset = () => setFields(INITIAL_FIELDS);

  const formatMoney = (n: number) => {
    if (n === 0) return '0';
    return n.toLocaleString('ar-EG', { maximumFractionDigits: 2 });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={t.hitSlop} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('zakat.subtitle')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('zakat.title')}</Text>
        </View>
        <Pressable onPress={handleReset} hitSlop={t.hitSlop} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <RefreshCw size={16} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16, paddingTop: 18 }}>
        {/* النتيجة في الأعلى */}
        <Card padding={t.spacing.xl} elevation="sm" bordered background={calculation.zakat > 0 ? t.colors.accent + '14' : t.colors.surface}>
          <View style={{ alignItems: 'center' }}>
            <Svg width={56} height={56} viewBox="0 0 100 100" style={{ marginBottom: 10 }}>
              <Path
                d="M50,8 L58,32 L82,32 L62,48 L70,72 L50,58 L30,72 L38,48 L18,32 L42,32 Z"
                fill={t.colors.accent} opacity="0.18"
              />
              <Circle cx="50" cy="50" r="22" fill={t.colors.accent} />
              <Circle cx="50" cy="50" r="18" fill="none" stroke={t.colors.surface} strokeWidth="1" />
              <Text>﷼</Text>
            </Svg>

            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>الزكاة المستحقّة</Text>
            <Text style={[styles.bigAmount, { color: t.colors.textPrimary }]}>
              {formatMoney(calculation.zakat)}<Text style={{ fontSize: 18, color: t.colors.textTertiary }}> $</Text>
            </Text>
            <OrnamentalRule width={160} color={t.colors.accent} variant="rosette" />

            <View style={[styles.statusPill, { borderColor: calculation.reachedNisab ? t.colors.success : t.colors.warning, backgroundColor: (calculation.reachedNisab ? t.colors.success : t.colors.warning) + '14' }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: calculation.reachedNisab ? t.colors.success : t.colors.warning }}>
                {calculation.reachedNisab ? '◇ بلغت النصاب ◇' : '◇ لم تبلغ النصاب ◇'}
              </Text>
            </View>
          </View>
        </Card>

        {/* ملخص */}
        <View style={[styles.summaryRow, { marginTop: 18, gap: 10 }]}>
          <SummaryBox label="الأصول" value={formatMoney(calculation.assets)} color={t.colors.success} />
          <SummaryBox label="الديون" value={formatMoney(calculation.debt)} color={t.colors.error} />
          <SummaryBox label="الوعاء" value={formatMoney(calculation.taxable)} color={t.colors.primary} />
        </View>

        {/* الحقول */}
        <View style={{ marginTop: 24, gap: 12 }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent, marginBottom: 4 }]}>أدخل مالك بالدولار</Text>
          {fields.map((f) => (
            <Card key={f.key} padding={t.spacing.md} elevation="xs" bordered>
              <Text variant="label" style={{ fontWeight: '700' }}>{f.label}</Text>
              <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 2 }}>{f.hint}</Text>
              <View style={[styles.inputWrap, { borderColor: t.colors.border, marginTop: 8 }]}>
                <TextInput
                  value={f.value}
                  onChangeText={(v) => handleChange(f.key, v)}
                  placeholder="0"
                  placeholderTextColor={t.colors.textTertiary}
                  keyboardType="numeric"
                  style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 17, fontWeight: '600' }}
                />
                <Text variant="bodySm" color={t.colors.textTertiary} style={{ marginStart: 8 }}>$</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* معلومات */}
        <Card padding={t.spacing.lg} elevation="xs" style={{ marginTop: 18 }} bordered>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Info size={14} color={t.colors.info} />
            <Text variant="label" color={t.colors.info}>ملاحظات شرعية</Text>
          </View>
          <Text variant="bodySm" color={t.colors.textSecondary} style={{ lineHeight: 22 }}>
            • النصاب: ما يعادل قيمة 85 جراماً من الذهب (~{arabicNumber(NISAB_USD)} دولار).
          </Text>
          <Text variant="bodySm" color={t.colors.textSecondary} style={{ lineHeight: 22 }}>
            • المعدّل: 2.5% من المال البالغ النصاب بعد حولان الحول.
          </Text>
          <Text variant="bodySm" color={t.colors.textSecondary} style={{ lineHeight: 22 }}>
            • تُحسب الزكاة بعد خصم الديون والحاجات الأساسية.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const SummaryBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  const t = useTheme();
  return (
    <View style={{ flex: 1, padding: 10, borderRadius: 4, backgroundColor: color + '10', borderWidth: 0.5, borderColor: color + '40', alignItems: 'center' }}>
      <Text style={{ fontSize: 10, letterSpacing: 1.5, color: t.colors.textTertiary, fontWeight: '700' }}>{label}</Text>
      <Text style={{ fontSize: 14, color, fontWeight: '700', marginTop: 4 }}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: TOP_BAR_PAD,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '600' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  bigAmount: { fontSize: 44, fontWeight: '300', letterSpacing: -1, marginTop: 4, marginBottom: 6 },

  statusPill: {
    marginTop: 14,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1,
  },

  summaryRow: { flexDirection: 'row' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12, height: 44,
  },
});
