import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
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
import { useUserStore, useReadingStore, useMemoStore, useStatsStore, useTasbeehStore, useQuizStore, useSettingsStore, useKhatmaStore, useTajweedStore, useWirdStore, useUserPrefsStore, useAppConfigStore } from '@store/index';
import { useLanguageStore } from '@store/languageStore';
import { useAuthStore } from '@store/authStore';
import { convex, ConvexProviderImpl } from '@services/convex';
import { useAppInfo } from '@store/appConfigStore';

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
          <Root>
            <AppGate />
          </Root>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppGate() {
  const router = useRouter();
  const segments = useSegments();
  const [hydrated, setHydrated] = useState(false);

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
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    (async () => {
      await Promise.all([
        hydrateUser(), hydrateReading(), hydrateMemo(),
        hydrateStats(), hydrateTasbeeh(), hydrateLang(),
        hydrateAuth(), hydrateQuiz(), hydrateSettings(), hydrateKhatma(), hydrateTajweed(), hydrateWird(), hydratePrefs(), hydrateAppConfig(),
      ]);
      setTimeout(() => setHydrated(true), 900);
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
      <Stack.Screen name="zakat" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="mosques" />
      <Stack.Screen name="wird" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="notes" />
      <Stack.Screen name="review" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="journey" />
      <Stack.Screen name="ayah-of-day" />
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
    <LinearGradient colors={['#143229', '#0A1815', '#070F0D']} style={styles.splash}>
      <View style={styles.bgPattern} pointerEvents="none">
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 200 + i * 80,
              height: 200 + i * 80,
              borderRadius: 1000,
              borderWidth: 0.5,
              borderColor: 'rgba(212, 181, 112, 0.06)',
              top: '50%', left: '50%',
              transform: [{ translateX: -(100 + i * 40) }, { translateY: -(100 + i * 40) }],
            }}
          />
        ))}
      </View>

      <View style={styles.frameOuter}>
        <View style={styles.frameInner}>
          <Text style={styles.glyph}>﷽</Text>
        </View>
      </View>

      <Text style={[styles.brandName, { fontFamily: quranFont }]}>{APP_INFO.name}</Text>
      <Text style={styles.brandTagline}>◇  صُحبة مع القرآن  ◇</Text>

      <View style={{ marginTop: 48 }}>
        <ActivityIndicator color="#D4B570" />
      </View>

      {/* شارة "صدقة جارية" في أسفل الـ Splash */}
      {APP_INFO.charityNotice ? (
        <View style={styles.charityWrap}>
          <View style={styles.charityDot} />
          <Text style={styles.charityText}>{APP_INFO.charityNotice}</Text>
          <View style={styles.charityDot} />
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bgPattern: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frameOuter: {
    width: 144, height: 144,
    borderWidth: 1,
    borderColor: 'rgba(212, 181, 112, 0.5)',
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  frameInner: {
    width: 96, height: 96,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 181, 112, 0.7)',
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  glyph: { fontSize: 38, color: '#D4B570', fontFamily: 'serif', fontWeight: '500' },
  brandName: { fontSize: 46, fontWeight: '500', color: '#F5EFE0', marginTop: 30 },
  brandTagline: { fontSize: 12, color: '#D4B570', marginTop: 10, letterSpacing: 1, fontWeight: '600', fontFamily: 'IBMPlexSansArabic_500Medium' },

  charityWrap: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  charityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4B570',
    opacity: 0.7,
  },
  charityText: {
    color: 'rgba(245, 239, 224, 0.75)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
