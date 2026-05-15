import React from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, Pattern, Rect, G } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { arabicNumber } from '@data/surahs';
import { OrnamentalRule } from '@components/ornaments';

interface Props {
  surahName?: string | null;
  ayahNumber?: number;
  page?: number;
  progress?: number;
  onContinue?: () => void;
  onStart?: () => void;
}

const W = Dimensions.get('window').width;

/**
 * بطاقة "آخر قراءة" بتصميم مخطوط:
 * - خلفية زمردية بنقش هندسي إسلامي شفّاف
 * - إطار ذهبي مزدوج
 * - رقم آية بخط ذهبي ضخم
 * - زخرفة زاوية + رصيعة عليا
 */
export const LastReadCard: React.FC<Props> = ({
  surahName, ayahNumber, page, progress = 0, onContinue, onStart,
}) => {
  const t = useTheme();
  const hasLastRead = !!surahName;
  const cardWidth = W - 32;

  return (
    <Pressable onPress={hasLastRead ? onContinue : onStart} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <View style={[styles.card, { minHeight: 280, borderRadius: 4 }]}>
        {/* الخلفية المتدرجة */}
        <LinearGradient
          colors={t.mode === 'dark'
            ? ['#0A1815', '#143229', '#1B4039']
            : ['#0A3D38', '#0F4A41', '#062825']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* نقش هندسي شفّاف على الخلفية */}
        <Svg
          width="100%" height="100%"
          style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
          pointerEvents="none"
        >
          <Defs>
            <Pattern id="bg-stars" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <Path
                d="M20,4 L24,16 L36,20 L24,24 L20,36 L16,24 L4,20 L16,16 Z"
                fill="none"
                stroke="#C9A961"
                strokeWidth={0.5}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bg-stars)" />
        </Svg>

        {/* لمعة ذهبية في الزاوية */}
        <Svg
          width={180} height={180}
          style={[styles.cornerGlow, { opacity: 0.6 }]}
          pointerEvents="none"
        >
          <Defs>
            <Pattern id="glow-grad" patternUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
              <Circle cx="90" cy="90" r="90" fill="#C9A961" />
            </Pattern>
          </Defs>
          <Circle cx="90" cy="90" r="90" fill="#C9A961" opacity={0.06} />
        </Svg>

        {/* إطار ذهبي داخلي مزدوج */}
        <View style={[styles.outerFrame, { borderColor: 'rgba(212, 181, 112, 0.45)' }]} />
        <View style={[styles.innerFrame, { borderColor: 'rgba(212, 181, 112, 0.22)' }]} />

        {/* المحتوى */}
        <View style={styles.content}>
          {/* الترويسة */}
          <View style={styles.eyebrow}>
            <View style={[styles.eyebrowDot, { backgroundColor: '#D4B570' }]} />
            <Text variant="caption" color="#D4B570" style={styles.eyebrowText}>
              {hasLastRead ? '◇  آخر قراءة  ◇' : '◇  ابدأ رحلتك  ◇'}
            </Text>
            <View style={[styles.eyebrowDot, { backgroundColor: '#D4B570' }]} />
          </View>

          {/* العنوان */}
          {hasLastRead ? (
            <>
              <Text style={[styles.surahName, { color: '#F5EFE0' }]}>
                {surahName}
              </Text>
              <View style={{ marginTop: 6 }}>
                <OrnamentalRule width={cardWidth * 0.4} color="#C9A961" variant="rosette" />
              </View>
              <View style={styles.meta}>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaBigNum, { color: '#D4B570' }]}>
                    {arabicNumber(ayahNumber ?? 1)}
                  </Text>
                  <Text variant="caption" color="rgba(245, 239, 224, 0.55)" style={{ letterSpacing: 1 }}>
                    آية
                  </Text>
                </View>
                {page ? (
                  <>
                    <View style={[styles.metaDivider, { backgroundColor: 'rgba(212, 181, 112, 0.3)' }]} />
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaBigNum, { color: '#D4B570' }]}>
                        {arabicNumber(page)}
                      </Text>
                      <Text variant="caption" color="rgba(245, 239, 224, 0.55)" style={{ letterSpacing: 1 }}>
                        صفحة
                      </Text>
                    </View>
                  </>
                ) : null}
                <View style={[styles.metaDivider, { backgroundColor: 'rgba(212, 181, 112, 0.3)' }]} />
                <View style={styles.metaItem}>
                  <Text style={[styles.metaBigNum, { color: '#D4B570' }]}>
                    {Math.round(progress * 100)}<Text style={{ fontSize: 18, color: '#D4B570' }}>٪</Text>
                  </Text>
                  <Text variant="caption" color="rgba(245, 239, 224, 0.55)" style={{ letterSpacing: 1 }}>
                    من الختمة
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.surahName, { color: '#F5EFE0' }]}>افتح المصحف</Text>
              <View style={{ marginTop: 6 }}>
                <OrnamentalRule width={cardWidth * 0.4} color="#C9A961" variant="rosette" />
              </View>
              <Text variant="body" color="rgba(245, 239, 224, 0.72)" style={{ marginTop: 12, lineHeight: 24, fontStyle: 'italic' }}>
                «وَرَتِّلِ ٱلْقُرْآنَ تَرْتِيلًا»
              </Text>
              <Text variant="caption" color="rgba(212, 181, 112, 0.75)" style={{ marginTop: 6 }}>
                المزّمل · ٤
              </Text>
            </>
          )}

          {/* زر الإكمال */}
          <View style={styles.cta}>
            <View style={[styles.ctaInner, { borderColor: '#C9A961' }]}>
              <Text variant="label" color="#F5EFE0" style={styles.ctaText}>
                {hasLastRead ? 'تابع القراءة' : 'افتح المصحف'}
              </Text>
              <ArrowLeft size={14} color="#D4B570" />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: '#0A3D38',
    shadowColor: '#0A3D38',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  outerFrame: {
    position: 'absolute',
    top: 8, left: 8, right: 8, bottom: 8,
    borderWidth: 1,
  },
  innerFrame: {
    position: 'absolute',
    top: 14, left: 14, right: 14, bottom: 14,
    borderWidth: 0.5,
  },
  cornerGlow: {
    position: 'absolute',
    // في RTL: start = اليمين، فتظهر اللمعة في الزاوية العلوية اليمنى (الزاوية الافتتاحية)
    top: -80, start: -80,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 24,
    flex: 1,
    justifyContent: 'space-between',
    gap: 14,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  eyebrowDot: {
    width: 4, height: 4, borderRadius: 2,
  },
  eyebrowText: {
    letterSpacing: 3,
    fontWeight: '500',
    fontSize: 11,
  },
  surahName: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 18,
  },
  metaItem: { alignItems: 'center', gap: 2 },
  metaBigNum: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
    letterSpacing: -1,
  },
  metaDivider: { width: 1, height: 28 },
  cta: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  ctaText: { letterSpacing: 1, fontSize: 12, fontWeight: '600' },
});
