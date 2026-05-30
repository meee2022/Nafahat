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
import { View, StyleSheet, ActivityIndicator, Text as RNText } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import {
  fetchQpcPage,
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
  // 📏 أبعاد الصفحة المتاحة - تُقاس من onLayout. نستخدمها لتكييف fontSize
  //    بحيث ما يطلعش نص فوق إطار المصحف لا أفقياً ولا عمودياً.
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);

  const gold   = goldColor ?? t.colors.accent;
  const ink    = inkColor  ?? t.colors.textPrimary;
  const pageBg = pageColor ?? t.colors.background;

  // 🎯 fontSize ديناميكي مقيّد بـ width + height معاً:
  //   - widthBased: pageWidth / 18 لمساحة تنفّس أفقياً + سقف 24
  //   - heightBased: 15 سطر × lineHeight 1.7 + padding 20 يجب أن لا يتجاوز pageHeight
  //     → fontSize ≤ (pageHeight - 20) / (15 × 1.7) ≈ (pageHeight - 20) / 25.5
  //   نأخذ الأصغر من الاتنين عشان النص ما يتقصّش لا من الجنب ولا من تحت.
  // سقف العرض أكبر على الشاشات العريضة (لوحي/أفقي واسع) لقراءة أكبر،
  // مع بقاء قيد الارتفاع (heightBased) حارساً يمنع تجاوز النص للإطار.
  const widthCap = pageWidth >= 700 ? 34 : 24;
  const fontSize = explicitFontSize ?? (() => {
    if (pageWidth === 0 || pageHeight === 0) return 18;
    const widthBased  = Math.min(widthCap, pageWidth / 18);
    const heightBased = (pageHeight - 20) / 25.5;
    return Math.max(13, Math.min(widthBased, heightBased));
  })();

  useEffect(() => {
    let mounted = true;
    setPageData(null);
    setReady(false);
    setError(null);

    fetchQpcPage(pageNumber)
      .then(async (data) => {
        if (!mounted) return;
        await loadFontsForPage(data);
        if (!mounted) return;
        setPageData(data);
        setReady(true);
        preloadQpcPages([pageNumber + 1, pageNumber + 2]);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message ?? 'تعذّر تحميل الصفحة');
      });

    return () => { mounted = false; };
  }, [pageNumber]);

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
      {pageData.lines.map((line, idx) => {
        // علامة "تمّت السورة" تظهر فقط بعد سطر فيه آيات فعلية (word/end) ويليه
        // عنوان سورة جديدة (surah_header). كده ما تظهرش بالغلط تحت اسم السورة
        // الجديدة (لأن سطر العنوان يليه بسملة).
        const nextLine = pageData.lines[idx + 1];
        const lineHasAyah = line.words.some(w => w.type === 'word' || w.type === 'end');
        const nextStartsNewSurah = !!(nextLine && nextLine.words.some(w => w.type === 'surah_header'));
        const isLastOfSurah = lineHasAyah && nextStartsNewSurah;

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
            {isLastOfSurah ? <SurahEndOrnament goldColor={gold} fontSize={fontSize} /> : null}
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

  if (isHeader) {
    const w = line.words[0];
    return (
      <View style={styles.surahHeaderLine}>
        <RNText
          allowFontScaling={false}
          style={{
            fontFamily: getQpcFontFamily(w.font),
            fontSize: fontSize + 4,
            color: goldColor,
            lineHeight: (fontSize + 4) * 1.6,
            letterSpacing: 0,
            writingDirection: 'rtl',
            textAlign: 'center',
            includeFontPadding: false as any,
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
      <View style={styles.bismillahLine}>
        <RNText
          allowFontScaling={false}
          style={{
            fontFamily: getQpcFontFamily(w.font),
            fontSize: fontSize + 2,
            color: inkColor,
            lineHeight: (fontSize + 2) * 1.8,
            letterSpacing: 0,
            writingDirection: 'rtl',
            textAlign: 'center',
            includeFontPadding: false as any,
          }}
        >
          {w.char}
        </RNText>
      </View>
    );
  }

  // ─── سطر عادي ───
  // نرسم كل السطر كـ <Text> واحد فيه nested <Text> لكل كلمة.
  // ده بيخلّي محرّك تخطيط النصوص يتعامل مع المسافات بشكل طبيعي زي مصحف المدينة بدل
  // flex space-between اللي بيوسّع الكلمات بشكل صناعي.
  const selectedBg = goldColor + '33';
  const playingBg  = goldColor + '22';
  const currentBg  = goldColor + '55';

  // 📜 الحل الصحيح: flex row-reverse + flex-start
  //   - row-reverse → أول كلمة في المصفوفة (الأولى في القراءة) تظهر على اليمين
  //   - flex-start → الكلمات تتجمع في البداية (اليمين في RTL) بدون توسيع صناعي
  //   - أي مساحة فائضة تتبقّى على اليسار (طبيعي)
  return (
    <View style={styles.line} {...({ dir: 'rtl' } as any)}>
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
              fontSize,
              lineHeight: fontSize * 1.7,
              color: isEnd ? goldColor : inkColor,
              backgroundColor: bg,
              writingDirection: 'rtl',
              letterSpacing: 0,
              includeFontPadding: false as any,
            }}
          >
            {w.char}
          </RNText>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 10,
    // ⭐ space-between يخلّي السطر الأول يلامس أعلى الإطار والسطر الأخير يلامس الأسفل
    //    دائماً - بغضّ النظر عن عدد السطور أو طولها. صفحة الفاتحة والبقرة تظهر بنفس
    //    الـ filling تماماً.
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  line: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingVertical: 0,
    overflow: 'hidden',
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
    paddingVertical: 6,
  },
  bismillahLine: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
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
