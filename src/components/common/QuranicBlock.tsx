/**
 * 📖 QuranicBlock - بطاقة آيات قرآنية بأسلوب المصحف الموحَّد.
 *
 * تستخدم نفس AyahRosette SVG اللي في المصحف بالظبط - الرقم داخل الدائرة الذهبية،
 * وليس بجانبها. الآيات تتدفّق inline سطر متّصل (Madinah-style).
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, Text as RNText } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { AyahRosette } from '@components/mushaf/AyahRosette';

interface Props {
  body: string;
  source?: string;
  ayahNumbers?: number[];
  fontSize?: number;
}

/**
 * يحلّل النص ويُرجع مجموعات آيات (مجموعة لكل سورة).
 */
function parseQuranicBody(body: string): string[][] {
  const groups = body
    .split(/\n\n+/)
    .map((g) => g.trim())
    .filter(Boolean);
  return groups.map((group) =>
    group
      .split(/[۝﴿﴾]/g)
      .map((s) => s.replace(/\.+\s*$/, '').trim())
      .filter(Boolean),
  );
}

export const QuranicBlock: React.FC<Props> = ({ body, source, ayahNumbers, fontSize = 24 }) => {
  const t = useTheme();

  const quranFont = Platform.OS === 'web'
    ? '"KFGQPC Uthmanic Hafs", "Scheherazade New", "Amiri Quran", serif'
    : t.fontFamilies.arabicQuran;

  const parchment = '#FBF5E3';
  const gold = t.colors.accent;
  const goldDeep = t.colors.accentDeep;
  const ink = '#1A0A00';

  const ayahGroups = useMemo(() => parseQuranicBody(body), [body]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.outerFrame, { borderColor: goldDeep, backgroundColor: parchment }]}>
        <View style={[styles.innerFrame, { borderColor: gold }]}>
          <TopOrnament color={gold} accent={goldDeep} />

          {/* نص الآيات - يتدفّق inline مع رصائع SVG */}
          <View style={styles.bodyWrap}>
            {ayahGroups.map((group, groupIdx) => (
              <View
                key={groupIdx}
                style={[
                  styles.suraFlow,
                  // 🎯 Web: التدفّق الطبيعي للنص (justify) - مع inline-flex للرصائع
                  // Native: flexWrap row-reverse للالتفاف
                  Platform.OS === 'web'
                    ? ({ display: 'block' as any, ...({ textAlign: 'justify' } as any) })
                    : { flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center' },
                  groupIdx < ayahGroups.length - 1 && { marginBottom: 14 },
                ]}
              >
                {Platform.OS === 'web' ? (
                  // ━━━ WEB: نستخدم Text واحد يتدفّق طبيعياً + رصائع SVG inline-block
                  <RNText
                    allowFontScaling={false}
                    style={[
                      styles.flowText,
                      { color: ink, fontFamily: quranFont, fontSize, lineHeight: fontSize * 2.1 },
                    ]}
                  >
                    {group.map((ayah, idx) => {
                      const num = ayahNumbers?.[idx] ?? idx + 1;
                      return (
                        <RNText key={idx}>
                          {ayah}{' '}
                          {/* رصيعة SVG inline - تُعرض كـ inline-block على ويب */}
                          <RNText
                            // @ts-ignore - dangerouslySetInner... not available; use View as inline
                            style={{
                              ...({ display: 'inline-block', verticalAlign: 'middle' } as any),
                            }}
                          >
                            <InlineRosette number={num} size={fontSize * 1.05} gold={gold} parchment={parchment} />
                          </RNText>
                          {' '}
                        </RNText>
                      );
                    })}
                  </RNText>
                ) : (
                  // ━━━ NATIVE: flex row-reverse مع flexWrap (كل قطعة عنصر منفصل)
                  group.map((ayah, idx) => {
                    const num = ayahNumbers?.[idx] ?? idx + 1;
                    return (
                      <React.Fragment key={idx}>
                        <RNText
                          allowFontScaling={false}
                          style={[
                            styles.flowText,
                            { color: ink, fontFamily: quranFont, fontSize, lineHeight: fontSize * 2.1 },
                          ]}
                        >
                          {ayah}{' '}
                        </RNText>
                        <View style={{ marginHorizontal: 3, marginVertical: 2 }}>
                          <AyahRosette
                            number={num}
                            size={fontSize * 1.05}
                            goldColor={gold}
                            innerColor={parchment}
                          />
                        </View>
                      </React.Fragment>
                    );
                  })
                )}
              </View>
            ))}
          </View>

          <BottomOrnament color={gold} accent={goldDeep} />

          {source ? (
            <View style={styles.sourceWrap}>
              <Text style={[styles.sourceText, { color: goldDeep, fontFamily: quranFont }]}>
                ◇  {source}  ◇
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

/**
 * رصيعة inline تستخدم نفس تصميم AyahRosette لكن مغلّفة بـ View
 * يكون inline-block على web (يتدفّق مع النص).
 */
const InlineRosette: React.FC<{ number: number; size: number; gold: string; parchment: string }> = ({
  number, size, gold, parchment,
}) => (
  <View
    style={{
      width: size,
      height: size,
      ...(Platform.OS === 'web'
        ? ({ display: 'inline-flex', verticalAlign: 'middle' } as any)
        : {}),
    }}
  >
    <AyahRosette
      number={number}
      size={size}
      goldColor={gold}
      innerColor={parchment}
    />
  </View>
);

// ────── زخارف ──────
const TopOrnament: React.FC<{ color: string; accent: string }> = ({ color, accent }) => (
  <View style={{ alignItems: 'center', marginBottom: 14 }}>
    <Svg width={180} height={18} viewBox="0 0 180 18">
      <Defs>
        <SvgGradient id="qb-top" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={color} stopOpacity={0} />
          <Stop offset="50%" stopColor={color} stopOpacity={0.9} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d="M 8 9 L 78 9" stroke="url(#qb-top)" strokeWidth={0.8} />
      <Path d="M 102 9 L 172 9" stroke="url(#qb-top)" strokeWidth={0.8} />
      <Path d="M 90 2 L 96 9 L 90 16 L 84 9 Z" fill={color} opacity={0.9} />
      <Path d="M 90 4 L 94 9 L 90 14 L 86 9 Z" fill={accent} opacity={0.6} />
      <Circle cx="90" cy="9" r="1.2" fill="#FBF5E3" />
      <Circle cx="60" cy="9" r="1" fill={color} opacity={0.7} />
      <Circle cx="120" cy="9" r="1" fill={color} opacity={0.7} />
    </Svg>
  </View>
);

const BottomOrnament: React.FC<{ color: string; accent: string }> = ({ color, accent }) => (
  <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 4 }}>
    <Svg width={120} height={10} viewBox="0 0 120 10">
      <Path d="M 4 5 L 50 5" stroke={color} strokeWidth={0.6} opacity={0.55} />
      <Path d="M 70 5 L 116 5" stroke={color} strokeWidth={0.6} opacity={0.55} />
      <Path d="M 60 1 L 64 5 L 60 9 L 56 5 Z" fill={color} opacity={0.85} />
      <Path d="M 60 3 L 62 5 L 60 7 L 58 5 Z" fill={accent} opacity={0.6} />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginVertical: 4 },
  outerFrame: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#8B6F2C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  innerFrame: {
    borderWidth: 0.6,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  bodyWrap: {
    paddingHorizontal: 2,
  },
  suraFlow: {
    // flex خصائص تُحقَن inline حسب المنصّة
  },
  flowText: {
    textAlign: 'justify',
    writingDirection: 'rtl',
    letterSpacing: 0,
    fontWeight: '500',
  } as any,
  sourceWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
});
