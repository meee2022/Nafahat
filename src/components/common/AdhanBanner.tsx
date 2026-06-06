import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VolumeX } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useAdhanPlaybackStore } from '@store/adhanPlaybackStore';
import { stopAdhan } from '@services/adhan';

/**
 * 🕌 بانر عائم يظهر فوق كل الشاشات طول ما الأذان يُرفع، وفيه زرار «إسكات»
 *    حتى يقدر المستخدم يوقف الأذان من أي مكان (مش من شاشة المواقيت فقط).
 */
export const AdhanBanner: React.FC = () => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const playing = useAdhanPlaybackStore((s) => s.playing);
  const prayerLabel = useAdhanPlaybackStore((s) => s.prayerLabel);

  if (!playing) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { top: insets.top + 8 },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: t.colors.primary,
            borderColor: t.colors.accent,
            shadowColor: t.colors.shadowColor,
          },
        ]}
      >
        <Text style={{ fontSize: 18 }}>🕌</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.colors.onPrimary, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>
            {prayerLabel ? `حيّ على الصلاة — ${prayerLabel}` : 'يُرفَع الأذان الآن'}
          </Text>
        </View>
        <Pressable
          onPress={() => { stopAdhan().catch(() => {}); }}
          accessibilityRole="button"
          accessibilityLabel="إسكات الأذان"
          hitSlop={10}
          style={[styles.stopBtn, { backgroundColor: t.colors.onPrimary }]}
        >
          <VolumeX size={16} color={t.colors.primary} />
          <Text style={{ color: t.colors.primary, fontSize: 13, fontWeight: '800' }}>إسكات</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 9999,
    elevation: 9999,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    ...(Platform.OS === 'android' ? { elevation: 12 } : null),
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
});
