import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, Animated } from 'react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useT } from '@store/languageStore';
import { TranslationKey } from '@/i18n/index';
import {
  TabHomeIcon, TabMushafIcon, TabMemoIcon, TabListenIcon, TabAccountIcon,
} from '@components/tabs/TabIcons';

/**
 * شريط التبويبات السفلي - يستخدم ألوان theme الحالية:
 * - فاتح في الـ light mode، داكن في الـ dark mode
 * - مؤشر active: أيقونة أكبر + نقطة ذهبية فوقها + خلفية pill خفيفة
 * - spring animation لطيف عند تبديل التبويب
 */
export default function TabsLayout() {
  const t = useTheme();

  return (
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
      <Tabs.Screen name="index"        options={{ tabBarIcon: ({ focused }) => <TabItem icon="home" labelKey="tabs.home" focused={focused} /> }} />
      <Tabs.Screen name="mushaf"       options={{ tabBarIcon: ({ focused }) => <TabItem icon="book" labelKey="tabs.mushaf" focused={focused} /> }} />
      <Tabs.Screen name="memorization" options={{ tabBarIcon: ({ focused }) => <TabItem icon="brain" labelKey="tabs.memorization" focused={focused} /> }} />
      <Tabs.Screen name="reciters"     options={{ tabBarIcon: ({ focused }) => <TabItem icon="headphones" labelKey="tabs.listen" focused={focused} /> }} />
      <Tabs.Screen name="account"      options={{ tabBarIcon: ({ focused }) => <TabItem icon="user" labelKey="tabs.account" focused={focused} /> }} />
    </Tabs>
  );
}

type IconName = 'home' | 'book' | 'brain' | 'headphones' | 'user';

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
