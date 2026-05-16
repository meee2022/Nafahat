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
  // 📏 عرض الصفحة المتاح - يُحسب من onLayout. نستخدمه لتكييف حجم الخط
  //    بحيث ما يطلعش نص فوق إطار المصحف.
  const [pageWidth, setPageWidth] = useState(0);

  const gold   = goldColor ?? t.colors.accent;
  const ink    = inkColor  ?? t.colors.textPrimary;
  const pageBg = pageColor ?? t.colors.background;

  // 🎯 fontSize ديناميكي: خط QCF v4 مصمّم لعرض ~400-450px على مصحف الجيب.
  // نسمح بتكبير الخط على الشاشات الأعرض (مثل التابلت أو الويب)
  const fontSize = explicitFontSize ?? (
    pageWidth > 0
      ? Math.max(16, pageWidth / 16)
      : 22
  );

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
        if (Math.abs(w - pageWidth) > 1) setPageWidth(w);
      }}
    >
      {pageData.lines.map((line, idx) => {
        // Detect if this is the last line of a Surah (should be centered instead of justified)
        const nextLine = pageData.lines[idx + 1];
        let isLastOfSurah = false;
        
        if (nextLine && nextLine.words.some(w => w.type === 'surah_header' || w.type === 'bismillah')) {
          isLastOfSurah = true;
        } else {
          // If it's the last line on the page, check if it ends the surah
          const lastWord = line.words[line.words.length - 1];
          if (lastWord && lastWord.type === 'end' && lastWord.verse_key) {
            const [sura, aya] = lastWord.verse_key.split(':');
            const surahData = pageData.surahs.find(s => s.id === Number(sura));
            // Assuming we can check if it's the absolute end by looking at a known list, 
            // but for QCF, if it's the last line on a page and doesn't fill the width, space-between might look odd.
            // Let's use a heuristic: if the line has fewer words than average, it might be short.
            // But relying on nextLine is 99% accurate for within-page boundaries.
          }
        }

        return (
          <MushafLine
            key={line.line}
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
        );
      })}
    </View>
  );
};

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
              lineHeight: fontSize * 1.9,
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
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 12, // مساحة إضافية للسطر الأخير حتى لا يلامس الإطار السفلي
    justifyContent: 'space-evenly',
    overflow: 'hidden', // ⛔ يمنع الكلمات من الطلوع فوق الإطار
  },
  line: {
    width: '100%',
    // ⚠️ I18nManager.forceRTL(true) + dir="rtl" يقلبا flexDirection: 'row' تلقائياً.
    //   فلو نحطّ 'row-reverse' هنحصل على قلب مزدوج (LTR)! الصح هو 'row' فقط.
    flexDirection: 'row',
    justifyContent: 'center',  // Center groups words together safely on any screen width
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingVertical: 1,
    overflow: 'hidden',
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
