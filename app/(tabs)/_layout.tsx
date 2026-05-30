import React, { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, StyleSheet, View, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, X } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useT } from '@store/languageStore';
import { TranslationKey } from '@/i18n/index';
import { useAudioStore } from '@store/index';
import {
  TabHomeIcon, TabMushafIcon, TabMemoIcon, TabListenIcon, TabAccountIcon, TabMoreIcon,
} from '@components/tabs/TabIcons';

/**
 * ارتفاع منطقة المحتوى (أيقونة + نص) بدون الـ safe area.
 * 56px = حجم Touch target مريح لكل المنصات.
 */
const TAB_CONTENT_H = 60;

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  // ارتفاع الـ tab bar الكلي = المحتوى + الـ safe area السفلية (home indicator في iOS)
  const tabBarHeight = TAB_CONTENT_H + insets.bottom;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: t.colors.primary,
          tabBarInactiveTintColor: t.colors.textTertiary,
          tabBarItemStyle: {
            flex: 1,
            // لا height ثابتة — العنصر يملأ منطقة المحتوى بالكامل فلا يفيض العنوان لتحت
            paddingVertical: 0,
          },
          tabBarStyle: {
            backgroundColor: t.colors.surface,
            borderTopColor: t.colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: tabBarHeight,
            paddingTop: 0,
            paddingBottom: insets.bottom,
            shadowColor: t.colors.shadowColor,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 12,
          },
        }}
      >
        {/* الـ tabs المرئية - 5 tabs */}
        <Tabs.Screen name="index"        options={{ tabBarIcon: ({ focused }) => <TabItem icon="home"  labelKey="tabs.home"         focused={focused} /> }} />
        <Tabs.Screen name="mushaf"       options={{ tabBarIcon: ({ focused }) => <TabItem icon="book"  labelKey="tabs.mushaf"       focused={focused} /> }} />
        <Tabs.Screen name="memorization" options={{ tabBarIcon: ({ focused }) => <TabItem icon="brain" labelKey="tabs.memorization" focused={focused} /> }} />
        <Tabs.Screen name="more"         options={{ tabBarIcon: ({ focused }) => <TabItem icon="more"  labelKey="tabs.more"         focused={focused} /> }} />
        <Tabs.Screen name="account"      options={{ tabBarIcon: ({ focused }) => <TabItem icon="user"  labelKey="tabs.account"      focused={focused} /> }} />

        {/* tabs مخفية — accessible عبر روابط لكن مش في الـ tab bar */}
        <Tabs.Screen name="library"  options={{ href: null }} />
        <Tabs.Screen name="daily"    options={{ href: null }} />
        <Tabs.Screen name="reciters" options={{ href: null }} />
      </Tabs>

      {/* 🎧 Floating Now Playing bar */}
      <FloatingNowPlaying tabBarHeight={tabBarHeight} />
    </View>
  );
}

// ─────────────── Floating Now Playing ───────────────

interface FloatingProps {
  tabBarHeight: number;
}

const FloatingNowPlaying: React.FC<FloatingProps> = ({ tabBarHeight }) => {
  const t = useTheme();
  const router = useRouter();
  const current = useAudioStore((s) => s.current);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const toggle = useAudioStore((s) => s.toggle);
  const stop = useAudioStore((s) => s.stop);

  if (!current) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', bottom: tabBarHeight, left: 0, right: 0, paddingHorizontal: 12 }}
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
          hitSlop={6}
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
          hitSlop={10}
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
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  avatar: {
    width: 38, height: 38,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  playBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  closeBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─────────────── Tab Item ───────────────

type IconName = 'home' | 'book' | 'brain' | 'headphones' | 'user' | 'more';

const TabItem: React.FC<{ icon: IconName; labelKey: TranslationKey; focused: boolean }> = ({
  icon, labelKey, focused,
}) => {
  const tr = useT();
  const t = useTheme();
  const scale = useRef(new Animated.Value(focused ? 1.06 : 1)).current;
  const translateY = useRef(new Animated.Value(focused ? -2 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.06 : 1,
        damping: 15,
        stiffness: 200,
        mass: 0.65,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: focused ? -2 : 0,
        damping: 18,
        stiffness: 240,
        mass: 0.55,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, translateY]);

  const iconColor = focused ? t.colors.accent : t.colors.textTertiary;
  const textColor = focused ? t.colors.primary : t.colors.textTertiary;
  const iconSize = 24;

  const iconNode = (() => {
    switch (icon) {
      case 'home':       return <TabHomeIcon    size={iconSize} color={iconColor} focused={focused} />;
      case 'book':       return <TabMushafIcon  size={iconSize} color={iconColor} focused={focused} />;
      case 'brain':      return <TabMemoIcon    size={iconSize} color={iconColor} focused={focused} />;
      case 'headphones': return <TabListenIcon  size={iconSize} color={iconColor} focused={focused} />;
      case 'user':       return <TabAccountIcon size={iconSize} color={iconColor} focused={focused} />;
      case 'more':       return <TabMoreIcon    size={iconSize} color={iconColor} focused={focused} />;
    }
  })();

  return (
    /* flex: 1 بيجعل العنصر ياخد مساحته من الـ tabBarItemStyle بدل width ثابتة */
    <View style={styles.itemWrap}>
      <Animated.View
        style={[
          styles.iconBox,
          {
            transform: [{ scale }, { translateY }],
            backgroundColor: focused ? t.colors.accent + '20' : 'transparent',
            borderWidth: focused ? 1 : 0,
            borderColor: focused ? t.colors.accent + '40' : 'transparent',
          },
        ]}
      >
        {iconNode}
      </Animated.View>
      <Text
        style={{
          marginTop: 2,
          color: textColor,
          fontWeight: focused ? '800' : '500',
          fontSize: 10,
          lineHeight: 13,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
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
    flex: 1,
    height: TAB_CONTENT_H,
    alignItems: 'center',
    justifyContent: 'center',
    // لا width ثابتة — بيتمدد مع الشاشة
  },
  iconBox: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBar: {
    width: 18,
    height: 2.5,
    borderRadius: 1.5,
    marginTop: 3,
  },
  barPlaceholder: {
    width: 18,
    height: 2.5,
    marginTop: 3,
  },
});
