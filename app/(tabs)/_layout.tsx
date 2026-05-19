import React, { useEffect, useRef } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Platform, StyleSheet, View, Animated, Pressable } from 'react-native';
import { Play, Pause, X, Library } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useT } from '@store/languageStore';
import { TranslationKey } from '@/i18n/index';
import { useAudioStore } from '@store/index';
import {
  TabHomeIcon, TabMushafIcon, TabMemoIcon, TabListenIcon, TabAccountIcon,
} from '@components/tabs/TabIcons';

/**
 * 🟢 شريط التبويبات السفلي — Nafahat green + gold identity.
 *
 * البنية الجديدة (V2): 4 tabs فقط. القديمة كانت 5.
 *   - index        → المصحف (الـ landing الخضراء + Continue reading)
 *   - memorization → الحفظ
 *   - daily        → اليومي (الصلاة + الأذكار + آية اليوم)
 *   - account      → أنا (الملف + الإحصائيات + الأدوات + الإعدادات)
 *
 * الـ tabs المخفية (تبقى accessible عبر روابط لكن مش في الـ bar):
 *   - mushaf       → الفهرس القديم (يدخل دلوقتي من /library)
 *   - reciters     → catalog القراء (يدخل دلوقتي من المصحف)
 *
 * مؤشر active: أيقونة بـ background ذهبي خفيف + bar ذهبي تحت — يربط هوية الذهب.
 */
export default function TabsLayout() {
  const t = useTheme();

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textTertiary,
        tabBarItemStyle: { flex: 1 },
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          flexDirection: 'row',
          shadowColor: t.colors.shadowColor,
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.06,
          shadowRadius: 18,
          elevation: 10,
        },
      }}
    >
      {/* الـ tabs المرئية - 5 tabs */}
      <Tabs.Screen name="index"        options={{ tabBarIcon: ({ focused }) => <TabItem icon="home"       labelKey="tabs.home"         focused={focused} /> }} />
      <Tabs.Screen name="mushaf"       options={{ tabBarIcon: ({ focused }) => <TabItem icon="book"       labelKey="tabs.mushaf"       focused={focused} /> }} />
      <Tabs.Screen name="memorization" options={{ tabBarIcon: ({ focused }) => <TabItem icon="brain"      labelKey="tabs.memorization" focused={focused} /> }} />
      <Tabs.Screen name="library"      options={{ tabBarIcon: ({ focused }) => <TabItem icon="library"   labelKey="tabs.library"      focused={focused} /> }} />
      <Tabs.Screen name="account"      options={{ tabBarIcon: ({ focused }) => <TabItem icon="user"       labelKey="tabs.account"      focused={focused} /> }} />

      {/* tabs مخفية — accessible عبر روابط لكن مش في الـ tab bar */}
      <Tabs.Screen name="daily"    options={{ href: null }} />
      <Tabs.Screen name="reciters" options={{ href: null }} />
    </Tabs>

    {/* 🎧 Floating Now Playing bar — يظهر فوق الـ tab bar في كل التطبيق
        لما الصوت شغّال. يخفي نفسه لو مفيش audio current. */}
    <FloatingNowPlaying />
    </View>
  );
}

// ─────────────── Floating Now Playing ───────────────
const TAB_BAR_HEIGHT_IOS = 88;
const TAB_BAR_HEIGHT_ANDROID = 70;

const FloatingNowPlaying: React.FC = () => {
  const t = useTheme();
  const router = useRouter();
  const current = useAudioStore((s) => s.current);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const toggle = useAudioStore((s) => s.toggle);
  const stop = useAudioStore((s) => s.stop);

  if (!current) return null;

  const tabH = Platform.OS === 'ios' ? TAB_BAR_HEIGHT_IOS : TAB_BAR_HEIGHT_ANDROID;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', bottom: tabH, left: 0, right: 0, paddingHorizontal: 10 }}
    >
      <View
        style={[
          floatStyles.bar,
          {
            backgroundColor: t.colors.surface,
            borderColor: t.colors.borderGold,
            shadowColor: t.colors.shadowColor,
          },
        ]}
      >
        <Pressable
          onPress={() => router.push('/player')}
          accessibilityRole="button"
          accessibilityLabel="فتح المشغّل الكامل"
          style={floatStyles.left}
        >
          <View style={[floatStyles.avatar, { backgroundColor: t.colors.primary, borderColor: t.colors.accent }]}>
            <Text style={{ color: t.colors.accent, fontSize: 12, fontWeight: '800' }}>
              {current.surahName.slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.colors.textPrimary, fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
              {current.surahName}
            </Text>
            <Text style={{ color: t.colors.textTertiary, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
              {current.reciter.nameAr}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'إيقاف' : 'تشغيل'}
          style={[floatStyles.playBtn, { backgroundColor: t.colors.primary, borderColor: t.colors.accent }]}
        >
          {isPlaying
            ? <Pause size={16} color={t.colors.accent} fill={t.colors.accent} />
            : <Play size={16} color={t.colors.accent} fill={t.colors.accent} style={{ marginLeft: 2 }} />}
        </Pressable>
        <Pressable
          onPress={stop}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="إغلاق"
          style={floatStyles.closeBtn}
        >
          <X size={16} color={t.colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
};

const floatStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36, height: 36,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  playBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  closeBtn: {
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
  },
});

type IconName = 'home' | 'book' | 'brain' | 'headphones' | 'user' | 'library';

const TabItem: React.FC<{ icon: IconName; labelKey: TranslationKey; focused: boolean }> = ({
  icon, labelKey, focused,
}) => {
  const tr = useT();
  const t = useTheme();
  const scale = useRef(new Animated.Value(focused ? 1.08 : 1)).current;
  const translateY = useRef(new Animated.Value(focused ? -2 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.08 : 1,
        damping: 14,
        stiffness: 180,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: focused ? -3 : 0,
        damping: 16,
        stiffness: 220,
        mass: 0.6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, translateY]);

  // الـ active بيستخدم لون الـ accent الذهبي، الـ inactive رمادي
  const iconColor = focused ? t.colors.accent : t.colors.textTertiary;
  const textColor = focused ? t.colors.primary : t.colors.textTertiary;
  const size = 26;

  const iconNode = (() => {
    switch (icon) {
      case 'home':       return <TabHomeIcon    size={size} color={iconColor} focused={focused} />;
      case 'book':       return <TabMushafIcon  size={size} color={iconColor} focused={focused} />;
      case 'brain':      return <TabMemoIcon    size={size} color={iconColor} focused={focused} />;
      case 'headphones': return <TabListenIcon  size={size} color={iconColor} focused={focused} />;
      case 'user':       return <TabAccountIcon size={size} color={iconColor} focused={focused} />;
      case 'library':    return <Library        size={size} color={iconColor} strokeWidth={focused ? 2.2 : 1.6} />;
    }
  })();

  return (
    <View style={styles.itemWrap}>
      <Animated.View
        style={[
          styles.iconBox,
          {
            transform: [{ scale }, { translateY }],
            backgroundColor: focused ? t.colors.accent + '22' : 'transparent',
            borderWidth: focused ? 1 : 0,
            borderColor: focused ? t.colors.accent + '40' : 'transparent',
          },
        ]}
      >
        {iconNode}
      </Animated.View>
      <Text
        style={{
          marginTop: 3,
          color: textColor,
          fontWeight: focused ? '800' : '500',
          fontSize: 10,
          letterSpacing: 0.3,
        }}
      >
        {tr(labelKey)}
      </Text>
      {focused ? (
        <View style={[styles.activeBar, { backgroundColor: t.colors.accent }]} />
      ) : (
        <View style={styles.barPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  itemWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 64,
    paddingTop: 2,
  },
  iconBox: {
    width: 48,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBar: {
    width: 20,
    height: 2.5,
    borderRadius: 1.5,
    marginTop: 3,
  },
  barPlaceholder: {
    width: 20,
    height: 2.5,
    marginTop: 3,
  },
});
