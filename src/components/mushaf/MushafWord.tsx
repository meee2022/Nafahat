/**
 * 🔤 كلمة قرآنية تفاعلية - الوحدة الأساسية في صفحة المصحف.
 *
 * كل كلمة:
 *  - تُرسم بخط QPC المخصّص (الخط بيرسم رمز PUA كحرف من المصحف)
 *  - قابلة للضغط (Pressable) → onPress / onLongPress
 *  - تظهر مظلّلة لو كانت ضمن الآية المختارة أو الجارية تلاوتها
 *  - رصائع الآيات (type === 'end') تأخذ لون ذهبي
 */
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

/** الشكل البسيط للكلمة كما يستهلكها هذا المكون (مستقل عن مصدر البيانات). */
export interface MushafWordData {
  /** الحرف الفعلي بالـ PUA الذي يرسم الكلمة. */
  char: string;
  /** اسم الخط المطلوب لرسم الحرف. */
  font: string;
  /** "word" | "end" | "bismillah" | "surah_header" | "pause". */
  type?: string;
  /** "2:255". */
  verseKey?: string;
  /** "2:255:1". */
  location?: string;
  /** النص العثماني للقراءة الصوتية. */
  text?: string;
}

interface Props {
  word: MushafWordData;
  fontSize: number;
  inkColor: string;
  goldColor: string;
  selectedBg?: string;
  playingBg?: string;
  isSelected?: boolean;
  isPlaying?: boolean;
  isCurrentWord?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const MushafWord: React.FC<Props> = React.memo(
  ({
    word,
    fontSize,
    inkColor,
    goldColor,
    selectedBg,
    playingBg,
    isSelected,
    isPlaying,
    isCurrentWord,
    onPress,
    onLongPress,
  }) => {
    const isEnd = word.type === 'end';
    const color = isEnd ? goldColor : inkColor;

    const bg = isCurrentWord
      ? (playingBg ?? goldColor + '55')
      : isPlaying
        ? (playingBg ?? goldColor + '22')
        : isSelected
          ? (selectedBg ?? goldColor + '33')
          : 'transparent';

    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        hitSlop={2}
        style={({ pressed }) => [
          styles.word,
          {
            backgroundColor: bg,
            opacity: pressed ? 0.55 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={word.text ?? word.char}
      >
        <Text
          allowFontScaling={false}
          // @ts-ignore - react-native-web يقبل fontFamily كسلسلة CSS
          style={{
            fontFamily: word.font,
            fontSize,
            color,
            lineHeight: fontSize * 1.9,
            letterSpacing: 0,
            writingDirection: 'rtl',
            includeFontPadding: false as any,
          }}
        >
          {word.char}
        </Text>
      </Pressable>
    );
  },
);

MushafWord.displayName = 'MushafWord';

const styles = StyleSheet.create({
  word: {
    paddingHorizontal: 1,
    paddingVertical: 0,
    borderRadius: 3,
    alignSelf: 'center',
  },
});
