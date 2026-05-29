import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, Platform, View, ActivityIndicator, StyleSheet, Image, Animated, Easing } from 'react-native';
import Svg, { Rect, Path, Circle, G, Defs, RadialGradient, Stop, Ellipse, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts as useAmiriQuran, AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useUserStore, useReadingStore, useMemoStore, useStatsStore, useTasbeehStore, useQuizStore, useSettingsStore, useKhatmaStore, useTajweedStore, useWirdStore, useUserPrefsStore, useAppConfigStore, useAudioStore, useArticlesStore } from '@store/index';
import { useLanguageStore } from '@store/languageStore';
import { useAuthStore } from '@store/authStore';
import { convex, ConvexProviderImpl } from '@services/convex';
import { useAppInfo } from '@store/appConfigStore';
import { ToastProvider, useToast } from '@components/common/Toast';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { initPremium, checkActiveSubscription } from '@services/premium';
import { registerForPushNotifications } from '@services/pushNotifications';
// 🛰️ يستورد logger أولاً عشان Sentry.init() يحصل قبل أي خطأ محتمل في الـ tree
import { sentryWrap, log, setSentryUser } from '@utils/logger';
import { useAchievementNotifier } from '@hooks/useAchievementNotifier';

// ============== اتجاه RTL الافتراضي قبل hydrate اللغة ==============
// عند الإقلاع نبدأ بـ RTL (لغة افتراضية عربية). languageStore يحدّث الاتجاه
// لاحقاً بناءً على اختيار المستخدم المحفوظ.
//
// ⚠️ مشكلة أول تشغيل: على iOS/Android لا يُطبَّق forceRTL إلا بعد إعادة تحميل
//    الحزمة — فأول فتح بعد التثبيت يظهر LTR والأيقونات معكوسة، ثم يُصلَح عند
//    إعادة الفتح. الحل: نعيد التحميل مرة واحدة فوراً في الإنتاج عند اكتشاف
//    أن RTL لم يُطبَّق بعد. forceRTL يُحفَظ في تخزين النظام فلا يتكرّر مستقبلاً.
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    // في الإنتاج فقط (لا في dev/Expo Go حيث قد لا يُحفَظ الإعداد فيحدث loop)،
    // وعلى الموبايل فقط (الويب يضبط الاتجاه عبر DOM أدناه بلا إعادة تحميل).
    if (!__DEV__ && Platform.OS !== 'web') {
      // تحميل expo-updates ديناميكياً لتفادي كسر الويب لو لم يكن متاحاً.
      const Updates = require('expo-updates');
      if (Updates?.reloadAsync) {
        Updates.reloadAsync().catch(() => {});
      }
    }
  } catch {}
}

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  try {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    if (document.body) document.body.style.direction = 'rtl';
  } catch {}
}

const Root: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (convex && ConvexProviderImpl) {
    const Provider = ConvexProviderImpl;
    return <Provider client={convex}>{children}</Provider>;
  }
  return <>{children}</>;
};

function RootLayoutInner() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <ToastProvider>
              <Root>
                <AppGate />
              </Root>
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// 🛰️ Sentry.wrap للـ performance monitoring + native error capture.
//   لو Sentry غير فعّال (مفيش DSN)، الـ sentryWrap بيرجع المكوّن كما هو.
export default sentryWrap(RootLayoutInner);

function AppGate() {
  const router = useRouter();
  const segments = useSegments();
  const [hydrated, setHydrated] = useState(false);
  const toast = useToast();

  // 🏆 إشعار عند فتح إنجاز جديد
  useAchievementNotifier((title, description) => {
    toast.show({ title, description, type: 'achievement', duration: 5000 });
  });

  const [fontsLoaded] = useAmiriQuran({
    AmiriQuran_400Regular,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const hydrateUser = useUserStore((s) => s.hydrate);
  const hydrateReading = useReadingStore((s) => s.hydrate);
  const hydrateMemo = useMemoStore((s) => s.hydrate);
  const hydrateStats = useStatsStore((s) => s.hydrate);
  const hydrateTasbeeh = useTasbeehStore((s) => s.hydrate);
  const hydrateLang = useLanguageStore((s) => s.hydrate);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateQuiz = useQuizStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateKhatma = useKhatmaStore((s) => s.hydrate);
  const hydrateTajweed = useTajweedStore((s) => s.hydrate);
  const hydrateWird = useWirdStore((s) => s.hydrate);
  const hydratePrefs = useUserPrefsStore((s) => s.hydrate);
  const hydrateAppConfig = useAppConfigStore((s) => s.hydrate);
  const hydrateAudio = useAudioStore((s) => s.hydrate);
  const hydrateArticles = useArticlesStore((s) => s.hydrate);
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    (async () => {
      await Promise.all([
        hydrateUser(), hydrateReading(), hydrateMemo(),
        hydrateStats(), hydrateTasbeeh(), hydrateLang(),
        hydrateAuth(), hydrateQuiz(), hydrateSettings(), hydrateKhatma(), hydrateTajweed(), hydrateWird(), hydratePrefs(), hydrateAppConfig(), hydrateAudio(), hydrateArticles(),
      ]);
      // 💎 Premium + 🔔 Push (graceful - no-op لو الـ packages مش متركّبة)
      initPremium().then(() => checkActiveSubscription()).catch(() => {});
      registerForPushNotifications().catch(() => {});
      // 🛰️ Sentry user context — يساعد في ربط الأخطاء بمستخدم
      const authState = useAuthStore.getState();
      if (authState.user) {
        setSentryUser({ id: authState.user.id, email: authState.user.email, username: authState.user.name });
      } else {
        setSentryUser({ id: 'guest', username: 'guest' });
      }
      setTimeout(() => setHydrated(true), 1500);
    })();
  }, []);

  const signInAsGuest = useAuthStore((s) => s.signInAsGuest);

  useEffect(() => {
    if (!hydrated) return;
    const inOnboarding = segments[0] === 'onboarding';
    const inAuth = ['login', 'register', 'forgot-password'].includes(segments[0] ?? '');

    // 1) onboarding أولاً للمستخدمين الجدد
    if (!hasOnboarded && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // 2) بعد onboarding: لو لسه unknown → ادخله كزائر تلقائياً للصفحة الرئيسية
    //    التسجيل/الدخول بقى اختياري ومتاح من زر فوق
    if (hasOnboarded && authStatus === 'unknown' && !inAuth && !inOnboarding) {
      signInAsGuest().then(() => {
        router.replace('/(tabs)');
      });
    }
  }, [hydrated, hasOnboarded, authStatus, segments, signInAsGuest]);

  if (!hydrated || !fontsLoaded) return <SplashView />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_left',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="surah/[id]" />
      <Stack.Screen name="reciter/[id]" />
      <Stack.Screen name="adhkar/index" />
      <Stack.Screen name="adhkar/[category]" />
      <Stack.Screen name="tajweed/index" />
      <Stack.Screen name="tajweed/[id]" />
      <Stack.Screen name="tasmee" />
      <Stack.Screen name="tasbeeh" />
      <Stack.Screen name="khatma" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="duas" />
      <Stack.Screen name="qibla" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="wird" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="notes" />
      <Stack.Screen name="review" />
      <Stack.Screen name="ayah-of-day" />
      {/* أدوات إضافية — تظهر تحت "أدوات" في tab "أنا" */}
      <Stack.Screen name="zakat" />
      <Stack.Screen name="mosques" />
      <Stack.Screen name="journey" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="cloud-sync" />
      <Stack.Screen name="quiz/index" />
      <Stack.Screen name="quiz/session" />
      {/* admin tools — accessible فقط لـ admin emails */}
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="admin/users" />
      {/* Tools landing — يجمع كل الأدوات في صفحة واحدة */}
      <Stack.Screen name="tools" />
      {/* Library — قائمة السور/الأجزاء/الأحزاب (كانت في tab المصحف القديم) */}
      <Stack.Screen name="quran-index" />
      {/* Location picker — يغيّر مواقيت الصلاة + الأذان + القبلة */}
      <Stack.Screen name="location" />
      {/* Memorization custom plan wizard */}
      <Stack.Screen name="memo-create" />
      {/* Premium subscription paywall + status */}
      <Stack.Screen name="premium" options={{ presentation: 'modal' }} />
      {/* مكتبة المقالات الإسلامية */}
      <Stack.Screen name="articles/index" />
      <Stack.Screen name="articles/[id]" />
      <Stack.Screen name="search" options={{ presentation: 'modal' }} />
      <Stack.Screen name="player" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

/**
 * 🌟 Splash Screen — أول انطباع للمستخدم.
 *
 * البنية الجديدة:
 *  - Gradient أخضر زمردي عميق
 *  - Concentric circles + 4 corner ornaments عثمانية ذهبية
 *  - Bismillah داخل cartouche ذهبي بسيط (مش rub el hizb عشوائي)
 *  - شعار نَفَحات بـ pulse خفيف
 *  - Spinner ذهبي مخصّص (arc دوّار - مش ActivityIndicator generic)
 *  - Animation stagger: كل عنصر يدخل بـ fade-in + slide خفيف بترتيب أنيق
 *  - Bottom: charity notice بـ ornament رفيع
 */
function SplashView() {
  const t = useTheme();
  const APP_INFO = useAppInfo();
  const quranFont = t.fontFamilies.arabicQuran;

  // Animations: stagger fade + slide
  const cartoucheAnim = React.useRef(new Animated.Value(0)).current;
  const brandAnim     = React.useRef(new Animated.Value(0)).current;
  const taglineAnim   = React.useRef(new Animated.Value(0)).current;
  const pulse         = React.useRef(new Animated.Value(1)).current;
  const spin          = React.useRef(new Animated.Value(0)).current;
  const mandalaSpin   = React.useRef(new Animated.Value(0)).current;
  const glowPulse     = React.useRef(new Animated.Value(0.7)).current;

  React.useEffect(() => {
    // Entrances
    Animated.stagger(180, [
      Animated.timing(cartoucheAnim, { toValue: 1, duration: 900, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      Animated.timing(brandAnim,     { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(taglineAnim,   { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Subtle breathing pulse for the Shamsa Medallion
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.025, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    // Background Mandala - ultra slow rotation (80 seconds)
    Animated.loop(
      Animated.timing(mandalaSpin, { toValue: 1, duration: 80000, easing: Easing.linear, useNativeDriver: true }),
    ).start();

    // Background Glow - ambient breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1.0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.6, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    // Astrolabe spinner rotation
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [cartoucheAnim, brandAnim, taglineAnim, pulse, spin, mandalaSpin, glowPulse]);

  const cartoucheStyle = {
    opacity: cartoucheAnim,
    transform: [
      { scale: cartoucheAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
      { scale: pulse },
    ],
  };
  const brandStyle = {
    opacity: brandAnim,
    transform: [{ translateY: brandAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
  const taglineStyle = {
    opacity: taglineAnim,
    transform: [{ translateY: taglineAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };
  
  const spinRot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const antiSpinRot = spin.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const mandalaSpinRot = mandalaSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <LinearGradient colors={['#020B08', '#071F17', '#010504']} style={styles.splash}>
      {/* Background radial gold ambient glow */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: glowPulse, alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        <Svg width="150%" height="150%" viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="bgGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="rgba(212, 181, 112, 0.15)" />
              <Stop offset="50%" stopColor="rgba(212, 181, 112, 0.03)" />
              <Stop offset="100%" stopColor="rgba(212, 181, 112, 0)" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#bgGlow)" />
        </Svg>
      </Animated.View>

      {/* Background rotating mandala */}
      <BackgroundMandala spinAnim={mandalaSpinRot} />

      {/* 4 corner Ottoman ornaments */}
      <CornerOrnament position="top-left" />
      <CornerOrnament position="top-right" />
      <CornerOrnament position="bottom-left" />
      <CornerOrnament position="bottom-right" />

      {/* Central Shamsa Medallion */}
      <Animated.View style={[styles.shamsaContainer, cartoucheStyle]}>
        <Svg width={260} height={260} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="shamsaInnerGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="rgba(212, 181, 112, 0.22)" />
              <Stop offset="80%" stopColor="rgba(8, 37, 28, 0.6)" />
              <Stop offset="100%" stopColor="transparent" />
            </RadialGradient>
            <SvgLinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFF1CC" />
              <Stop offset="50%" stopColor="#D4B570" />
              <Stop offset="100%" stopColor="#8C7430" />
            </SvgLinearGradient>
          </Defs>

          {/* Shamsa Frame: 16 arches & beads */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = i * (360 / 16);
            return (
              <G key={i} transform={`rotate(${angle} 100 100)`}>
                <Path
                  d="M 100 18 C 105 18, 107 26, 100 30 C 93 26, 95 18, 100 18"
                  fill="rgba(212, 181, 112, 0.08)"
                  stroke="url(#goldGradient)"
                  strokeWidth="0.8"
                />
                <Circle cx="100" cy="14" r="1.8" fill="#F5EAC4" />
              </G>
            );
          })}

          {/* Inner concentric gold rings */}
          <Circle cx="100" cy="100" r="74" fill="none" stroke="url(#goldGradient)" strokeWidth="0.9" opacity="0.85" />
          <Circle cx="100" cy="100" r="70" fill="none" stroke="rgba(212, 181, 112, 0.3)" strokeWidth="0.5" />
          
          {/* Medallion central background radial glow */}
          <Circle cx="100" cy="100" r="70" fill="url(#shamsaInnerGlow)" />

          {/* Golden Crescent Moon */}
          <Path
            d="M 112 68 A 30 30 0 1 0 112 124 A 25 25 0 1 1 112 68 Z"
            fill="url(#goldGradient)"
            stroke="#8C7430"
            strokeWidth="0.5"
          />

          {/* Open Quran Book nestled in crescent */}
          <G transform="translate(100, 106) scale(0.92)">
            {/* Book Stand (Rehal) */}
            <Path d="M -17 12 L 0 0 L 17 12" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" />
            <Path d="M -13 15 L 13 15" stroke="url(#goldGradient)" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
            {/* Shadow */}
            <Ellipse cx="0" cy="16" rx="14" ry="2" fill="#000" opacity="0.3" />
            {/* Pages */}
            <Path d="M -18 -6 C -9 -8, -2 -2, 0 1 C 2 -2, 9 -8, 18 -6 L 16 8 C 8 6, 2 1, 0 8 C -2 1, -8 6, -16 8 Z" fill="#FDFBF7" stroke="#8C7430" strokeWidth="0.5" />
            {/* Cover */}
            <Path d="M -19 -5 L -17 9 M 19 -5 L 17 9" stroke="url(#goldGradient)" strokeWidth="1.2" />
            {/* Quran Text Lines (Subtle) */}
            <Path d="M -12 -1 L -3 -2 M -12 2 L -3 1 M -12 5 L -5 4" stroke="#0F4A41" strokeWidth="0.7" strokeLinecap="round" opacity="0.8" />
            <Path d="M 3 -2 L 12 -1 M 3 1 L 12 2 M 5 4 L 12 5" stroke="#0F4A41" strokeWidth="0.7" strokeLinecap="round" opacity="0.8" />
          </G>

          {/* Pulsing 8-pointed star (Rub El Hizb) */}
          <G transform="translate(100, 56) scale(0.85)">
            <G transform="rotate(22.5 0 0)">
              <Rect x="-6" y="-6" width="12" height="12" fill="url(#goldGradient)" stroke="#8C7430" strokeWidth="0.5" />
              <Rect x="-6" y="-6" width="12" height="12" fill="url(#goldGradient)" stroke="#8C7430" strokeWidth="0.5" transform="rotate(45)" transformOrigin="0 0" />
            </G>
            <Circle cx="0" cy="0" r="2.5" fill="#071F17" />
            <Circle cx="0" cy="0" r="1.2" fill="#F5EAC4" />
          </G>

          {/* Light Rays & Sparkles */}
          <Path d="M 100 96 L 100 68" stroke="rgba(255, 241, 204, 0.4)" strokeWidth="0.8" strokeDasharray="2 3" />
          <Path d="M 91 96 L 86 78" stroke="rgba(255, 241, 204, 0.25)" strokeWidth="0.6" strokeDasharray="2 2" />
          <Path d="M 109 96 L 114 78" stroke="rgba(255, 241, 204, 0.25)" strokeWidth="0.6" strokeDasharray="2 2" />
          <Circle cx="94" cy="74" r="1" fill="#F5EAC4" opacity="0.95" />
          <Circle cx="106" cy="71" r="1.3" fill="#F5EAC4" opacity="0.95" />
          <Circle cx="101" cy="82" r="0.8" fill="#FDFBF7" opacity="0.8" />
        </Svg>
      </Animated.View>

      {/* Brand name */}
      <Animated.View style={brandStyle}>
        <Text style={[styles.brandName, { fontFamily: t.fontFamilies.sansBold }]}>{APP_INFO.name}</Text>
      </Animated.View>

      {/* Tagline with elegant diamond rule */}
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 14 }, taglineStyle]}>
        <View style={styles.taglineRule} />
        <Text style={{ color: '#D4B570', fontSize: 14, fontWeight: 'bold' }}>❖</Text>
        <Text style={styles.brandTagline}>صُحبة مع القرآن</Text>
        <Text style={{ color: '#D4B570', fontSize: 14, fontWeight: 'bold' }}>❖</Text>
        <View style={styles.taglineRule} />
      </Animated.View>

      {/* Custom Astrolabe Spinner */}
      <AstrolabeSpinner spinRot={spinRot} antiSpinRot={antiSpinRot} />

      {/* Bottom: charity notice */}
      {APP_INFO.charityNotice ? (
        <View style={styles.charityWrap}>
          <View style={styles.charityRuleRow}>
            <View style={styles.charityRule} />
            <View style={styles.charityDiamond} />
            <View style={styles.charityRule} />
          </View>
          <Text style={styles.charityText}>{APP_INFO.charityNotice}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

/**
 * 🌟 Background Mandala — Slowly rotating background geometric star pattern.
 */
const BackgroundMandala: React.FC<{ spinAnim: Animated.AnimatedInterpolation<string | number> }> = ({ spinAnim }) => {
  return (
    <Animated.View style={[styles.bgMandalaContainer, { transform: [{ rotate: spinAnim }] }]}>
      <Svg width={460} height={460} viewBox="0 0 200 200">
        {/* Outer dotted ring */}
        <Circle cx="100" cy="100" r="90" fill="none" stroke="rgba(212, 181, 112, 0.08)" strokeWidth="0.5" strokeDasharray="2 3" />
        
        {/* 12-point star pattern */}
        {Array.from({ length: 12 }).map((_, i) => {
          const rotateAngle = i * (360 / 12);
          return (
            <G key={i} transform={`rotate(${rotateAngle} 100 100)`}>
              {/* Pointy star rays */}
              <Path d="M 100 10 L 105 40 L 95 40 Z" fill="none" stroke="rgba(212, 181, 112, 0.04)" strokeWidth="0.5" />
              <Path d="M 100 10 L 110 50 L 90 50 Z" fill="none" stroke="rgba(212, 181, 112, 0.02)" strokeWidth="0.4" />
              <Path d="M 100 10 L 100 100" stroke="rgba(212, 181, 112, 0.01)" strokeWidth="0.3" />
            </G>
          );
        })}
        {/* Intertwining decorative rings */}
        <Circle cx="100" cy="100" r="70" fill="none" stroke="rgba(212, 181, 112, 0.04)" strokeWidth="0.5" />
        <Circle cx="100" cy="100" r="50" fill="none" stroke="rgba(212, 181, 112, 0.03)" strokeWidth="0.5" />
        <Circle cx="100" cy="100" r="30" fill="none" stroke="rgba(212, 181, 112, 0.02)" strokeWidth="0.4" />
      </Svg>
    </Animated.View>
  );
};

/**
 * 🌟 Astrolabe Spinner — High-fidelity vintage Islamic astrolabe rotating loading wheel.
 */
const AstrolabeSpinner: React.FC<{
  spinRot: Animated.AnimatedInterpolation<string | number>;
  antiSpinRot: Animated.AnimatedInterpolation<string | number>;
}> = ({ spinRot, antiSpinRot }) => {
  return (
    <View style={{ height: 60, width: 60, alignItems: 'center', justifyContent: 'center', marginTop: 44 }}>
      {/* Outer Astrolabe Rim (Stator/Slow Clockwise) */}
      <Animated.View style={{ position: 'absolute', transform: [{ rotate: spinRot }] }}>
        <Svg width={56} height={56} viewBox="0 0 60 60">
          <Defs>
            <SvgLinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFF1CC" />
              <Stop offset="50%" stopColor="#D4B570" />
              <Stop offset="100%" stopColor="#8C7430" />
            </SvgLinearGradient>
          </Defs>
          {/* Heavy outer ring */}
          <Circle cx="30" cy="30" r="26" fill="none" stroke="url(#goldGradient)" strokeWidth="2.2" />
          <Circle cx="30" cy="30" r="24" fill="none" stroke="rgba(212, 181, 112, 0.25)" strokeWidth="0.6" />
          
          {/* Astrolabe degree markings/notches around the rim */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * (360 / 12);
            return (
              <G key={i} transform={`rotate(${angle} 30 30)`}>
                <Path d="M 30 4 L 30 6" stroke="#D4B570" strokeWidth="0.8" />
                <Circle cx="30" cy="8" r="0.6" fill="#F5EAC4" />
              </G>
            );
          })}
        </Svg>
      </Animated.View>

      {/* Inner Astrolabe Rete (Fast Counter-Clockwise) */}
      <Animated.View style={{ position: 'absolute', transform: [{ rotate: antiSpinRot }] }}>
        <Svg width={40} height={40} viewBox="0 0 40 40">
          <Defs>
            <SvgLinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFF1CC" />
              <Stop offset="50%" stopColor="#D4B570" />
              <Stop offset="100%" stopColor="#8C7430" />
            </SvgLinearGradient>
          </Defs>
          {/* Elegant 8-pointed star in the center of the astrolabe */}
          <G transform="translate(20, 20) scale(0.9)">
            {/* 8-pointed star */}
            <G transform="rotate(0 0 0)">
              <Path d="M 0 -14 L 3.5 -4 L 14 0 L 3.5 4 L 0 14 L -3.5 4 L -14 0 L -3.5 -4 Z" fill="none" stroke="url(#goldGradient)" strokeWidth="0.8" />
            </G>
            <G transform="rotate(45 0 0)">
              <Path d="M 0 -14 L 3.5 -4 L 14 0 L 3.5 4 L 0 14 L -3.5 4 L -14 0 L -3.5 -4 Z" fill="none" stroke="url(#goldGradient)" strokeWidth="0.5" opacity="0.7" transform="rotate(45)" transformOrigin="0 0" />
            </G>
            {/* Center pointer hub */}
            <Circle cx="0" cy="0" r="3.5" fill="url(#goldGradient)" stroke="#8C7430" strokeWidth="0.5" />
            <Circle cx="0" cy="0" r="1.2" fill="#040C09" />
            {/* Curving astrolabe pointers (flames) */}
            <Path d="M 0 -3.5 Q -6 -10, -10 -8" fill="none" stroke="url(#goldGradient)" strokeWidth="0.6" />
            <Path d="M 0 3.5 Q 6 10, 10 8" fill="none" stroke="url(#goldGradient)" strokeWidth="0.6" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
};

/**
 * زخرفة ركنية عثمانية - signature Nafahat.
 * 4 منهم على الأركان لتعطي شاشة البدء طابعاً فنياً فخماً.
 */
const CornerOrnament: React.FC<{ position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }> = ({ position }) => {
  const positionStyles: Record<string, any> = {
    'top-left':     { top: 24, left: 24 },
    'top-right':    { top: 24, right: 24 },
    'bottom-left':  { bottom: 24, left: 24 },
    'bottom-right': { bottom: 24, right: 24 },
  };
  const rotation: Record<string, number> = {
    'top-left': 0, 'top-right': 90, 'bottom-right': 180, 'bottom-left': 270,
  };
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', zIndex: 10 }, positionStyles[position]]}>
      <Svg width={64} height={64} viewBox="0 0 64 64">
        <Defs>
          <SvgLinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFF1CC" />
            <Stop offset="50%" stopColor="#D4B570" />
            <Stop offset="100%" stopColor="#8C7430" />
          </SvgLinearGradient>
        </Defs>
        <G transform={`rotate(${rotation[position]} 32 32)`}>
          {/* Main outer border corner lines */}
          <Path d="M 4 4 L 48 4" stroke="rgba(212, 181, 112, 0.4)" strokeWidth="0.8" strokeLinecap="round" />
          <Path d="M 4 4 L 4 48" stroke="rgba(212, 181, 112, 0.4)" strokeWidth="0.8" strokeLinecap="round" />
          {/* Inner framing arch */}
          <Path d="M 10 10 Q 10 24, 4 24" fill="none" stroke="rgba(212, 181, 112, 0.25)" strokeWidth="0.6" />
          <Path d="M 10 10 Q 24 10, 24 4" fill="none" stroke="rgba(212, 181, 112, 0.25)" strokeWidth="0.6" />
          {/* Detailed arabesque scrolls */}
          <Path d="M 4 16 C 12 16, 16 12, 16 4" fill="none" stroke="url(#goldGradient)" strokeWidth="0.8" />
          <Path d="M 8 8 Q 20 20, 32 8 M 8 8 Q 20 20, 8 32" fill="none" stroke="url(#goldGradient)" strokeWidth="0.5" opacity="0.6" />
          {/* Central bud */}
          <Path d="M 14 14 C 18 18, 20 18, 22 22 C 18 20, 18 18, 14 14 Z" fill="url(#goldGradient)" opacity="0.8" />
          {/* Beading */}
          <Circle cx="4" cy="4" r="2" fill="#D4B570" />
          <Circle cx="28" cy="4" r="1" fill="#D4B570" opacity="0.75" />
          <Circle cx="4" cy="28" r="1" fill="#D4B570" opacity="0.75" />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bgPattern: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  bgMandalaContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', opacity: 0.8 },
  shamsaContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  brandName: {
    fontSize: 52,
    fontFamily: 'IBMPlexSansArabic_700Bold',
    color: '#FFFDF9',
    textShadowColor: 'rgba(212, 181, 112, 0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 14,
    color: '#D4B570',
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic_600SemiBold',
    textAlign: 'center',
  },
  taglineRule: {
    width: 40, height: 1,
    backgroundColor: 'rgba(212, 181, 112, 0.35)',
  },
  taglineDot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: '#D4B570',
  },

  charityWrap: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  charityRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  charityRule: {
    width: 40, height: 0.6,
    backgroundColor: 'rgba(212, 181, 112, 0.35)',
  },
  charityDiamond: {
    width: 5, height: 5,
    backgroundColor: 'rgba(212, 181, 112, 0.6)',
    transform: [{ rotate: '45deg' }],
  },
  charityText: {
    color: 'rgba(245, 239, 224, 0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
