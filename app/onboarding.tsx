import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Brain, Headphones, Sparkles, Globe, Check } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { useUserStore } from '@store/index';
import { useLanguageStore, useT } from '@store/languageStore';
import { useAuthStore } from '@store/authStore';
import { LANGUAGES, LanguageCode } from '@/i18n/index';
import { Text } from '@components/ui';

interface Slide {
  icon: React.ReactNode;
  title: string;
  desc: string;
  isLangPicker?: boolean;
}

export default function Onboarding() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = [
    {
      icon: <Globe size={56} color="#fff" />,
      title: tr('onboard.langTitle'),
      desc:  tr('onboard.langDesc'),
      isLangPicker: true,
    },
    {
      icon: <BookOpen size={56} color="#fff" />,
      title: tr('onboard.slide1Title'),
      desc:  tr('onboard.slide1Desc'),
    },
    {
      icon: <Brain size={56} color="#fff" />,
      title: tr('onboard.slide2Title'),
      desc:  tr('onboard.slide2Desc'),
    },
    {
      icon: <Headphones size={56} color="#fff" />,
      title: tr('onboard.slide3Title'),
      desc:  tr('onboard.slide3Desc'),
    },
    {
      icon: <Sparkles size={56} color="#fff" />,
      title: tr('onboard.slide4Title'),
      desc:  tr('onboard.slide4Desc'),
    },
  ];

  const isLast = index === slides.length - 1;
  const slide = slides[index];

  const next = () => {
    if (isLast) {
      completeOnboarding();
      // التوجيه لصفحة الدخول/التسجيل (مع خيار "كزائر")
      router.replace('/login');
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/login');
  };

  return (
    <LinearGradient colors={[t.colors.primary, t.colors.primaryDark]} style={styles.container}>
      <View style={styles.top}>
        {!slide.isLangPicker ? (
          <Pressable onPress={handleSkip} hitSlop={10}>
            <Text color="rgba(255,255,255,0.85)">{tr('onboard.skip')}</Text>
          </Pressable>
        ) : <View />}
      </View>

      <View style={styles.center}>
        {slide.isLangPicker ? (
          /* خطوة اختيار اللغة */
          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              {slide.icon}
            </View>
            <Text variant="display" color="#fff" align="center" style={{ marginTop: 24, fontSize: 26 }}>
              {slide.title}
            </Text>
            <Text variant="body" color="rgba(255,255,255,0.85)" align="center" style={{ marginTop: 8, maxWidth: 320, lineHeight: 22 }}>
              {slide.desc}
            </Text>

            <ScrollView
              style={{ width: '100%', maxHeight: 320, marginTop: 18 }}
              contentContainerStyle={{ gap: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {LANGUAGES.map((l) => {
                const active = lang === l.code;
                return (
                  <Pressable
                    key={l.code}
                    onPress={() => setLang(l.code)}
                    style={({ pressed }) => [
                      styles.langRow,
                      {
                        backgroundColor: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                        borderColor: active ? '#D4B570' : 'rgba(255,255,255,0.15)',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{l.flag}</Text>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'right' }}>
                        {l.nameNative}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'right' }}>
                        {l.nameEn} {l.rtl ? '·  RTL' : ''}
                      </Text>
                    </View>
                    {active ? (
                      <View style={[styles.checkBox, { backgroundColor: '#D4B570' }]}>
                        <Check size={14} color={t.colors.primary} strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={[styles.checkBox, { borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1.5 }]} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          /* الخطوات العادية */
          <>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              {slide.icon}
            </View>
            <Text variant="display" color="#fff" align="center" style={{ marginTop: 32 }}>
              {slide.title}
            </Text>
            <Text variant="body" color="rgba(255,255,255,0.88)" align="center" style={{ marginTop: 12, maxWidth: 320, lineHeight: 26 }}>
              {slide.desc}
            </Text>
          </>
        )}
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.35)',
                  width: i === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={next}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: '#fff', borderRadius: t.radius.md, opacity: pressed ? 0.92 : 1 },
          ]}
        >
          <Text variant="button" color={t.colors.primaryDark} align="center">
            {isLast ? tr('onboard.start') : tr('onboard.next')}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  top: { alignItems: 'flex-start', minHeight: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  iconBox: { width: 100, height: 100, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  bottom: { gap: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  cta: { height: 56, alignItems: 'center', justifyContent: 'center' },

  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  checkBox: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
});
