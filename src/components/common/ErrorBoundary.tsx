/**
 * 🛡️ Error Boundary — يمسك الأخطاء قبل ما تكسر التطبيق كله.
 *
 * يلفّ الـ root من _layout.tsx. لو fragment crash، يعرض fallback أنيق
 * يحفظ هوية Nafahat بدل الـ red screen.
 *
 * ✅ يطبع الـ error في console للـ developer.
 * ✅ زر "إعادة المحاولة" يعيد المحاولة (clears state).
 * ✅ زر "نسخ الخطأ" للـ bug report.
 *
 * ملاحظة: تركيب Sentry/crash reporting لاحقاً يحلّ مكان `console.error`.
 */
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { AlertTriangle, RotateCcw, Copy } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { copyToClipboard } from '@utils/clipboard';
import { log } from '@utils/logger';

interface State { error: Error | null; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 📝 logger يـ route للـ Sentry تلقائياً لو متفعّل، وللـ console في الـ dev
    log.error(error, { componentStack: info?.componentStack ?? 'unknown' });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ error: Error; onReset: () => void }> = ({ error, onReset }) => {
  const t = useTheme();
  const handleCopy = () => copyToClipboard(`${error.message}\n\n${error.stack ?? ''}`);

  return (
    <View style={[styles.wrap, { backgroundColor: t.colors.background }]}>
      <View style={[styles.iconBox, { backgroundColor: t.colors.error + '14', borderColor: t.colors.error + '40' }]}>
        <AlertTriangle size={32} color={t.colors.error} />
      </View>
      <Text style={[styles.title, { color: t.colors.textPrimary }]}>عذراً، حدث خطأ غير متوقّع</Text>
      <Text style={[styles.subtitle, { color: t.colors.textSecondary }]}>
        لا تقلق - بياناتك محفوظة. يمكنك إعادة المحاولة، ولو استمرّت المشكلة انسخ الخطأ وأرسله لنا.
      </Text>

      <View style={styles.btnRow}>
        <Pressable
          onPress={onReset}
          accessibilityRole="button"
          accessibilityLabel="إعادة المحاولة"
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: t.colors.primary, borderColor: t.colors.accent, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <RotateCcw size={16} color={t.colors.accent} />
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>إعادة المحاولة</Text>
        </Pressable>
        <Pressable
          onPress={handleCopy}
          accessibilityRole="button"
          accessibilityLabel="نسخ تفاصيل الخطأ"
          style={({ pressed }) => [
            styles.secondaryBtn,
            { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Copy size={16} color={t.colors.accent} />
          <Text style={{ color: t.colors.textPrimary, fontWeight: '700', fontSize: 14 }}>نسخ الخطأ</Text>
        </Pressable>
      </View>

      <ScrollView style={[styles.errorBox, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
        <Text style={{ color: t.colors.textTertiary, fontSize: 11, fontFamily: 'monospace' }}>
          {error.message}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconBox: {
    width: 72, height: 72,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorBox: {
    width: '100%',
    maxHeight: 100,
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});
