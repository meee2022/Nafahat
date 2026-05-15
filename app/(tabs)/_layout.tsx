import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, Animated } from 'react-native';
import { Home, BookOpen, Brain, Headphones, User } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useT } from '@store/languageStore';
import { TranslationKey } from '@/i18n/index';

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
  const scale = useRef(new Animated.Value(focused ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.1 : 1,
      damping: 14,
      stiffness: 180,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  const color = focused ? t.colors.primary : t.colors.textTertiary;
  const strokeWidth = focused ? 2.2 : 1.6;
  const size = 22;

  const iconNode = (() => {
    switch (icon) {
      case 'home':       return <Home       size={size} color={color} strokeWidth={strokeWidth} />;
      case 'book':       return <BookOpen   size={size} color={color} strokeWidth={strokeWidth} />;
      case 'brain':      return <Brain      size={size} color={color} strokeWidth={strokeWidth} />;
      case 'headphones': return <Headphones size={size} color={color} strokeWidth={strokeWidth} />;
      case 'user':       return <User       size={size} color={color} strokeWidth={strokeWidth} />;
    }
  })();

  return (
    <View style={styles.itemWrap}>
      {focused ? (
        <View style={[styles.activeDot, { backgroundColor: t.colors.accent }]} />
      ) : (
        <View style={styles.dotPlaceholder} />
      )}
      <Animated.View style={{ transform: [{ scale }] }}>
        {iconNode}
      </Animated.View>
      <Text
        style={{
          marginTop: 4,
          color,
          fontWeight: focused ? '700' : '500',
          fontSize: 10,
          letterSpacing: 0.3,
        }}
      >
        {tr(labelKey)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  itemWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    marginBottom: 4,
  },
  dotPlaceholder: {
    width: 4, height: 4,
    marginBottom: 4,
  },
});
