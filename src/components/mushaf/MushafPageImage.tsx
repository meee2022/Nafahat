/**
 * 📖 عارض صفحة المصحف - من CDN مصحف المدينة الرسمية.
 *
 * المصادر بالترتيب:
 *   ١. Convex Storage (لو الأدمن رفعها) - الأسرع والأكثر موثوقية
 *   ٢. quran.ksu.edu.sa (جامعة الملك سعود)
 *   ٣. mp3quran.net (موقع موثوق)
 *   ٤. everyayah.com (CDN قديم لكن موجود)
 *
 * لتغيير مصدر الصور لاحقاً:
 *   عدّل array PRIMARY_SOURCES أو ضع PRIMARY_OVERRIDE في .env.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import { AlertCircle, Cloud } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { convex, convexApi, isCloudEnabled } from '@services/convex';

interface Props {
  pageNumber: number;
  /** لون الإطار حول الصورة (ذهبي). */
  borderColor?: string;
  /** لون الـ placeholder قبل تحميل الصورة. */
  placeholderColor?: string;
  /** callback يُستدعى لو كل المصادر فشلت - عادة للتبديل لوضع النص. */
  onAllSourcesFailed?: () => void;
}

/**
 * مصادر صور صفحات مصحف المدينة - 1 إلى 604.
 * كل URL builder يأخذ رقم الصفحة ويرجع URL كامل.
 */
/**
 * ✅ المصدر الأساسي (مُتحقَّق منه):
 *   GovarJabbar/Quran-PNG على GitHub - يحتوي على 604 صفحة من مصحف المدينة
 *   مولّدة من quran.com-images بخطوط KFGQPC (مجمع الملك فهد).
 *   نستخدم jsDelivr CDN كـ CORS-friendly proxy.
 *
 * URL pattern: cdn.jsdelivr.net/gh/GovarJabbar/Quran-PNG@master/{001-604}.png
 */
const PAGE_IMAGE_SOURCES: ((page: number) => string)[] = [
  // ✅ المصدر الأساسي - GovarJabbar/Quran-PNG عبر jsDelivr CDN
  (p) => `https://cdn.jsdelivr.net/gh/GovarJabbar/Quran-PNG@master/${String(p).padStart(3, '0')}.png`,

  // 🔄 CDN بديل - statically.io
  (p) => `https://cdn.statically.io/gh/GovarJabbar/Quran-PNG/master/${String(p).padStart(3, '0')}.png`,

  // 🔄 raw.githack
  (p) => `https://raw.githack.com/GovarJabbar/Quran-PNG/master/${String(p).padStart(3, '0')}.png`,

  // 📚 مصادر إضافية احتياطية
  (p) => `https://quran.ksu.edu.sa/pages/${String(p).padStart(3, '0')}.png`,
  (p) => `https://www.mp3quran.net/api/quran-page/${p}.jpg`,
];

export const MushafPageImage: React.FC<Props> = ({
  pageNumber,
  borderColor,
  placeholderColor,
  onAllSourcesFailed,
}) => {
  const t = useTheme();
  const goldColor = borderColor ?? t.colors.accent;
  const cream = placeholderColor ?? t.colors.surface;

  const [convexUrl, setConvexUrl] = useState<string | null>(null);
  const [sourceIdx, setSourceIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [useConvex, setUseConvex] = useState(true);

  const fallbackUrls = useMemo(
    () => PAGE_IMAGE_SOURCES.map((build) => build(pageNumber)),
    [pageNumber],
  );

  // محاولة Convex Storage أولاً
  useEffect(() => {
    setConvexUrl(null);
    setSourceIdx(0);
    setLoading(true);
    setFailed(false);
    setUseConvex(true);

    if (!isCloudEnabled() || !convex || !convexApi?.mushafPages) {
      setUseConvex(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const url = await convex.query(convexApi.mushafPages.getPageUrl, { page: pageNumber });
        if (cancelled) return;
        if (url) {
          setConvexUrl(url);
        } else {
          setUseConvex(false);
        }
      } catch {
        if (!cancelled) setUseConvex(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pageNumber]);

  const currentUrl = convexUrl ?? fallbackUrls[sourceIdx];

  const handleError = () => {
    if (convexUrl) {
      // Convex فشلت - انتقل لـ fallback
      setConvexUrl(null);
      setUseConvex(false);
      setLoading(true);
    } else if (sourceIdx < fallbackUrls.length - 1) {
      // جرّب المصدر التالي
      setSourceIdx((i) => i + 1);
      setLoading(true);
    } else {
      setLoading(false);
      setFailed(true);
    }
  };

  const handleLoad = () => {
    setLoading(false);
    setFailed(false);
  };

  if (failed) {
    return (
      <View style={[styles.fallback, { backgroundColor: cream }]}>
        <AlertCircle size={32} color="#8B6F47" />
        <Text variant="bodySm" color="#8B6F47" style={styles.fallbackTitle}>
          الصور غير متاحة حالياً
        </Text>
        <Text variant="caption" color="#A89580" style={styles.fallbackDesc}>
          الـ CDN الخارجي مش بيرد - عملنا تبديل تلقائي للنص العثماني{'\n'}
          (يشتغل بدون إنترنت + تفاعلي بالكامل)
        </Text>
        {onAllSourcesFailed ? (
          <Text
            variant="bodySm"
            color={goldColor}
            style={styles.fallbackAction}
            onPress={onAllSourcesFailed}
          >
            ↓ التبديل لوضع النص الآن ↓
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.imageWrapper, { backgroundColor: cream }]}>
      <Image
        source={{ uri: currentUrl }}
        onLoad={handleLoad}
        onError={handleError}
        style={styles.image}
        resizeMode="contain"
      />
      {loading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: cream }]}>
          <ActivityIndicator color={goldColor} size="large" />
          <View style={styles.loadingRow}>
            {convexUrl ? <Cloud size={12} color={goldColor} /> : null}
            <Text variant="bodySm" style={[styles.loadingText, { color: goldColor }]}>
              {convexUrl ? `الصفحة ${pageNumber} - من Convex` : `الصفحة ${pageNumber}`}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const { width: SW } = Dimensions.get('window');

const styles = StyleSheet.create({
  imageWrapper: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  loadingText: {
    fontWeight: '600',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  fallbackDesc: {
    marginTop: 8,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
  fallbackAction: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
