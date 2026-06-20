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
import { ScrollView } from 'react-native-gesture-handler';
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
  /** 🖥️ الوضع الأفقي: خط كبير، السطور بعرض الشاشة، والمحتوى يـ scroll عمودياً. */
  landscape?: boolean;
}

// 🖥️ الفاصل الرأسي بين سطور الوضع الأفقي (نسبة من حجم الخط) — صغير عشان 3 سطور تدخل.
export const LANDSCAPE_GAP = 0.4;

/**
 * 🖥️ حجم خط الوضع الأفقي = الأصغر بين (العرض÷16 → السطر يملا عرض الشاشة) و(ارتفاع 3 سطور).
 *    دالة مستقلة عشان الشاشة تحسبه مرة واحدة وتمرّره لكل الصفحات → مفيش تصغير-ثم-تكبير وقت السحب.
 */
export function landscapeFontSize(pageWidth: number, pageHeight: number): number {
  const byWidth = (pageWidth - 80) / 16; // 80 = هامش جانبي 40×2
  if (pageHeight > 0) {
    const byHeight = (pageHeight - 24) / (3 * 1.7 + 2 * LANDSCAPE_GAP);
    return Math.max(18, Math.min(60, byWidth, byHeight));
  }
  return Math.max(18, Math.min(60, byWidth));
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
  landscape,
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
  const widthCap = pageWidth >= 700 ? 40 : 28;
  // 📐 الوزن الرأسي الديناميكي: السطر العادي ≈ 1.7، أما الترويسة والبسملة فأطول،
  //   وزخرفة "تمّت السورة" سطر إضافي. الصفحات اللي فيها كذا سورة (آخر المصحف) وزنها
  //   أكبر بكتير من 15×1.7، فنحسب الوزن الفعلي عشان الخط يصغّر بالقدر اللي يخلّي
  //   كل السطور والزخارف تظهر داخل الإطار (مايختفيش سطر).
  const vWeight = (() => {
    const ls = pageData?.lines ?? [];
    let w = 0, ornaments = 0;
    for (let i = 0; i < ls.length; i++) {
      const ty = ls[i].words?.[0]?.type as string;
      if (ty === 'surah_header') w += 2.5;
      else if (ty === 'bismillah') w += 2.3;
      else w += 1.7;
      const next = ls[i + 1];
      const hasAyah = ls[i].words?.some((x) => x.type === 'word' || x.type === 'end');
      const nextHeader = next?.words?.some((x) => x.type === 'surah_header');
      if (hasAyah && nextHeader) ornaments += 1;
    }
    w += ornaments * 1.6;
    return Math.max(25.5, w);
  })();
  const fontSize = explicitFontSize ?? (() => {
    if (pageWidth === 0) return 18;
    // 🖥️ الأفقي: الخط يملا عرض الشاشة + يضمن ~3 سطور (دالة مشتركة landscapeFontSize).
    if (landscape) return landscapeFontSize(pageWidth, pageHeight);
    if (pageHeight === 0) return 18;
    const widthBased  = Math.min(widthCap, pageWidth / 16);
    const heightBased = (pageHeight - 20) / vWeight;
    return Math.max(13, Math.min(widthBased, heightBased));
  })();

  useEffect(() => {
    let mounted = true;
    setPageData(null);
    setReady(false);
    setError(null);

    fetchQpcPage(pageNumber)
      .then(async (d) => {
        if (!mounted) return;
        await loadFontsForPage(d);
        if (!mounted) return;
        setPageData(d);
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

  const linesBody = pageData.lines.map((line, idx) => {
        // علامة "تمّت السورة" تظهر فقط بعد سطر فيه آيات فعلية (word/end) ويليه
        // عنوان سورة جديدة (surah_header). كده ما تظهرش بالغلط تحت اسم السورة
        // الجديدة (لأن سطر العنوان يليه بسملة).
        const nextLine = pageData.lines[idx + 1];
        const lineHasAyah = line.words.some(w => w.type === 'word' || w.type === 'end');
        const nextStartsNewSurah = !!(nextLine && nextLine.words.some(w => w.type === 'surah_header'));
        const isLastOfSurah = lineHasAyah && nextStartsNewSurah;
        // آخر سطر فيه آيات في الصفحة كلها (= ذيل آخر سورة في الصفحة، اللي مفيش
        //   بعده ولا سطر آيات). ده السطر الوحيد اللي نوسّطه لو قصير — أما السطور
        //   القصيرة في النص (زي سطر الحروف المقطّعة "الٓر") تتفرد عادي.
        const isLastAyahLine =
          lineHasAyah &&
          !pageData.lines.slice(idx + 1).some((l) => l.words.some((w) => w.type === 'word' || w.type === 'end'));

        return (
          <React.Fragment key={line.line}>
            <MushafLine
              line={line}
              fontSize={fontSize}
              inkColor={ink}
              goldColor={gold}
              pageColor={pageBg}
              isLastAyahLine={isLastAyahLine}
              selectedVerseKey={selectedVerseKey ?? null}
              playingVerseKey={playingVerseKey ?? null}
              currentWordLocation={currentWordLocation ?? null}
              noStretch={isLastOfSurah || pageNumber === 1 || pageNumber === 2}
              onWordPress={onWordPress}
              onWordLongPress={onWordLongPress}
            />
            {/* 🌿 End-of-Surah ornament — يظهر بعد آخر سطر في السورة قبل
                الـ surah header للسورة اللي بعدها. زخرفة عثمانية أنيقة. */}
            {isLastOfSurah ? <SurahEndOrnament goldColor={gold} fontSize={fontSize} /> : null}
          </React.Fragment>
        );
  });

  // 🖥️ الوضع الأفقي: خط كبير + السطور بعرض الشاشة + scroll عمودي (مايتقيّدش بارتفاع الشاشة).
  if (landscape) {
    return (
      <View
        style={{ flex: 1, backgroundColor: pageBg }}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          const h = e.nativeEvent.layout.height;
          if (Math.abs(w - pageWidth) > 1) setPageWidth(w);
          if (Math.abs(h - pageHeight) > 1) setPageHeight(h);
        }}
      >
        <ScrollView
          // السطور تملا عرض الشاشة كله (الخط محسوب من العرض فبتملاه بمسافات طبيعية).
          //   الهامش الجانبي (20) بيمتص تمدّد الحروف على الأطراف فالكلمة الأولى/الأخيرة تبان كاملة.
          contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 40, rowGap: fontSize * LANDSCAPE_GAP }}
          showsVerticalScrollIndicator={false}
        >
          {linesBody}
        </ScrollView>
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
      {linesBody}
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
  /** سطر طبيعي لا يُفرد (آخر سطر بسورة / الفاتحة). */
  noStretch?: boolean;
  /** آخر سطر آيات في الصفحة (ذيل آخر سورة) — لو قصير نوسّطه. */
  isLastAyahLine?: boolean;
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
  noStretch,
  isLastAyahLine,
  onWordPress,
  onWordLongPress,
}) => {
  // 📏 قياس عرض كلمات السطر الطبيعي مقابل عرض الإطار:
  //   - أعرض من الإطار (سطر مزحوم) → نصغّره ليدخل (مايطلعش بره).
  //   - أضيق (سطر خفيف) → نوزّع المسافات (justify) ليملا الطرفين.
  const wordW = React.useRef<Record<number, number>>({});
  const [contentW, setContentW] = useState(0);
  const [availW, setAvailW] = useState(0);
  // مسافة صغيرة ثابتة بين الكلمات — تفضل موجودة حتى وقت تصغير السطر المزحوم،
  //   فالحروف ما تلمسش بعض ولا يختفي منها حاجة.
  const WORD_GAP = fontSize * 0.04;
  // 🛡️ مساحة قَص كبيرة جوّه كل صندوق كلمة (padding) عشان الحروف المتمدّدة (المدّة فوق
  //    "الٓر"، ذيل الراء..) تاخد راحتها وما تتقصّش — ويُلغى أثرها على التخطيط بـ margin
  //    سالب مساوٍ، فالتباعد والملء يفضلوا زي ما هما بالظبط، والكلمة الأولى توصل للحافة.
  const INK_PAD = fontSize * 0.22;
  const n = line.words.length;
  // العرض الفعلي للحبر = مجموع الصناديق المقيس ناقص الـ padding (الملغى بالـ margin) + المسافات.
  const inkContent = Math.max(0, contentW - 2 * INK_PAD * n) + Math.max(0, n - 1) * WORD_GAP;
  const overflow = availW > 0 && contentW > 0 && inkContent > availW;
  const lineScaleX = overflow ? availW / inkContent : 1;
  // سطر قصير محتواه أقل بكتير من عرض السطر. نوسّطه (بدل فجوات space-between الضخمة)
  //   فقط لو كان **آخر سطر آيات في الصفحة** (ذيل آخر سورة) — أما السطور القصيرة في
  //   النص (زي سطر الحروف المقطّعة "الٓر") تتفرد عادي وتبدأ من حافة اليمين.
  const tooShort =
    !!isLastAyahLine && availW > 0 && contentW > 0 && inkContent < availW * 0.62;

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
  // 🎯 رسم السطر كنص واحد متصل (زي البرامج الاحترافية) — الخط يتدفّق طبيعي وكل
  //    الحروف تظهر صح. الضغط على الكلمة محفوظ عبر nested <Text>. بدون شد (scaleX).
  // 🎯 تبرير بالمسافات (justify): الكلمات منفصلة + توزيع المسافة بينها (space-between)
  //    عشان السطر يملا من الطرف للطرف — بدون شد الحروف (الحروف نضيفة زي ما هي).
  //    السطور الطبيعية (آخر سورة / الفاتحة) تتوسّط بدل ما تتفرد.
  return (
    <View
      style={[
        styles.line,
        {
          justifyContent: overflow || noStretch || tooShort ? 'center' : 'space-between',
          gap: WORD_GAP,
          // نحط مفتاح transform فقط وقت التصغير الفعلي (وبقيمة محدودة) — تمرير undefined/null
          //   بيكسر validateTransforms في الـ native، فنحذف المفتاح بالكامل لما مش محتاجينه.
          ...(overflow && Number.isFinite(lineScaleX) && lineScaleX > 0
            ? { transform: [{ scaleX: lineScaleX }] }
            : null),
        },
      ]}
      onLayout={(e) => { const w = e.nativeEvent.layout.width; if (Math.abs(w - availW) > 1) setAvailW(w); }}
      {...({ dir: 'rtl' } as any)}
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
            onLayout={(e) => {
              wordW.current[i] = e.nativeEvent.layout.width;
              const sum = Object.values(wordW.current).reduce((a, b) => a + b, 0);
              if (Math.abs(sum - contentW) > 2) setContentW(sum);
            }}
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
              includeFontPadding: false as any,
              // مساحة قَص جوّه الصندوق + margin سالب يلغيها من التخطيط (شرح فوق عند INK_PAD)
              paddingHorizontal: INK_PAD,
              marginHorizontal: -INK_PAD,
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
  },
  line: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingVertical: 0,
  },
  // الصف الداخلي يأخذ عرض محتواه فقط (ليُقاس) ثم يتمدّد بـ scaleX خفيف ليملأ السطر.
  lineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
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
