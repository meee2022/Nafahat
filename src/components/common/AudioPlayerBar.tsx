import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, ProgressBar } from '@components/ui';
import { useAudioStore } from '@store/index';

export const AudioPlayerBar: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const t = useTheme();
  const { current, isPlaying, toggle, stop, positionMs, durationMs } = useAudioStore();

  if (!current) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.bar,
        {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          padding: t.spacing.sm,
          gap: t.spacing.sm,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={[styles.avatar, { backgroundColor: t.colors.primarySoft, borderRadius: 12 }]}>
          <Text variant="label" color={t.colors.primary}>{current.surahName.slice(0, 2)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="subtitle" numberOfLines={1}>{current.surahName}</Text>
          <Text variant="caption" color={t.colors.textSecondary} numberOfLines={1}>{current.reciter.nameAr}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable hitSlop={t.hitSlop} style={styles.iconBtn}>
            <SkipForward size={20} color={t.colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={toggle}
            style={[styles.playBtn, { backgroundColor: t.colors.primary, borderRadius: 999 }]}
          >
            {isPlaying ? <Pause size={20} color="#fff" fill="#fff" /> : <Play size={20} color="#fff" fill="#fff" />}
          </Pressable>
          <Pressable hitSlop={t.hitSlop} style={styles.iconBtn}>
            <SkipBack size={20} color={t.colors.textPrimary} />
          </Pressable>
          <Pressable onPress={stop} hitSlop={t.hitSlop} style={styles.iconBtn}>
            <X size={18} color={t.colors.textTertiary} />
          </Pressable>
        </View>
      </View>
      <ProgressBar value={progress} height={3} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth },
  avatar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
