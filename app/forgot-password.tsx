/**
 * شاشة استعادة كلمة المرور.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowRight, ArrowLeft, Check, AlertCircle, KeyRound } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Screen, Text, Card } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useAuthStore } from '@store/authStore';
import { useT } from '@store/languageStore';
import { TranslationKey } from '@/i18n/index';
import { TOP_BAR_PAD } from '@utils/safeArea';

const ERROR_KEYS: Record<string, TranslationKey> = {
  'invalid-email':       'auth.error.invalidEmail',
  'invalid-credentials': 'auth.error.invalidCreds',
  'email-in-use':        'auth.error.emailInUse',
  'weak-password':       'auth.error.weakPassword',
  'network':             'auth.error.network',
  'unknown':             'auth.error.unknown',
};

export default function ForgotPasswordScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { forgotPassword, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    clearError();
    const ok = await forgotPassword(email.trim());
    if (ok) setSent(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.iconBtn, { borderColor: t.colors.border }]}>
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.eyebrow, { color: t.colors.accent }]}>{tr('auth.forgot.restore')}</Text>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>{tr('auth.forgot.password')}</Text>
        </View>
        <View style={[styles.iconBtn, { borderColor: 'transparent' }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Screen contentStyle={{ paddingHorizontal: 16, paddingTop: 24 }}>
          {!sent ? (
            <Card padding={24} elevation="sm" bordered>
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <View style={[styles.iconCircle, { backgroundColor: t.colors.accent + '14', borderColor: t.colors.accent }]}>
                  <KeyRound size={26} color={t.colors.accent} strokeWidth={1.6} />
                </View>
                <Text style={[styles.eyebrow, { color: t.colors.accent, marginTop: 14 }]}>{tr('auth.forgot.dontWorry')}</Text>
                <Text style={[styles.title, { color: t.colors.textPrimary, marginTop: 8 }]}>{tr('auth.forgot.title')}</Text>
                <Text variant="body" color={t.colors.textSecondary} align="center" style={{ marginTop: 8, lineHeight: 22, maxWidth: 280 }}>
                  {tr('auth.forgot.desc')}
                </Text>
              </View>

              <View style={{ marginVertical: 14, alignItems: 'center' }}>
                <OrnamentalRule width={140} color={t.colors.accent} variant="simple" />
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: t.colors.error + '12', borderColor: t.colors.error }]}>
                  <AlertCircle size={16} color={t.colors.error} />
                  <Text variant="bodySm" color={t.colors.error} style={{ flex: 1, fontWeight: '600' }}>
                    {tr(ERROR_KEYS[error] ?? 'auth.error.unknown')}
                  </Text>
                </View>
              ) : null}

              <Text variant="label" style={{ marginBottom: 6 }}>{tr('auth.email')}</Text>
              <View style={[styles.input, { borderColor: t.colors.border }]}>
                <Mail size={16} color={t.colors.textTertiary} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={t.colors.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15 }}
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={loading || !email.trim()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: t.colors.primary,
                    opacity: !email.trim() ? 0.5 : (pressed ? 0.9 : 1),
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={t.colors.onPrimary} />
                ) : (
                  <>
                    <Text style={[styles.primaryBtnText, { color: t.colors.onPrimary }]}>{tr('auth.forgot.sendButton')}</Text>
                    <ArrowLeft size={16} color={t.colors.onPrimary} />
                  </>
                )}
              </Pressable>

              <Pressable onPress={() => router.back()} style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }}>
                <Text variant="bodySm" color={t.colors.textSecondary}>
                  {tr('auth.forgot.remember')} <Text color={t.colors.accent} style={{ fontWeight: '700' }}>{tr('auth.forgot.backToLogin')}</Text>
                </Text>
              </Pressable>
            </Card>
          ) : (
            /* رسالة نجاح */
            <Card padding={28} elevation="sm" bordered background={t.colors.success + '08'}>
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.iconCircle, { backgroundColor: t.colors.success + '14', borderColor: t.colors.success }]}>
                  <Check size={28} color={t.colors.success} strokeWidth={2} />
                </View>
                <Text style={[styles.eyebrow, { color: t.colors.success, marginTop: 16 }]}>◇  {tr('common.done')}  ◇</Text>
                <Text style={[styles.title, { color: t.colors.textPrimary, marginTop: 8 }]}>{tr('auth.forgot.checkInbox')}</Text>
                <Text variant="body" color={t.colors.textSecondary} align="center" style={{ marginTop: 8, lineHeight: 24, maxWidth: 320 }}>
                  {tr('auth.forgot.sentTo')}
                </Text>
                <Text variant="subtitle" color={t.colors.accent} style={{ marginTop: 6, fontWeight: '700' }}>
                  {email}
                </Text>
                <Text variant="caption" color={t.colors.textTertiary} align="center" style={{ marginTop: 12, lineHeight: 18, maxWidth: 300 }}>
                  {tr('auth.forgot.spamHint')}
                </Text>

                <View style={{ marginTop: 18, alignItems: 'center' }}>
                  <OrnamentalRule width={140} color={t.colors.accent} variant="rosette" />
                </View>

                <Pressable
                  onPress={() => router.replace('/login')}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    {
                      backgroundColor: t.colors.primary,
                      opacity: pressed ? 0.9 : 1,
                      marginTop: 20,
                      alignSelf: 'stretch',
                    },
                  ]}
                >
                  <Text style={[styles.primaryBtnText, { color: t.colors.onPrimary }]}>{tr('auth.forgot.returnLogin')}</Text>
                  <ArrowLeft size={16} color={t.colors.onPrimary} />
                </Pressable>
              </View>
            </Card>
          )}
        </Screen>
      </KeyboardAvoidingView>
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

  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, marginBottom: 14,
    borderWidth: 1, borderRadius: 4,
  },

  input: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, height: 48,
    borderWidth: 1, borderRadius: 4,
  },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 54, marginTop: 18, borderRadius: 4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
