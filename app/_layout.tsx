import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, Platform, View, ActivityIndicator, StyleSheet, Image, Animated, Easing } from 'react-native';
import Svg, { Rect, Path, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
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
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
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

  React.useEffect(() => {
    Animated.stagger(180, [
      Animated.timing(cartoucheAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(brandAnim,     { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(taglineAnim,   { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Pulse subtle على الـ Bismillah
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.025, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0,   duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();

    // Spinner rotation
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [cartoucheAnim, brandAnim, taglineAnim, pulse, spin]);

  const cartoucheStyle = {
    opacity: cartoucheAnim,
    transform: [
      { translateY: cartoucheAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
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

  return (
    <LinearGradient colors={['#0E261E', '#081712', '#040C09']} style={styles.splash}>
      {/* خلفية - دوائر متّحدة المركز + radial glow خفيف */}
      <View style={styles.bgPattern} pointerEvents="none">
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 220 + i * 110,
              height: 220 + i * 110,
              borderRadius: 2000,
              borderWidth: 0.8,
              borderColor: `rgba(212, 181, 112, ${0.08 - i * 0.013})`,
              top: '50%', left: '50%',
              transform: [{ translateX: -(110 + i * 55) }, { translateY: -(110 + i * 55) }],
            }}
          />
        ))}
      </View>

      {/* 4 corner Ottoman ornaments - signature Nafahat */}
      <CornerOrnament position="top-left" />
      <CornerOrnament position="top-right" />
      <CornerOrnament position="bottom-left" />
      <CornerOrnament position="bottom-right" />

      {/* Bismillah cartouche - إطار ذهبي ناعم بدل Rub el Hizb العشوائي */}
      <Animated.View style={[{ alignItems: 'center', justifyContent: 'center', marginBottom: 36 }, cartoucheStyle]}>
        <Svg width={280} height={130} viewBox="0 0 280 130" style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id="cartoucheGlow" cx="50%" cy="50%" rx="55%" ry="50%">
              <Stop offset="0%"   stopColor="rgba(212, 181, 112, 0.10)" />
              <Stop offset="100%" stopColor="rgba(212, 181, 112, 0)" />
            </RadialGradient>
          </Defs>
          {/* glow خلف الـ Bismillah */}
          <Rect x="20" y="25" width="240" height="80" rx="40" fill="url(#cartoucheGlow)" />
          {/* الإطار الخارجي - cartouche بيضاوي ممدود */}
          <Path
            d="M 50 30 Q 20 65, 50 100 L 230 100 Q 260 65, 230 30 Z"
            fill="none" stroke="rgba(212, 181, 112, 0.55)" strokeWidth="0.7"
          />
          {/* إطار داخلي رفيع */}
          <Path
            d="M 55 36 Q 28 65, 55 94 L 225 94 Q 252 65, 225 36 Z"
            fill="none" stroke="rgba(212, 181, 112, 0.25)" strokeWidth="0.4"
          />
          {/* نقطتين زخرفيتين على الجوانب */}
          <Circle cx="22" cy="65" r="2" fill="#D4B570" />
          <Circle cx="258" cy="65" r="2" fill="#D4B570" />
          <Circle cx="22" cy="65" r="3.5" fill="none" stroke="rgba(212, 181, 112, 0.5)" strokeWidth="0.5" />
          <Circle cx="258" cy="65" r="3.5" fill="none" stroke="rgba(212, 181, 112, 0.5)" strokeWidth="0.5" />
        </Svg>
        <Text style={{
          fontSize: 54,
          color: '#E8C77F',
          fontFamily: 'serif',
          textShadowColor: 'rgba(212, 181, 112, 0.35)',
          textShadowOffset: { width: 0, height: 3 },
          textShadowRadius: 12,
          marginTop: 2,
        }}>
          ﷽
        </Text>
      </Animated.View>

      {/* Brand name */}
      <Animated.View style={brandStyle}>
        <Text style={[styles.brandName, { fontFamily: quranFont }]}>{APP_INFO.name}</Text>
      </Animated.View>

      {/* Tagline مع ornamental rule */}
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 14 }, taglineStyle]}>
        <View style={styles.taglineRule} />
        <View style={styles.taglineDot} />
        <Text style={styles.brandTagline}>صُحبة مع القرآن</Text>
        <View style={styles.taglineDot} />
        <View style={styles.taglineRule} />
      </Animated.View>

      {/* Custom gold spinner - SVG arc دوّار */}
      <View style={{ marginTop: 56 }}>
        <Animated.View style={{ transform: [{ rotate: spinRot }] }}>
          <Svg width={42} height={42} viewBox="0 0 42 42">
            {/* خلفية الـ ring */}
            <Circle cx="21" cy="21" r="17" fill="none" stroke="rgba(212, 181, 112, 0.12)" strokeWidth="2.4" />
            {/* arc ذهبي متحرّك */}
            <Path
              d="M 21 4 A 17 17 0 0 1 38 21"
              fill="none"
              stroke="#D4B570"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* نقطة في رأس الـ arc */}
            <Circle cx="38" cy="21" r="1.6" fill="#E8C77F" />
          </Svg>
        </Animated.View>
      </View>

      {/* Bottom: charity notice مع ornament رفيع */}
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
 * زخرفة ركنية عثمانية - signature Nafahat.
 * 4 منهم على الأركان عشان الـ splash يحس fait.
 */
const CornerOrnament: React.FC<{ position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }> = ({ position }) => {
  const positionStyles: Record<string, any> = {
    'top-left':     { top: 28, left: 20 },
    'top-right':    { top: 28, right: 20 },
    'bottom-left':  { bottom: 28, left: 20 },
    'bottom-right': { bottom: 28, right: 20 },
  };
  const rotation: Record<string, number> = {
    'top-left': 0, 'top-right': 90, 'bottom-right': 180, 'bottom-left': 270,
  };
  return (
    <View pointerEvents="none" style={[{ position: 'absolute' }, positionStyles[position]]}>
      <Svg width={52} height={52} viewBox="0 0 52 52">
        <G transform={`rotate(${rotation[position]} 26 26)`}>
          {/* L-shape ذهبي رفيع */}
          <Path d="M 4 4 L 22 4" stroke="rgba(212, 181, 112, 0.55)" strokeWidth="0.8" strokeLinecap="round" />
          <Path d="M 4 4 L 4 22" stroke="rgba(212, 181, 112, 0.55)" strokeWidth="0.8" strokeLinecap="round" />
          {/* arc داخلي */}
          <Path d="M 10 4 Q 10 10, 4 10" fill="none" stroke="rgba(212, 181, 112, 0.35)" strokeWidth="0.6" />
          {/* نقطة decorative */}
          <Circle cx="4" cy="4" r="1.6" fill="#D4B570" />
          <Circle cx="4" cy="4" r="3" fill="none" stroke="rgba(212, 181, 112, 0.3)" strokeWidth="0.4" />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bgPattern: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  brandName: {
    fontSize: 56,
    fontWeight: '500',
    color: '#FDFBF7',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 13,
    color: '#D4B570',
    letterSpacing: 2,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic_500Medium',
  },
  taglineRule: {
    width: 32, height: 1,
    backgroundColor: 'rgba(212, 181, 112, 0.5)',
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
