/**
 * شاشة إنشاء حساب جديد.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, AlertCircle, Check, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useAuthStore } from '@store/authStore';
import { useT } from '@store/languageStore';
import { TranslationKey } from '@/i18n/index';

const ERROR_KEYS: Record<string, TranslationKey> = {
  'invalid-email':       'auth.error.invalidEmail',
  'invalid-credentials': 'auth.error.invalidCreds',
  'email-in-use':        'auth.error.emailInUse',
  'weak-password':       'auth.error.weakPassword',
  'network':             'auth.error.network',
  'unknown':             'auth.error.unknown',
};

export default function RegisterScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { signUp, loading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const passwordMismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = name.trim() && email.trim() && password.length >= 6 && !passwordMismatch && agreeTerms;

  const handleSubmit = async () => {
    clearError();
    if (!canSubmit) return;
    const ok = await signUp(name.trim(), email.trim(), password);
    if (ok) router.replace('/');
  };

  // مؤشرات قوّة كلمة المرور
  const pwStrength = (() => {
    if (password.length === 0) return null;
    if (password.length < 6) return { label: tr('auth.pwWeak'), color: t.colors.error, pct: 0.3 };
    if (password.length < 9 || !/[A-Z]|[0-9]/.test(password)) return { label: tr('auth.pwMedium'), color: t.colors.warning, pct: 0.6 };
    return { label: tr('auth.pwStrong'), color: t.colors.success, pct: 1 };
  })();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {/* الترويسة */}
      <LinearGradient colors={['#0A3D38', '#0F4A41', '#062825']} style={styles.heroBg}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Pattern id="reg-bg" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <Path
                d="M24,4 L28,20 L44,24 L28,28 L24,44 L20,28 L4,24 L20,20 Z"
                fill="none" stroke="#C9A961" strokeWidth={0.5} opacity={0.3}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#reg-bg)" opacity={0.5} />
        </Svg>

        <View style={{ position: 'absolute', top: 50, start: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.backBtn, { borderColor: 'rgba(212, 181, 112, 0.3)' }]}>
            <ArrowRight size={18} color="#D4B570" />
          </Pressable>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.brandTag}>{tr('auth.startJourney')}</Text>
          <Text style={styles.brandName}>{tr('auth.signUpTitle')}</Text>
          <Text style={styles.brandSub}>{tr('auth.signUpSubtitle')}</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.formScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
            {/* خطأ */}
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: t.colors.error + '12', borderColor: t.colors.error }]}>
                <AlertCircle size={16} color={t.colors.error} />
                <Text variant="bodySm" color={t.colors.error} style={{ flex: 1, fontWeight: '600' }}>
                  {tr(ERROR_KEYS[error] ?? 'auth.error.unknown')}
                </Text>
              </View>
            ) : null}

            {/* الاسم */}
            <Text variant="label" style={{ marginBottom: 6 }}>{tr('auth.name')}</Text>
            <View style={[styles.input, { borderColor: t.colors.border }]}>
              <User size={16} color={t.colors.textTertiary} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={tr('auth.namePlaceholder')}
                placeholderTextColor={t.colors.textTertiary}
                style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15 }}
              />
            </View>

            {/* البريد */}
            <Text variant="label" style={{ marginTop: 14, marginBottom: 6 }}>{tr('auth.email')}</Text>
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

            {/* كلمة المرور */}
            <Text variant="label" style={{ marginTop: 14, marginBottom: 6 }}>{tr('auth.password')}</Text>
            <View style={[styles.input, { borderColor: t.colors.border }]}>
              <Lock size={16} color={t.colors.textTertiary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={tr('auth.passwordMinHint')}
                placeholderTextColor={t.colors.textTertiary}
                secureTextEntry={!showPassword}
                style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15 }}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                {showPassword ? <EyeOff size={16} color={t.colors.textTertiary} /> : <Eye size={16} color={t.colors.textTertiary} />}
              </Pressable>
            </View>

            {/* مؤشّر قوّة كلمة المرور */}
            {pwStrength ? (
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text variant="caption" color={t.colors.textTertiary}>{tr('auth.pwStrengthLabel')}</Text>
                  <Text variant="caption" color={pwStrength.color} style={{ fontWeight: '700' }}>
                    {pwStrength.label}
                  </Text>
                </View>
                <View style={{ marginTop: 4, height: 3, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${pwStrength.pct * 100}%`, backgroundColor: pwStrength.color }} />
                </View>
              </View>
            ) : null}

            {/* تأكيد كلمة المرور */}
            <Text variant="label" style={{ marginTop: 14, marginBottom: 6 }}>{tr('auth.confirmPassword')}</Text>
            <View style={[styles.input, { borderColor: passwordMismatch ? t.colors.error : t.colors.border }]}>
              <Lock size={16} color={t.colors.textTertiary} />
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder={tr('auth.passwordConfirmPh')}
                placeholderTextColor={t.colors.textTertiary}
                secureTextEntry={!showPassword}
                style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15 }}
              />
            </View>
            {passwordMismatch ? (
              <Text variant="caption" color={t.colors.error} style={{ marginTop: 6 }}>
                {tr('auth.pwMismatch')}
              </Text>
            ) : null}

            {/* الموافقة على الشروط */}
            <Pressable
              onPress={() => setAgreeTerms((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 }}
            >
              <View style={[styles.checkBox, { borderColor: agreeTerms ? t.colors.accent : t.colors.borderStrong, backgroundColor: agreeTerms ? t.colors.accent : 'transparent' }]}>
                {agreeTerms ? <Check size={12} color={t.colors.onAccent} strokeWidth={3} /> : null}
              </View>
              <Text variant="bodySm" color={t.colors.textSecondary} style={{ flex: 1, lineHeight: 20 }}>
                {tr('auth.agreeTerms')} <Text color={t.colors.accent} style={{ fontWeight: '700' }}>{tr('auth.termsOfUse')}</Text> {tr('auth.and')} <Text color={t.colors.accent} style={{ fontWeight: '700' }}>{tr('auth.privacyPolicy')}</Text>
              </Text>
            </Pressable>

            {/* زر الإنشاء */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !canSubmit}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: t.colors.primary,
                  opacity: !canSubmit ? 0.5 : (pressed ? 0.9 : 1),
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={t.colors.onPrimary} />
              ) : (
                <>
                  <Text style={[styles.primaryBtnText, { color: t.colors.onPrimary }]}>{tr('auth.signUpButton')}</Text>
                  <ArrowLeft size={16} color={t.colors.onPrimary} />
                </>
              )}
            </Pressable>

            <View style={{ alignItems: 'center', marginVertical: 18 }}>
              <OrnamentalRule width={140} color={t.colors.accent} variant="simple" />
            </View>

            {/* أزرار اجتماعية */}
            <Pressable style={[styles.socialBtn, { borderColor: t.colors.border }]}>
              <Text style={{ fontSize: 18 }}>🇬</Text>
              <Text variant="button" color={t.colors.textPrimary}>{tr('auth.signUpWithGoogle')}</Text>
            </Pressable>
            <Pressable style={[styles.socialBtn, { borderColor: t.colors.border, marginTop: 10 }]}>
              <Text style={{ fontSize: 18 }}>🍎</Text>
              <Text variant="button" color={t.colors.textPrimary}>{tr('auth.signUpWithApple')}</Text>
            </Pressable>
          </View>

          {/* رابط للدخول */}
          <View style={styles.bottomLink}>
            <Text variant="body" color={t.colors.textSecondary}>
              {tr('auth.hasAccount')}
            </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text variant="body" color={t.colors.accent} style={{ fontWeight: '700' }}>
                {' '}{tr('auth.signInLink')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBg: {
    paddingTop: 60, paddingBottom: 32,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroContent: { alignItems: 'center', marginTop: 16 },
  brandName: { fontSize: 32, fontWeight: '800', color: '#F5EFE0', marginTop: 8, letterSpacing: -0.5 },
  brandTag: { fontSize: 12, color: '#D4B570', letterSpacing: 1, fontWeight: '700', fontFamily: 'IBMPlexSansArabic_500Medium' },
  brandSub: { fontSize: 13, color: 'rgba(245, 239, 224, 0.75)', marginTop: 8, textAlign: 'center', maxWidth: 280 },

  formScroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 30 },
  formCard: { padding: 22, borderWidth: 1, borderRadius: 4 },

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

  checkBox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 54, marginTop: 18, borderRadius: 4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 48, borderWidth: 1, borderRadius: 4,
  },

  bottomLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
});
