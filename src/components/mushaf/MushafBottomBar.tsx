/**
 * 🎛️ شريط أسفل صفحة المصحف - بالتصميم المرجعي بالظبط.
 *
 *  ┌────────────────────────────────────────────────────────┐
 *  │       ━━━━━━     [ بصوت: علي العجمي ]      ━━━━━━    │
 *  │  [👁]            [ ▶  استمع للسورة  ]            ┃ ٣ ┃ │
 *  └────────────────────────────────────────────────────────┘
 *
 * - زر عين 👁 على اليمين (تبديل وضع القراءة)
 * - رقم الصفحة على اليسار
 * - في المنتصف: شارة "بصوت: ..." فوق + زر "استمع للسورة" ذهبي
 * - خطوط أفقية رفيعة على جانبي المنتصف
 */
import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Eye, Play, Pause, BookOpen } from 'lucide-react-native';
import { arabicNumber } from '@data/surahs';

interface Props {
  pageNumber: number;
  reciterName: string;
  isPlaying: boolean;
  onPlay: () => void;
  onToggleMode?: () => void;
  onPagePress?: () => void;
  /** يُستدعى عند الضغط على شارة القارئ - عادة يفتح modal اختيار القارئ. */
  onChangeReciter?: () => void;
  /** يُستدعى عند الضغط على زر التفسير - يفتح قائمة آيات الصفحة. */
  onOpenTafsir?: () => void;
  goldColor?: string;
  goldDeep?: string;
  textColor?: string;
  pageColor?: string;
  buttonBg?: string;
  amiriFont: string;
}

export const MushafBottomBar: React.FC<Props> = ({
  pageNumber,
  reciterName,
  isPlaying,
  onPlay,
  onToggleMode,
  onPagePress,
  onChangeReciter,
  onOpenTafsir,
  goldColor = '#C9A84C',
  goldDeep  = '#8B6F2C',
  textColor = '#3D2B1F',
  pageColor = '#F3E9D2',
  buttonBg  = '#F5EDD8',
  amiriFont,
}) => {
  return (
    <View style={[styles.wrap, { backgroundColor: pageColor }]}>
      {/* خط ذهبي علوي رفيع */}
      <View style={[styles.topDivider, { backgroundColor: goldColor }]} />

      <View style={styles.row}>
        {/* رقم الصفحة - يسار */}
        <Pressable onPress={onPagePress} hitSlop={10} style={styles.sideSection}>
          <Text style={[styles.pageNum, { color: textColor, fontFamily: amiriFont }]}>
            {arabicNumber(pageNumber)}
          </Text>
        </Pressable>

        {/* القسم الأوسط - شارة القارئ + زر التشغيل */}
        <View style={styles.centerSection}>
          {/* خطين على الجانبين */}
          <View style={[styles.sideLine, { backgroundColor: goldColor }]} />

          <View style={styles.centerStack}>
            {/* شارة القارئ - بتفتح modal لتغيير القارئ */}
            <Pressable
              onPress={onChangeReciter}
              style={({ pressed }) => [
                styles.reciterChip,
                {
                  backgroundColor: buttonBg,
                  borderColor: goldColor,
                  opacity: pressed && onChangeReciter ? 0.75 : 1,
                },
              ]}
            >
              <Text style={[styles.reciterText, { color: textColor }]} numberOfLines={1}>
                بصوت: {reciterName}
              </Text>
            </Pressable>

            {/* الزر الذهبي الكبير */}
            <Pressable
              onPress={onPlay}
              style={({ pressed }) => [
                styles.playButton,
                {
                  backgroundColor: goldDeep,
                  opacity: pressed ? 0.88 : 1,
                  shadowColor: goldDeep,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'إيقاف' : 'استمع للسورة'}
            >
              {isPlaying ? (
                <Pause size={16} color="#fff" fill="#fff" />
              ) : (
                <Play size={16} color="#fff" fill="#fff" style={{ marginStart: 2 }} />
              )}
              <Text style={styles.playButtonText}>
                {isPlaying ? 'إيقاف' : 'استمع للسورة'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.sideLine, { backgroundColor: goldColor }]} />
        </View>

        {/* الأزرار اليمنى - تفسير + تبديل وضع */}
        <View style={styles.sideButtonsGroup}>
          {onOpenTafsir ? (
            <Pressable
              onPress={onOpenTafsir}
              hitSlop={10}
              style={({ pressed }) => [
                styles.smallBtn,
                {
                  backgroundColor: buttonBg,
                  borderColor: goldColor,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="تفسير الآيات"
            >
              <BookOpen size={16} color={textColor} strokeWidth={1.8} />
            </Pressable>
          ) : null}

          <Pressable
            onPress={onToggleMode}
            hitSlop={10}
            style={({ pressed }) => [styles.eyeBtn, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="تبديل وضع القراءة"
          >
            <Eye size={20} color={textColor} strokeWidth={1.6} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    paddingHorizontal: 14,
  },
  topDivider: {
    height: 1,
    marginBottom: 10,
    opacity: 0.45,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sideSection: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  eyeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideLine: {
    flex: 1,
    height: 1,
    opacity: 0.4,
  },
  centerStack: {
    alignItems: 'center',
    gap: 6,
  },

  reciterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.7,
  },
  reciterText: {
    fontSize: 11,
    fontWeight: '700',
  },

  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
