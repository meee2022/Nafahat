/**
 * 📖 صفحة مصحف المدينة بنظام QCF v4 الكامل.
 *
 *  - 15 سطر مطابق بالظبط لمصحف المدينة المنوّرة.
 *  - رؤوس السور (QCF4_QBSML) برسم زخرفي.
 *  - البسملة كسطر مستقل بخط Hafs.
 *  - كل كلمة Pressable مع تظليل ذكي للآية المختارة/الجارية.
 *
 * مصدر البيانات والخطوط: npm package "quran-qcf4" عبر jsDelivr CDN.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text as RNText, Platform, Pressable } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import {
  fetchQpcPageWithRetry,
  loadFontsForPage,
  getQpcFontFamily,
  preloadQpcPages,
  type QpcPageData,
  type QpcWord,
  type QpcLine,
} from '@services/quranComApi';

interface Props {
  pageNumber: number;
  goldColor?: string;
  inkColor?: string;
  pageColor?: string;

  selectedVerseKey?: string | null;
  playingVerseKey?: string | null;
  currentWordLocation?: string | null;

  onWordPress?: (word: QpcWord) => void;
  onWordLongPress?: (word: QpcWord) => void;

  fontSize?: number;
}

const MushafQpcPageImpl: React.FC<Props> = ({
  pageNumber,
  goldColor,
  inkColor,
  pageColor,
  selectedVerseKey,
  playingVerseKey,
  currentWordLocation,
  onWordPress,
  onWordLongPress,
  fontSize: explicitFontSize,
}) => {
  const t = useTheme();
  const [pageData, setPageData] = useState<QpcPageData | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  // 📏 أبعاد الصفحة المتاحة - تُقاس من onLayout. نستخدمها لتكييف fontSize
  //    بحيث ما يطلعش نص فوق إطار المصحف لا أفقياً ولا عمودياً.
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);

  const gold   = goldColor ?? t.colors.accent;
  const ink    = inkColor  ?? t.colors.textPrimary;
  const pageBg = pageColor ?? t.colors.background;

  // 🎯 fontSize ديناميكي مقيّد بـ width + height معاً:
  //   - widthBased: pageWidth / 18 لمساحة تنفّس أفقياً + سقف 24
  //   - heightBased: 15 سطر × lineHeight 1.85 + منطقة الأمان يجب ألا يتجاوز pageHeight
  //   نأخذ الأصغر من الاتنين عشان النص ما يتقصّش لا من الجنب ولا من تحت.
  // سقف العرض أكبر على الشاشات العريضة (لوحي/أفقي واسع) لقراءة أكبر،
  // مع بقاء قيد الارتفاع (heightBased) حارساً يمنع تجاوز النص للإطار.
  const widthCap = pageWidth >= 700 ? 35 : 26;
  const fontSize = explicitFontSize ?? (() => {
    if (pageWidth === 0 || pageHeight === 0) return 18;
    const widthBased  = Math.min(widthCap, pageWidth / 16.75);
    // The 15 QCF lines use a 1.85 line box. Reserve the real page padding plus
    // a glyph-overhang guard: QCF marks can paint below their nominal Text box
    // on iOS. This keeps line 15 clear of the lower Ottoman ornament while
    // preserving almost the same reading size.
    const heightBased = (pageHeight - 48) / 27.75;
    return Math.max(13, Math.min(widthBased, heightBased));
  })();

  useEffect(() => {
    let mounted = true;
    setPageData(null);
    setReady(false);
    setError(null);

    fetchQpcPageWithRetry(pageNumber, 3)
      .then(async (data) => {
        if (!mounted) return;
        await loadFontsForPage(data);
        if (!mounted) return;
        setPageData(data);
        setReady(true);
        // One adjacent page is enough; loading two while the user flips quickly
        // can overwhelm iOS networking and produce intermittent CDN failures.
        preloadQpcPages([pageNumber + 1]);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message ?? 'تعذّر تحميل الصفحة');
      });

    return () => { mounted = false; };
  }, [pageNumber, retryKey]);

  if (error) {
    return (
      <View style={[styles.fallback, { backgroundColor: pageBg }]}>
        <AlertCircle size={28} color={t.colors.textTertiary} />
        <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 10, textAlign: 'center' }}>
          تعذّر تحميل الصفحة {pageNumber}
        </Text>
        <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 4, textAlign: 'center' }}>
          تأكّد من الاتصال بالإنترنت
        </Text>
        <Pressable
          onPress={() => setRetryKey((value) => value + 1)}
          style={{ marginTop: 14, borderWidth: 1, borderColor: gold, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 }}
        >
          <Text variant="bodySm" color={gold}>إعادة المحاولة</Text>
        </Pressable>
      </View>
    );
  }

  if (!pageData || !ready) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={gold} size="large" />
        <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 14 }}>
          جاري تحميل صفحة المصحف...
        </Text>
        <Text variant="caption" color={t.colors.textTertiary} style={{ marginTop: 4 }}>
          المرة الأولى قد تأخذ ثوانٍ
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.page, { backgroundColor: pageBg }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        const h = e.nativeEvent.layout.height;
        if (Math.abs(w - pageWidth) > 1) setPageWidth(w);
        if (Math.abs(h - pageHeight) > 1) setPageHeight(h);
      }}
    >
      {pageData.lines.map((line) => {
        // علامة "تمّت السورة" تظهر فقط بعد سطر فيه آيات فعلية (word/end) ويليه
        // عنوان سورة جديدة (surah_header). كده ما تظهرش بالغلط تحت اسم السورة
        // الجديدة (لأن سطر العنوان يليه بسملة).
        return (
          <React.Fragment key={line.line}>
            <MushafLine
              line={line}
              fontSize={fontSize}
              inkColor={ink}
              goldColor={gold}
              pageColor={pageBg}
              selectedVerseKey={selectedVerseKey ?? null}
              playingVerseKey={playingVerseKey ?? null}
              currentWordLocation={currentWordLocation ?? null}
              onWordPress={onWordPress}
              onWordLongPress={onWordLongPress}
            />
            {/* 🌿 End-of-Surah ornament — يظهر بعد آخر سطر في السورة قبل
                الـ surah header للسورة اللي بعدها. زخرفة عثمانية أنيقة. */}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─────────────── End-of-Surah ornament ───────────────
const SurahEndOrnament: React.FC<{ goldColor: string; fontSize: number }> = ({ goldColor, fontSize }) => (
  <View style={styles.surahEndRow}>
    <View style={[styles.surahEndLine, { backgroundColor: goldColor, opacity: 0.5 }]} />
    <View style={[styles.surahEndDot, { borderColor: goldColor }]}>
      <View style={[styles.surahEndDotInner, { backgroundColor: goldColor }]} />
    </View>
    <RNText
      allowFontScaling={false}
      style={{
        color: goldColor,
        fontSize: Math.max(10, fontSize * 0.55),
        fontWeight: '700',
        letterSpacing: 1.5,
        marginHorizontal: 8,
      }}
    >
      ❋ تمّت السورة ❋
    </RNText>
    <View style={[styles.surahEndDot, { borderColor: goldColor }]}>
      <View style={[styles.surahEndDotInner, { backgroundColor: goldColor }]} />
    </View>
    <View style={[styles.surahEndLine, { backgroundColor: goldColor, opacity: 0.5 }]} />
  </View>
);

// 🚀 memo: ما يعملش re-render إلا لو props اتغيّرت فعلاً
//   (selectedVerseKey, playingVerseKey, pageNumber, ...). يوقف flicker على
//   كل state-tick في الـ parent.
export const MushafQpcPage = React.memo(MushafQpcPageImpl);
MushafQpcPage.displayName = 'MushafQpcPage';

// ─────────────── سطر واحد ───────────────

interface LineProps {
  line: QpcLine;
  fontSize: number;
  inkColor: string;
  goldColor: string;
  pageColor: string;
  selectedVerseKey: string | null;
  playingVerseKey: string | null;
  currentWordLocation: string | null;
  onWordPress?: (word: QpcWord) => void;
  onWordLongPress?: (word: QpcWord) => void;
}

const MushafLine: React.FC<LineProps> = ({
  line,
  fontSize,
  inkColor,
  goldColor,
  pageColor,
  selectedVerseKey,
  playingVerseKey,
  currentWordLocation,
  onWordPress,
  onWordLongPress,
}) => {
  // تحديد نوع السطر: header / bismillah / normal
  const isHeader = line.words.length === 1 && line.words[0].type === 'surah_header';
  const isBismillah = line.words.length === 1 && line.words[0].type === 'bismillah';
  // QCF pages normally use one font per line.  The outer Text must use that
  // font too: Android calculates the line box from the parent Text, and using
  // the system font there can clip the taller QCF glyphs rendered by children.
  const lineFontFamily = getQpcFontFamily(line.words[0]?.font ?? 'QCF4_Hafs_01');

  if (isHeader) {
    const w = line.words[0];
    return (
      <View style={[styles.surahHeaderLine, { height: fontSize * 1.85 }]}> 
        <RNText
          allowFontScaling={false}
          style={{
            fontFamily: getQpcFontFamily(w.font),
            fontSize: fontSize + 4,
            color: goldColor,
            lineHeight: fontSize * 1.85,
            letterSpacing: 0,
            writingDirection: 'rtl',
            textAlign: 'center',
            includeFontPadding: true as any,
          }}
        >
          {w.char}
        </RNText>
      </View>
    );
  }

  if (isBismillah) {
    const w = line.words[0];
    return (
      <View style={[styles.bismillahLine, { height: fontSize * 1.85 }]}> 
        <RNText
          allowFontScaling={false}
          style={{
            fontFamily: getQpcFontFamily(w.font),
            fontSize: fontSize + 2,
            color: inkColor,
            lineHeight: fontSize * 1.85,
            letterSpacing: 0,
            writingDirection: 'rtl',
            textAlign: 'center',
            includeFontPadding: true as any,
          }}
        >
          {w.char}
        </RNText>
      </View>
    );
  }

  // ─── سطر عادي ───
  // 🔑 نرسم كل السطر كـ <Text> أب واحد فيه <Text> متداخل لكل كلمة.
  //   ده بيخلّي محرّك تخطيط النصوص يتعامل مع المسافات بين الكلمات بشكل طبيعي
  //   (زي مصحف المدينة بالظبط)، بدل ما كل كلمة تبقى في صندوق flex منفصل — اللي
  //   كان بيفقد التباعد الطبيعي ويخلّي النص يبان مقطّعاً بفجوات غير منتظمة.
  //   كل كلمة متداخلة تحتفظ بـ onPress + تظليل (backgroundColor) الخاص بيها.
  //   numberOfLines=1 + adjustsFontSizeToFit يضمنوا دخول السطر كامل بدون قصّ.
  const selectedBg = goldColor + '33';
  const playingBg  = goldColor + '22';
  const currentBg  = goldColor + '55';

  // Android treats QCF private-use glyphs as direction-neutral characters.
  // A nested Text therefore lets the bidi engine place the first word on the
  // left. Use a physical row-reverse layout instead: source word #1 is always
  // the rightmost item and playback proceeds right-to-left deterministically.
  if (Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web') {
    return (
      <View style={[styles.line, styles.androidGlyphRow, { direction: 'ltr' } as any]}>
        {line.words.map((w, i) => {
          const isSel = !!selectedVerseKey && w.verse_key === selectedVerseKey;
          const isPlay = !!playingVerseKey && w.verse_key === playingVerseKey;
          const isCur = !!currentWordLocation && w.verse_key && w.position
            ? `${w.verse_key}:${w.position}` === currentWordLocation
            : false;
          const isEnd = w.type === 'end';
          const bg = isCur ? currentBg : isPlay ? playingBg : isSel ? selectedBg : 'transparent';
          return (
            <RNText
              key={`${line.line}-${w.position ?? i}-${w.code}`}
              allowFontScaling={false}
              onPress={onWordPress ? () => onWordPress(w) : undefined}
              onLongPress={onWordLongPress ? () => onWordLongPress(w) : undefined}
              style={{
                fontFamily: getQpcFontFamily(w.font),
                fontSize,
                lineHeight: fontSize * 1.85,
                includeFontPadding: true,
                // QCF glyphs intentionally overhang their advance box. A
                // standalone Text per word lets iOS crop that overhang (for
                // example the second lower dot in «يُنقذون»). Grow the paint
                // box while cancelling the added layout width.
                paddingHorizontal: 3,
                marginHorizontal: -3,
                paddingVertical: 2,
                marginVertical: -2,
                overflow: 'visible',
                color: isEnd ? goldColor : inkColor,
                backgroundColor: bg,
              }}
            >
              {w.char}
            </RNText>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.line} {...({ dir: 'rtl' } as any)}>
      <RNText
        allowFontScaling={false}
        // @ts-ignore
        style={{
          fontFamily: lineFontFamily,
          fontSize,
          lineHeight: fontSize * 1.85,
          color: inkColor,
          writingDirection: 'rtl',
          textAlign: 'center',
          letterSpacing: 0,
          // ✅ includeFontPadding=true يمنع قصّ النقط/الأطراف السفلية للحروف
          //    (مثلاً نقطتي الياء في «يُنقِذُونِ» كانتا تُقصّان فتبدو باءً).
          //    lineHeight الصريح (1.7×) كافٍ لاحتواء الـ padding بدون تغيير ارتفاع السطر.
          includeFontPadding: true as any,
          textAlignVertical: 'center' as any,
        }}
      >
        {line.words.map((w, i) => {
          const isSel  = !!selectedVerseKey && w.verse_key === selectedVerseKey;
          const isPlay = !!playingVerseKey && w.verse_key === playingVerseKey;
          const isCur  = !!currentWordLocation && w.verse_key && w.position
            ? `${w.verse_key}:${w.position}` === currentWordLocation
            : false;
          const isEnd = w.type === 'end';
          const bg = isCur
            ? currentBg
            : isPlay
              ? playingBg
              : isSel
                ? selectedBg
                : 'transparent';

          return (
            <RNText
              key={`${line.line}-${i}-${w.code}`}
              allowFontScaling={false}
              onPress={onWordPress ? () => onWordPress(w) : undefined}
              onLongPress={onWordLongPress ? () => onWordLongPress(w) : undefined}
              // @ts-ignore
              style={{
                fontFamily: getQpcFontFamily(w.font),
                includeFontPadding: true as any,
                color: isEnd ? goldColor : inkColor,
                backgroundColor: bg,
              }}
            >
              {w.char}
            </RNText>
          );
        })}
      </RNText>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 8,
    // QCF diacritics and lower dots extend outside the nominal line box.
    // Keep this as genuine empty space instead of letting line 15 paint over
    // the inner frame and its lower ornament.
    paddingBottom: 26,
    // توزيع موحّد لسطور صفحة المدينة، مع منطقة الأمان السفلية أعلاه.
    justifyContent: 'space-between',
    // Do not crop QCF glyph overhangs. Some Quranic marks intentionally extend
    // beyond the nominal font box, especially on Android after font scaling.
    overflow: 'visible',
  },
  line: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
    // Per-row padding multiplied by 15 was silently consuming the safety area
    // at the bottom of dense pages. Glyph paint padding lives on each word.
    paddingVertical: 0,
    overflow: 'visible',
    // ⚠️ بدون overflow:'hidden' هنا — كان يقصّ النقط السفلية للحروف.
    //    الحماية من الفيضان موجودة على مستوى .page (الإطار الخارجي).
  },
  androidGlyphRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'nowrap',
  },
  lineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  surahEndRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  surahEndLine: {
    flex: 1,
    height: 0.7,
  },
  surahEndDot: {
    width: 8, height: 8,
    borderRadius: 4,
    borderWidth: 0.7,
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 3,
  },
  surahEndDotInner: {
    width: 3, height: 3,
    borderRadius: 1.5,
  },
  surahHeaderLine: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    overflow: 'visible',
  },
  bismillahLine: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    overflow: 'visible',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 300,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 300,
  },
});
