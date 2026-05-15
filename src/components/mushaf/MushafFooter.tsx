/**
 * شريط أسفل صفحة المصحف:
 * [👁️]  ─  [٣]  مع زخرفات معيّن أنيقة
 */
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Eye } from 'lucide-react-native';
import { arabicNumber } from '@data/surahs';

interface Props {
  pageNumber: number;
  onReadMode?: () => void;
  goldColor?: string;
  textColor?: string;
  amiriFont: string;
}

export const MushafFooter: React.FC<Props> = ({
  pageNumber,
  onReadMode,
  goldColor = '#B89456',
  textColor = '#3D2817',
  amiriFont,
}) => {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onReadMode}
        hitSlop={10}
        style={({ pressed }) => [styles.iconWrap, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Eye size={18} color={textColor} strokeWidth={1.8} />
      </Pressable>

      {/* خط فاصل ذهبي رفيع مع معيّن مركزي */}
      <View style={styles.divider}>
        <Svg width="100%" height={8} viewBox="0 0 100 8" preserveAspectRatio="none">
          <Path d="M 0 4 L 42 4" stroke={goldColor} strokeWidth={0.5} opacity={0.55} />
          <Path d="M 50 1 L 54 4 L 50 7 L 46 4 Z" fill={goldColor} opacity={0.85} />
          <Path d="M 58 4 L 100 4" stroke={goldColor} strokeWidth={0.5} opacity={0.55} />
        </Svg>
      </View>

      <Text style={[styles.pageNum, { color: textColor, fontFamily: amiriFont }]}>
        {arabicNumber(pageNumber)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    flex: 1,
  },
  pageNum: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
});
