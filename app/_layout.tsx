import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, Platform, View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
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
import { useUserStore, useReadingStore, useMemoStore, useStatsStore, useTasbeehStore, useQuizStore, useSettingsStore, useKhatmaStore, useTajweedStore, useWirdStore, useUserPrefsStore, useAppConfigStore, useAudioStore } from '@store/index';
import { useLanguageStore } from '@store/languageStore';
import { useAuthStore } from '@store/authStore';
import { convex, ConvexProviderImpl } from '@services/convex';
import { useAppInfo } from '@store/appConfigStore';
import { ToastProvider, useToast } from '@components/common/Toast';
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <Root>
              <AppGate />
            </Root>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

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
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    (async () => {
      await Promise.all([
        hydrateUser(), hydrateReading(), hydrateMemo(),
        hydrateStats(), hydrateTasbeeh(), hydrateLang(),
        hydrateAuth(), hydrateQuiz(), hydrateSettings(), hydrateKhatma(), hydrateTajweed(), hydrateWird(), hydratePrefs(), hydrateAppConfig(), hydrateAudio(),
      ]);
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
      <Stack.Screen name="library" />
      <Stack.Screen name="search" options={{ presentation: 'modal' }} />
      <Stack.Screen name="player" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function SplashView() {
  const t = useTheme();
  const APP_INFO = useAppInfo();
  const quranFont = t.fontFamilies.arabicQuran;
  return (
    <LinearGradient colors={['#0E261E', '#081712', '#040C09']} style={styles.splash}>
      <View style={styles.bgPattern} pointerEvents="none">
        {/* Subtle Concentric Circles */}
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 250 + i * 110,
              height: 250 + i * 110,
              borderRadius: 2000,
              borderWidth: 0.8,
              borderColor: 'rgba(212, 181, 112, 0.05)',
              top: '50%', left: '50%',
              transform: [{ translateX: -(125 + i * 55) }, { translateY: -(125 + i * 55) }],
            }}
          />
        ))}
      </View>

      <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
         {/* Rub el Hizb framing the Bismillah (Larger so it doesn't cross the text) */}
         <View style={{ position: 'absolute', opacity: 0.6 }}>
            <Svg width={200} height={200} viewBox="0 0 100 100">
               <Rect x={18} y={18} width={64} height={64} fill="rgba(212, 181, 112, 0.03)" stroke="rgba(212, 181, 112, 0.4)" strokeWidth={0.5} />
               <Rect x={18} y={18} width={64} height={64} fill="rgba(212, 181, 112, 0.03)" stroke="rgba(212, 181, 112, 0.4)" strokeWidth={0.5} transform="rotate(45 50 50)" />
            </Svg>
         </View>
         
         <Text style={{ fontSize: 56, color: '#E8C77F', fontFamily: 'serif', marginTop: -5, textShadowColor: 'rgba(212, 181, 112, 0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 }}>
            ﷽
         </Text>
      </View>

      <Text style={[styles.brandName, { fontFamily: quranFont }]}>{APP_INFO.name}</Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 16 }}>
         <View style={{ width: 40, height: 1, backgroundColor: 'rgba(212, 181, 112, 0.3)' }} />
         <Text style={styles.brandTagline}>صُحبة مع القرآن</Text>
         <View style={{ width: 40, height: 1, backgroundColor: 'rgba(212, 181, 112, 0.3)' }} />
      </View>

      <View style={{ marginTop: 60 }}>
        <ActivityIndicator color="#D4B570" size="large" />
      </View>

      {APP_INFO.charityNotice ? (
        <View style={styles.charityWrap}>
          <Text style={styles.charityText}>{APP_INFO.charityNotice}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bgPattern: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 52, fontWeight: '500', color: '#FDFBF7', marginTop: 10, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 8 },
  brandTagline: { fontSize: 13, color: '#D4B570', letterSpacing: 1.5, fontWeight: '600', fontFamily: 'IBMPlexSansArabic_500Medium' },

  charityWrap: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  charityText: {
    color: 'rgba(245, 239, 224, 0.5)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
