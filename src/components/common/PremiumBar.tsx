import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Gift } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';

interface Props {
  onPremium?: () => void;
  onRewards?: () => void;
}

/**
 * شريط سفلي يحتوي على بطاقتين بارزتين:
 * "نَفَحات الذهبي" + "جوائز نَفَحات"
 * مستوحى من التطبيقات الإسلامية الكبيرة.
 */
export const PremiumBar: React.FC<Props> = ({ onPremium, onRewards }) => {
  const t = useTheme();
  return (
    <View style={[styles.row, { gap: t.spacing.md }]}>
      <Pressable onPress={onPremium} style={({ pressed }) => [{ flex: 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <LinearGradient
          colors={['#1E3A5F', '#0F2647']}
          style={[styles.card, { borderRadius: t.radius.lg }]}
        >
          <View style={[styles.iconBox, { backgroundColor: t.colors.accent }]}>
            <Crown size={20} color="#fff" fill="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="subtitle" color="#fff">نَفَحات الذهبي</Text>
            <Text variant="caption" color="rgba(255,255,255,0.7)" style={{ marginTop: 2 }}>
              تجربة مميزة بلا إعلانات
            </Text>
          </View>
        </LinearGradient>
      </Pressable>

      <Pressable onPress={onRewards} style={({ pressed }) => [{ flex: 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <LinearGradient
          colors={['#0E5C58', '#062E2B']}
          style={[styles.card, { borderRadius: t.radius.lg }]}
        >
          <View style={[styles.iconBox, { backgroundColor: '#D97755' }]}>
            <Gift size={20} color="#fff" fill="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="subtitle" color="#fff">جوائز نَفَحات</Text>
            <Text variant="caption" color="rgba(255,255,255,0.7)" style={{ marginTop: 2 }}>
              اكسب نقاطًا بأعمالك
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  card: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 76,
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
