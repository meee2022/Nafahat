import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { Surah } from '@/types/index';
import { arabicNumber } from '@data/surahs';

interface Props {
  surah: Surah;
  onPress?: () => void;
  isLastRead?: boolean;
  hasBookmark?: boolean;
}

/**
 * بطاقة سورة — بطاقة ملوّنة جريئة بخلفية متدرّجة:
 * - حاوية مستديرة بإطار ذهبي خفيف + ظلّ ناعم + تدرّج لوني هادئ
 * - رصيعة ذهبية كاملة (نجمة ٨ + دائرة) حول الرقم
 * - اسم السورة كبير وجريء
 * - شارة نوع ممتلئة الخلفية + عدد آيات
 * - عمود يمين بشارة "ج/ص" واضحة
 */
export const SurahListItem: React.FC<Props> = ({ surah, onPress, isLastRead }) => {
  const t = useTheme();
  const [hovered, setHovered] = useState(false);

  const isMeccan = surah.revelationType === 'meccan';
  const typeColor = isMeccan ? t.colors.featureSaffron : t.colors.primary;
  const typeLabel = isMeccan ? 'مكية' : 'مدنية';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      android_ripple={{ color: t.colors.primarySoft }}
      style={({ pressed }) => [
        styles.cardWrap,
        {
          borderColor: hovered ? t.colors.accent + '60' : t.colors.borderGold,
          shadowColor: t.colors.shadowColor,
          shadowOffset: { width: 0, height: hovered ? 8 : 3 },
          shadowOpacity: hovered ? 0.12 : 0.06,
          shadowRadius: hovered ? 16 : 10,
          elevation: hovered ? 5 : 2,
          transform: [
            { scale: pressed ? 0.985 : 1 },
            { translateY: hovered && Platform.OS === 'web' ? -2 : 0 },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[t.colors.surface, t.colors.accent + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardInner}
      >
        {/* رصيعة الرقم — نجمة ذهبية ٨ */}
        <View style={styles.numberWrap}>
          <Svg width={56} height={56} viewBox="0 0 64 64">
            <Defs>
              <SvgGradient id={`star-${surah.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%"   stopColor={t.colors.accent} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={t.colors.accent} stopOpacity="0.05" />
              </SvgGradient>
            </Defs>
            <Path
              d="M32,4 L36,20 L52,12 L44,28 L60,32 L44,36 L52,52 L36,44 L32,60 L28,44 L12,52 L20,36 L4,32 L20,28 L12,12 L28,20 Z"
              fill={`url(#star-${surah.id})`}
              stroke={t.colors.accentDeep}
              strokeWidth={1}
              strokeOpacity={0.8}
            />
            <Circle cx="32" cy="32" r="18" fill={t.colors.surface} stroke={t.colors.accentDeep} strokeWidth="1.2" strokeOpacity="0.8" />
            <Circle cx="32" cy="32" r="14" fill="none" stroke={t.colors.accentDeep} strokeWidth="0.5" strokeOpacity="0.5" />
          </Svg>
          <Text
            style={{
              position: 'absolute',
              fontSize: 16,
              fontWeight: '800',
              color: t.colors.primaryDark,
              letterSpacing: -0.3,
            }}
          >
            {arabicNumber(surah.id)}
          </Text>
        </View>

        {/* اسم السورة + الميتا */}
        <View style={{ flex: 1, marginStart: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontFamily: t.fontFamilies.arabicQuran,
                fontSize: 24,
                color: t.colors.primaryDark,
              }}
            >
              سورة {surah.nameAr}
            </Text>
            {isLastRead ? (
              <View style={[styles.lastReadDot, { backgroundColor: t.colors.success }]} />
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '18', borderColor: typeColor + '45' }]}>
              <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: typeColor, letterSpacing: 0.2 }}>
                {typeLabel}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: t.colors.textSecondary, fontWeight: '700' }}>
              {arabicNumber(surah.versesCount)} آية
            </Text>
          </View>
        </View>

        {/* عمود يمين — شارة جزء/صفحة */}
        <View style={styles.rightCol}>
          <View style={[styles.juzPill, { backgroundColor: t.colors.primaryDark, borderColor: t.colors.primaryDark }]}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: t.colors.accent, letterSpacing: 0.5 }}>
              الجزء {arabicNumber(surah.juzStart)}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: t.colors.textTertiary, marginTop: 6, fontWeight: '700' }}>
            صفحة {arabicNumber(surah.pageStart)}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardWrap: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  numberWrap: {
    width: 56, height: 56,
    alignItems: 'center', justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typeDot: {
    width: 5, height: 5, borderRadius: 3,
  },
  rightCol: {
    alignItems: 'center',
    minWidth: 56,
  },
  juzPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 50,
    borderWidth: StyleSheet.hairlineWidth,
  },
  lastReadDot: {
    width: 6, height: 6, borderRadius: 3,
  },
});
