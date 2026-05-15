/**
 * شاشة تسجيل الدخول - تصميم مخطوط فاخر.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { useAuthStore } from '@store/authStore';
import { useT } from '@store/languageStore';
import { TranslationKey } from '@/i18n/index';
import { useAppInfo } from '@store/appConfigStore';
import { authErrorMessage } from '@store/authStore';

const ERROR_KEYS: Record<string, TranslationKey> = {
  'invalid-email':       'auth.error.invalidEmail',
  'invalid-credentials': 'auth.error.invalidCreds',
  'email-in-use':        'auth.error.emailInUse',
  'weak-password':       'auth.error.weakPassword',
  'network':             'auth.error.network',
  'unknown':             'auth.error.unknown',
};

export default function LoginScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const APP_INFO = useAppInfo();
  const { signIn, signInAsGuest, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    clearError();
    const ok = await signIn(email.trim(), password);
    if (ok) router.replace('/');
  };

  const handleGuest = async () => {
    await signInAsGuest();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {/* خلفية متدرّجة علوية */}
      <LinearGradient
        colors={['#0A3D38', '#0F4A41', '#062825']}
        style={styles.heroBg}
      >
        {/* نقش هندسي */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Pattern id="login-bg" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <Path
                d="M24,4 L28,20 L44,24 L28,28 L24,44 L20,28 L4,24 L20,20 Z"
                fill="none" stroke="#C9A961" strokeWidth={0.5} opacity={0.3}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#login-bg)" opacity={0.5} />
        </Svg>

        {/* رأس */}
        <View style={styles.heroContent}>
          <View style={[styles.logoFrame, { borderColor: 'rgba(212, 181, 112, 0.5)' }]}>
            <View style={[styles.logoInner, { borderColor: 'rgba(212, 181, 112, 0.7)' }]}>
              <Text style={styles.glyph}>﷽</Text>
            </View>
          </View>
          <Text style={[styles.brandName, { fontFamily: t.fontFamilies.arabicQuran }]}>{tr('app.name')}</Text>
          <Text style={styles.brandTag}>◇  {tr('auth.welcome')}  ◇</Text>

          {/* شارة "صدقة جارية" */}
          {APP_INFO.charityNotice ? (
            <View style={styles.charityBadge}>
              <View style={styles.charityDot} />
              <Text style={styles.charityBadgeText}>{APP_INFO.charityNotice}</Text>
              <View style={styles.charityDot} />
            </View>
          ) : null}
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
          {/* زر "استمر كزائر" بارز فوق - تشجيع المستخدمين بدون حسابات */}
          <Pressable
            onPress={handleGuest}
            style={({ pressed }) => [
              styles.guestTopBtn,
              {
                backgroundColor: t.colors.accent + '14',
                borderColor: t.colors.accent + '50',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.guestTopText, { color: t.colors.accent }]}>
              ✦  استمر بدون تسجيل  ✦
            </Text>
            <Text style={[styles.guestTopSub, { color: t.colors.textSecondary }]}>
              يمكنك استخدام التطبيق كاملاً كزائر - التسجيل اختياري
            </Text>
          </Pressable>

          {/* فاصل */}
          <View style={styles.dividerWrap}>
            <View style={[styles.dividerLine, { backgroundColor: t.colors.border }]} />
            <Text style={[styles.dividerText, { color: t.colors.textTertiary }]}>أو</Text>
            <View style={[styles.dividerLine, { backgroundColor: t.colors.border }]} />
          </View>

          <View style={[styles.formCard, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.eyebrow, { color: t.colors.accent }]}>◇  {tr('auth.signInTitle')}  ◇</Text>
              <Text style={[styles.formTitle, { color: t.colors.textPrimary }]}>{tr('auth.signInSubtitle')}</Text>
            </View>

            {/* خطأ - مع زر "إنشئ حساب" لو الحساب مش موجود */}
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: t.colors.error + '12', borderColor: t.colors.error }]}>
                <AlertCircle size={16} color={t.colors.error} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodySm" color={t.colors.error} style={{ fontWeight: '600' }}>
                    {authErrorMessage(error)}
                  </Text>
                  {error === 'account-not-found' ? (
                    <Pressable
                      onPress={() => router.push(`/register?email=${encodeURIComponent(email.trim())}`)}
                      style={{ marginTop: 6 }}
                    >
                      <Text variant="bodySm" color={t.colors.accent} style={{ fontWeight: '800', textDecorationLine: 'underline' }}>
                        أنشئ حساباً جديداً ←
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* البريد */}
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

            {/* كلمة المرور */}
            <Text variant="label" style={{ marginTop: 14, marginBottom: 6 }}>{tr('auth.password')}</Text>
            <View style={[styles.input, { borderColor: t.colors.border }]}>
              <Lock size={16} color={t.colors.textTertiary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={t.colors.textTertiary}
                secureTextEntry={!showPassword}
                style={{ flex: 1, color: t.colors.textPrimary, textAlign: 'right', fontSize: 15 }}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                {showPassword ? <EyeOff size={16} color={t.colors.textTertiary} /> : <Eye size={16} color={t.colors.textTertiary} />}
              </Pressable>
            </View>

            {/* نسيت كلمة المرور */}
            <Pressable onPress={() => router.push('/forgot-password')} style={{ alignSelf: 'flex-end', marginTop: 10 }}>
              <Text variant="caption" color={t.colors.accent} style={{ fontWeight: '700' }}>
                {tr('auth.forgotPassword')}
              </Text>
            </Pressable>

            {/* زر الدخول */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !email.trim() || !password.trim()}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: t.colors.primary,
                  opacity: (!email.trim() || !password.trim()) ? 0.5 : (pressed ? 0.9 : 1),
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={t.colors.onPrimary} />
              ) : (
                <>
                  <Text style={[styles.primaryBtnText, { color: t.colors.onPrimary }]}>{tr('auth.signInButton')}</Text>
                  <ArrowLeft size={16} color={t.colors.onPrimary} />
                </>
              )}
            </Pressable>

            {/* فاصل */}
            <View style={{ alignItems: 'center', marginVertical: 18 }}>
              <OrnamentalRule width={140} color={t.colors.accent} variant="simple" />
            </View>

            {/* أزرار اجتماعية */}
            <Pressable style={[styles.socialBtn, { borderColor: t.colors.border }]}>
              <Text style={{ fontSize: 18 }}>🇬</Text>
              <Text variant="button" color={t.colors.textPrimary}>{tr('auth.signInWithGoogle')}</Text>
            </Pressable>
            <Pressable style={[styles.socialBtn, { borderColor: t.colors.border, marginTop: 10 }]}>
              <Text style={{ fontSize: 18 }}>🍎</Text>
              <Text variant="button" color={t.colors.textPrimary}>{tr('auth.signInWithApple')}</Text>
            </Pressable>

          </View>

          {/* رابط للتسجيل */}
          <View style={styles.bottomLink}>
            <Text variant="body" color={t.colors.textSecondary}>
              {tr('auth.noAccount')}
            </Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text variant="body" color={t.colors.accent} style={{ fontWeight: '700' }}>
                {' '}{tr('auth.createAccount')}
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
    paddingTop: 60, paddingBottom: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroContent: { alignItems: 'center' },
  logoFrame: {
    width: 84, height: 84,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  logoInner: {
    width: 56, height: 56,
    borderWidth: 0.5,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  glyph: { fontSize: 24, color: '#D4B570', fontFamily: 'serif' },
  brandName: { fontSize: 38, fontWeight: '500', color: '#F5EFE0', marginTop: 14 },
  brandTag: { fontSize: 12, color: '#D4B570', marginTop: 6, letterSpacing: 1, fontWeight: '700', fontFamily: 'IBMPlexSansArabic_500Medium' },

  charityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 181, 112, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.4)',
    marginTop: 14,
    maxWidth: 320,
  },
  charityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4B570',
  },
  charityBadgeText: {
    color: '#F5EFE0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    flexShrink: 1,
  },

  formScroll: {
    paddingHorizontal: 16,
    paddingTop: 20, paddingBottom: 30,
  },
  // زر "استمر كزائر" البارز فوق
  guestTopBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  guestTopText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  guestTopSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  // الفاصل "أو"
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  formCard: {
    padding: 22,
    borderWidth: 1,
    borderRadius: 4,
  },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 4 },
  formTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    marginTop: 18,
    borderRadius: 4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderWidth: 1, borderRadius: 4,
  },

  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});
