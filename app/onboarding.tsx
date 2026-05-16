import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Brain, Headphones, Sparkles, Globe, Check } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { useUserStore } from '@store/index';
import { useLanguageStore, useT } from '@store/languageStore';
import { useAuthStore } from '@store/authStore';
import { LANGUAGES } from '@/i18n/index';
import { Text } from '@components/ui';
import { useAppInfo } from '@store/appConfigStore';

interface Slide {
  icon: React.ReactNode;
  title: string;
  desc: string;
  isLangPicker?: boolean;
}

const GOLD = '#D4B570';
const GOLD_SOFT = 'rgba(212, 181, 112, 0.12)';
const GOLD_BORDER = 'rgba(212, 181, 112, 0.35)';
const WHITE_DIM = 'rgba(253, 251, 247, 0.72)';
const EMERALD_BG: [string, string, string] = ['#0D2B20', '#0A1F17', '#061109'];

/** رصيعة ذهبية كصندوق الأيقونة */
const GoldIconBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ width: 104, height: 104, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={104} height={104} viewBox="0 0 104 104" style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGradient id="ibg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D4B570" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#D4B570" stopOpacity="0.05" />
        </SvgGradient>
      </Defs>
      <Path
        d="M52,8 L57,36 L84,22 L70,48 L98,52 L70,56 L84,82 L57,68 L52,96 L47,68 L20,82 L34,56 L6,52 L34,48 L20,22 L47,36 Z"
        fill="url(#ibg)"
        stroke="#D4B570"
        strokeWidth={1}
        strokeOpacity={0.55}
      />
      <Circle cx="52" cy="52" r="35" fill="rgba(13,43,32,0.7)" stroke="#D4B570" strokeWidth={1} strokeOpacity={0.5} />
      <Circle cx="52" cy="52" r="28" fill="none" stroke="#D4B570" strokeWidth={0.4} opacity={0.4} />
    </Svg>
    {children}
  </View>
);

/** خط فاصل ذهبي */
const GoldRule: React.FC = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10, width: '100%' }}>
    <View style={{ flex: 1, height: 0.8, backgroundColor: GOLD_BORDER }} />
    <Text style={{ color: GOLD, fontSize: 14 }}>✦</Text>
    <View style={{ flex: 1, height: 0.8, backgroundColor: GOLD_BORDER }} />
  </View>
);

export default function Onboarding() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const APP_INFO = useAppInfo();
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest);
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = [
    {
      icon: <Globe size={46} color={GOLD} strokeWidth={1.4} />,
      title: tr('onboard.langTitle'),
      desc:  tr('onboard.langDesc'),
      isLangPicker: true,
    },
    {
      icon: <BookOpen size={46} color={GOLD} strokeWidth={1.4} />,
      title: tr('onboard.slide1Title'),
      desc:  tr('onboard.slide1Desc'),
    },
    {
      icon: <Brain size={46} color={GOLD} strokeWidth={1.4} />,
      title: tr('onboard.slide2Title'),
      desc:  tr('onboard.slide2Desc'),
    },
    {
      icon: <Headphones size={46} color={GOLD} strokeWidth={1.4} />,
      title: tr('onboard.slide3Title'),
      desc:  tr('onboard.slide3Desc'),
    },
    {
      icon: <Sparkles size={46} color={GOLD} strokeWidth={1.4} />,
      title: tr('onboard.slide4Title'),
      desc:  tr('onboard.slide4Desc'),
    },
  ];

  const isLast = index === slides.length - 1;
  const slide = slides[index];

  const enterAsGuest = async () => {
    completeOnboarding();
    await signInAsGuest();
    router.replace('/(tabs)');
  };

  const next = () => {
    if (isLast) enterAsGuest();
    else setIndex((i) => i + 1);
  };

  return (
    <LinearGradient colors={EMERALD_BG} style={styles.container}>
      {/* دوائر خلفية خافتة */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[380, 560, 720].map((size, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: size, height: size, borderRadius: size / 2,
              borderWidth: 0.5, borderColor: 'rgba(212, 181, 112, 0.05)',
              top: '50%', left: '50%',
              transform: [{ translateX: -size / 2 }, { translateY: -size / 2 }],
            }}
          />
        ))}
      </View>

      {/* شريط أعلى */}
      <View style={styles.top}>
        {!slide.isLangPicker ? (
          <Pressable
            onPress={enterAsGuest}
            hitSlop={10}
            style={{ borderWidth: 1, borderColor: GOLD_BORDER, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5 }}
          >
            <Text style={{ color: GOLD, fontSize: 13, fontWeight: '600' }}>{tr('onboard.skip')}</Text>
          </Pressable>
        ) : <View />}
      </View>

      {/* محتوى الشريحة */}
      <View style={styles.center}>
        {slide.isLangPicker ? (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <GoldIconBox>{slide.icon}</GoldIconBox>

            <Text variant="display" color="#FDFBF7" align="center" style={{ marginTop: 20, fontSize: 24, fontWeight: '800' }}>
              {slide.title}
            </Text>
            <Text variant="body" color={WHITE_DIM} align="center" style={{ marginTop: 8, maxWidth: 300, lineHeight: 22 }}>
              {slide.desc}
            </Text>

            <GoldRule />

            <ScrollView
              style={{ width: '100%', maxHeight: 295 }}
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
                        backgroundColor: active ? GOLD_SOFT : 'rgba(255,255,255,0.04)',
                        borderColor: active ? GOLD : 'rgba(255,255,255,0.1)',
                        borderWidth: active ? 1.5 : 1,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{l.flag}</Text>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: active ? GOLD : '#FDFBF7', fontSize: 15, fontWeight: '700', textAlign: 'right' }}>
                        {l.nameNative}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, textAlign: 'right' }}>
                        {l.nameEn}{l.rtl ? '  ·  RTL' : ''}
                      </Text>
                    </View>
                    {active ? (
                      <View style={[styles.checkBox, { backgroundColor: GOLD }]}>
                        <Check size={13} color="#071410" strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={[styles.checkBox, { borderColor: 'rgba(255,255,255,0.22)', borderWidth: 1.5 }]} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <>
            <GoldIconBox>{slide.icon}</GoldIconBox>
            <Text variant="display" color="#FDFBF7" align="center" style={{ marginTop: 28, fontSize: 26, fontWeight: '800' }}>
              {slide.title}
            </Text>
            <GoldRule />
            <Text variant="body" color={WHITE_DIM} align="center" style={{ maxWidth: 320, lineHeight: 26 }}>
              {slide.desc}
            </Text>
          </>
        )}
      </View>

      {/* الأسفل */}
      <View style={styles.bottom}>
        {isLast && APP_INFO.charityNotice ? (
          <View style={styles.charityBadge}>
            <View style={styles.charityDot} />
            <Text style={styles.charityBadgeText}>{APP_INFO.charityNotice}</Text>
            <View style={styles.charityDot} />
          </View>
        ) : null}

        {/* نقاط التقدم */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? GOLD : 'rgba(212, 181, 112, 0.22)',
                  width: i === index ? 28 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* زر CTA بتدرج ذهبي */}
        <Pressable
          onPress={next}
          style={({ pressed }) => [
            styles.cta,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={['#E5C97A', '#C9A84C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
          <Text style={{ color: '#071410', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 }}>
            {isLast ? tr('onboard.start') : `${tr('onboard.next')} ◀`}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 44 },
  top: { alignItems: 'flex-end', minHeight: 36, marginBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bottom: { gap: 18 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },

  cta: {
    height: 58, alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#D4B570', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 10,
  },

  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12,
  },
  checkBox: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  charityBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(212, 181, 112, 0.10)',
    borderWidth: 1, borderColor: 'rgba(212, 181, 112, 0.30)', alignSelf: 'center',
  },
  charityDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: GOLD },
  charityBadgeText: { color: '#FBF7EA', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
