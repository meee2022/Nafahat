/**
 * مشغل الصوت - تصميم سينمائي بزخارف ذهبية.
 * بطاقة محراب مركزية + شريط تقدم رفيع + أزرار دائرية معدنية.
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Share, LayoutChangeEvent, GestureResponderEvent, AlertButton, Alert } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import Svg, { Path, Circle, Defs, Pattern, Rect, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg';
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat,
  Repeat1, Timer, Gauge, Heart, Download, Share2, ListMusic, AlertCircle, X,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useAudioStore, useReadingStore } from '@store/index';
import { OrnamentalRule } from '@components/ornaments';
import { useT } from '@store/languageStore';

const fmt = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export default function PlayerScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const rootNavState = useRootNavigationState();
  const navReady = !!rootNavState?.key;
  const {
    current, isPlaying, toggle, positionMs, durationMs, error, clearError,
    speed, setSpeed, repeatMode, setRepeat, sleepTimerMin, sleepRemainingMs, setSleepTimer,
    seek, skipForward, skipBackward, playNext, playPrev,
  } = useAudioStore();

  const { favorites, toggleFavorite } = useReadingStore();
  const [trackWidth, setTrackWidth] = useState(0);

  // إذا لا توجد آية مشغّلة، نرجع للشاشة السابقة - بعد ما الـ Root Layout يكون جاهز
  // (لا يُسمح بـ navigation خلال render أو قبل تركيب الـ Root Layout)
  useEffect(() => {
    if (!navReady || current) return;
    try {
      if (router.canGoBack?.()) router.back();
      else router.replace('/(tabs)');
    } catch {}
  }, [current, router, navReady]);

  if (!current) {
    return null;
  }

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const surahFavKey = `surah:${current.surahId}`;
  const isFav = favorites.includes(surahFavKey);

  const handleTrackPress = (e: GestureResponderEvent) => {
    if (!durationMs || trackWidth <= 0) return;
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    seek(ratio * durationMs);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${tr('player.nowPlaying')}: ${current.surahName} — ${current.reciter.nameAr}\nنَفَحات`,
      });
    } catch {}
  };

  const handleDownload = () => {
    Alert.alert(tr('player.download'), 'سيتم دعم التحميل للاستماع بلا إنترنت قريباً.', [{ text: 'حسناً' }]);
  };

  const fmtSleepRemaining = (ms: number | null) => {
    if (ms === null || ms <= 0) return '';
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: t.mode === 'dark' ? '#070F0D' : '#0A1815' }]}>
      {/* خلفية محرابية مع نقش هندسي */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="bgGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#143229" stopOpacity="1" />
            <Stop offset="50%" stopColor="#0A1815" stopOpacity="1" />
            <Stop offset="100%" stopColor="#070F0D" stopOpacity="1" />
          </SvgGradient>
          <Pattern id="playerPattern" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <Path
              d="M24,4 L28,20 L44,24 L28,28 L24,44 L20,28 L4,24 L20,20 Z"
              fill="none" stroke="#C9A961" strokeWidth={0.3} opacity={0.4}
            />
          </Pattern>
          <SvgGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#D4B570" />
            <Stop offset="50%" stopColor="#B8923B" />
            <Stop offset="100%" stopColor="#6F571F" />
          </SvgGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bgGrad)" />
        <Rect width="100%" height="100%" fill="url(#playerPattern)" opacity={0.5} />
      </Svg>

      {/* الترويسة */}
      <View style={[styles.topBar, styles.maxWidthWrap]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack?.()) router.back();
            else router.replace('/(tabs)');
          }}
          hitSlop={t.hitSlop}
          style={[styles.iconBtn, { borderColor: 'rgba(212, 181, 112, 0.35)' }]}
        >
          <ChevronDown size={20} color="#D4B570" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.topEyebrow, { color: '#D4B570' }]}>{tr('player.nowPlaying')}</Text>
          {sleepRemainingMs !== null ? (
            <Text style={{ fontSize: 11, color: 'rgba(245, 239, 224, 0.7)', marginTop: 2 }}>
              ⏱ {fmtSleepRemaining(sleepRemainingMs)}
            </Text>
          ) : null}
        </View>
        <Pressable hitSlop={t.hitSlop} onPress={() => router.push('/reciters')} style={[styles.iconBtn, { borderColor: 'rgba(212, 181, 112, 0.35)' }]}>
          <ListMusic size={18} color="#D4B570" />
        </Pressable>
      </View>

      {/* رسالة خطأ - فوق المحتوى */}
      {error ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={14} color="#FFB4B4" />
          <Text style={{ flex: 1, fontSize: 12, color: '#FFB4B4', marginHorizontal: 8 }}>{error}</Text>
          <Pressable onPress={clearError} hitSlop={10}>
            <X size={14} color="#FFB4B4" />
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidthWrap}>
        {/* بطاقة المحراب المركزية */}
        <View style={styles.mihrabBox}>
          <Svg width="100%" height={260} viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet">
            {/* قوس المحراب */}
            <Path
              d="M 50 340 L 50 150 C 50 80, 130 30, 200 30 C 270 30, 350 80, 350 150 L 350 340 Z"
              fill="rgba(212, 181, 112, 0.05)"
              stroke="#D4B570"
              strokeWidth={1}
            />
            <Path
              d="M 60 340 L 60 156 C 60 90, 134 42, 200 42 C 266 42, 340 90, 340 156 L 340 340"
              fill="none"
              stroke="#D4B570"
              strokeWidth={0.4}
              opacity={0.5}
            />
            {/* رمز ﷽ كبير */}
            <G transform="translate(200, 175)">
              <Circle r="60" fill="rgba(212, 181, 112, 0.08)" />
              <Circle r="60" fill="none" stroke="#D4B570" strokeWidth={0.6} />
              <Circle r="52" fill="none" stroke="#D4B570" strokeWidth={0.3} opacity={0.5} />
              {/* نجمة 8 خلفية */}
              <Path
                d="M0,-40 L8,-8 L40,0 L8,8 L0,40 L-8,8 L-40,0 L-8,-8 Z"
                fill="rgba(212, 181, 112, 0.12)"
              />
            </G>
            {/* رصيعة التاج */}
            <Circle cx="200" cy="22" r="5" fill="#D4B570" />
            <Circle cx="200" cy="22" r="2.5" fill="#0A1815" />
          </Svg>

          {/* "بسم الله" في القلب - مع clip لمنع الفيض */}
          <View style={styles.bismOverlay} pointerEvents="none">
            <View style={styles.bismGlyphWrap}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.bismGlyph, { color: '#D4B570', fontFamily: t.fontFamilies.arabicQuran }]}
              >
                ﷽
              </Text>
            </View>
          </View>
        </View>

        {/* اسم السورة والقارئ */}
        <View style={styles.titleBlock}>
          <Text style={[styles.surahTitle, { color: '#F5EFE0' }]}>{current.surahName}</Text>
          <View style={{ marginTop: 8 }}>
            <OrnamentalRule width={120} color="#D4B570" variant="rosette" />
          </View>
          <Text style={[styles.reciterName, { color: 'rgba(245, 239, 224, 0.65)' }]}>
            {current.reciter.nameAr}
          </Text>
          <Text style={[styles.reciterStyle, { color: 'rgba(212, 181, 112, 0.7)' }]}>
            {current.reciter.style} · {current.reciter.countryAr}
          </Text>
        </View>

        {/* شريط التقدم - تفاعلي */}
        <View style={{ paddingHorizontal: 32, marginTop: 20 }}>
          <Pressable
            onPress={handleTrackPress}
            onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
            hitSlop={{ top: 12, bottom: 12, left: 0, right: 0 }}
          >
            <View style={[styles.progressTrack, { backgroundColor: 'rgba(212, 181, 112, 0.15)' }]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              {progress > 0 ? (
                <View style={[styles.progressDot, { start: `${progress * 100}%` as any }]} />
              ) : null}
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={[styles.timeText, { color: 'rgba(245, 239, 224, 0.6)' }]}>{fmt(positionMs)}</Text>
            <Text style={[styles.timeText, { color: 'rgba(245, 239, 224, 0.6)' }]}>{fmt(durationMs)}</Text>
          </View>
        </View>

        {/* أزرار التشغيل المركزية */}
        <View style={styles.controls}>
          {/* في RTL: SkipForward على اليسار (الزمن للأمام)، SkipBack على اليمين */}
          <SideButton
            icon={<SkipForward size={20} color="#D4B570" />}
            onPress={skipForward}
            onLongPress={playNext}
          />
          <Pressable onPress={toggle} style={({ pressed }) => [styles.bigPlay, { opacity: pressed ? 0.85 : 1 }]}>
            <Svg width={88} height={88} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
              <Circle cx="50" cy="50" r="48" fill="#0A1815" stroke="url(#goldRing)" strokeWidth={2} />
              <Circle cx="50" cy="50" r="44" fill="none" stroke="#D4B570" strokeWidth={0.4} opacity={0.5} />
            </Svg>
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
              {isPlaying ? <Pause size={28} color="#D4B570" fill="#D4B570" /> : <Play size={28} color="#D4B570" fill="#D4B570" />}
            </View>
          </Pressable>
          <SideButton
            icon={<SkipBack size={20} color="#D4B570" />}
            onPress={skipBackward}
            onLongPress={playPrev}
          />
        </View>
        <Text style={[styles.skipHint, { color: 'rgba(212, 181, 112, 0.5)' }]}>
          اضغط ١٠ ث · أمسك للسورة التالية / السابقة
        </Text>

        {/* أزرار ثانوية - مربوطة جميعها */}
        <View style={styles.utilRow}>
          <UtilBtn
            icon={<Repeat size={18} color={repeatMode === 'all' ? '#D4B570' : 'rgba(245, 239, 224, 0.5)'} />}
            label={tr('player.repeat')}
            active={repeatMode === 'all'}
            onPress={() => setRepeat(repeatMode === 'all' ? 'none' : 'all')}
          />
          <UtilBtn
            icon={<Repeat1 size={18} color={repeatMode === 'one' ? '#D4B570' : 'rgba(245, 239, 224, 0.5)'} />}
            label={tr('player.repeatOne')}
            active={repeatMode === 'one'}
            onPress={() => setRepeat(repeatMode === 'one' ? 'none' : 'one')}
          />
          <UtilBtn
            icon={<Heart size={18} color={isFav ? '#E11D48' : 'rgba(245, 239, 224, 0.5)'} fill={isFav ? '#E11D48' : 'none'} />}
            label={tr('player.favorite')}
            active={isFav}
            onPress={() => toggleFavorite(current.surahId, 0)}
          />
          <UtilBtn
            icon={<Download size={18} color="rgba(245, 239, 224, 0.5)" />}
            label={tr('player.download')}
            onPress={handleDownload}
          />
          <UtilBtn
            icon={<Share2 size={18} color="rgba(245, 239, 224, 0.5)" />}
            label={tr('player.share')}
            onPress={handleShare}
          />
        </View>

        {/* لوحة سرعة + مؤقت */}
        <View style={[styles.panelsRow, { paddingHorizontal: 16, marginTop: 28, gap: 12 }]}>
          {/* سرعة */}
          <View style={[styles.panel, { borderColor: 'rgba(212, 181, 112, 0.25)' }]}>
            <View style={styles.panelHead}>
              <Gauge size={14} color="#D4B570" />
              <Text style={[styles.panelTitle, { color: '#D4B570' }]}>{tr('player.speed')}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {([0.75, 1, 1.25, 1.5, 2] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSpeed(s)}
                  style={[
                    styles.tinyChip,
                    {
                      borderColor: speed === s ? '#D4B570' : 'rgba(245, 239, 224, 0.15)',
                      backgroundColor: speed === s ? 'rgba(212, 181, 112, 0.12)' : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: speed === s ? '#D4B570' : 'rgba(245, 239, 224, 0.5)' }}>
                    ×{s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* مؤقت */}
          <View style={[styles.panel, { borderColor: 'rgba(212, 181, 112, 0.25)' }]}>
            <View style={styles.panelHead}>
              <Timer size={14} color="#D4B570" />
              <Text style={[styles.panelTitle, { color: '#D4B570' }]}>{tr('player.timer')}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {[null, 10, 30, 60].map((m, i) => (
                <Pressable
                  key={i}
                  onPress={() => setSleepTimer(m)}
                  style={[
                    styles.tinyChip,
                    {
                      borderColor: sleepTimerMin === m ? '#D4B570' : 'rgba(245, 239, 224, 0.15)',
                      backgroundColor: sleepTimerMin === m ? 'rgba(212, 181, 112, 0.12)' : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: sleepTimerMin === m ? '#D4B570' : 'rgba(245, 239, 224, 0.5)' }}>
                    {m === null ? tr('player.timerOff') : `${m}د`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const SideButton: React.FC<{ icon: React.ReactNode; onPress?: () => void; onLongPress?: () => void }> = ({ icon, onPress, onLongPress }) => (
  <Pressable
    onPress={onPress}
    onLongPress={onLongPress}
    delayLongPress={400}
    style={({ pressed }) => [styles.sideBtn, { borderColor: 'rgba(212, 181, 112, 0.3)', opacity: pressed ? 0.7 : 1 }]}
  >
    {icon}
  </Pressable>
);

const UtilBtn: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onPress?: () => void }> = ({ icon, label, active, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.utilBtn, { opacity: pressed ? 0.7 : 1 }]}>
    {icon}
    <Text style={{ fontSize: 10, letterSpacing: 1, marginTop: 6, color: active ? '#D4B570' : 'rgba(245, 239, 224, 0.5)', fontWeight: '600' }}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  /** يحدّ المحتوى بعرض مناسب للموبايل حتى على شاشات Desktop واسعة. */
  maxWidthWrap: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    gap: 12,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  topEyebrow: {
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '600',
  },

  mihrabBox: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
    position: 'relative',
    height: 280,
  },
  bismOverlay: {
    position: 'absolute',
    top: 16, left: 0, right: 0, height: 260,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40,
  },
  bismGlyphWrap: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    overflow: 'hidden',
  },
  bismGlyph: {
    fontSize: 48,
    lineHeight: 56,
    textAlign: 'center',
  },

  titleBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  surahTitle: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  reciterName: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 10,
  },
  reciterStyle: {
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 4,
    fontWeight: '600',
  },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1, borderColor: 'rgba(225, 29, 72, 0.5)',
    borderRadius: 4,
  },
  skipHint: {
    fontSize: 9,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 12,
  },
  progressTrack: {
    height: 4,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4B570',
  },
  progressDot: {
    position: 'absolute',
    top: -4,
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: '#D4B570',
    // في RTL: marginStart = اليمين، marginEnd = اليسار - نستخدم start لتعويض نصف العرض
    marginStart: -5,
    shadowColor: '#D4B570',
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  timeText: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '500',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    marginTop: 28,
  },
  sideBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  bigPlay: {
    width: 88, height: 88,
    alignItems: 'center', justifyContent: 'center',
  },

  utilRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 28,
    paddingHorizontal: 24,
  },
  utilBtn: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  panelsRow: { flexDirection: 'row' },
  panel: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  panelTitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  tinyChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
