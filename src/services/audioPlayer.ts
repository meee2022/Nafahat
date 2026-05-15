/**
 * خدمة تشغيل الصوت - تغليف expo-av Sound API.
 * تُستخدم من الـ Zustand store. تدعم التشغيل في الخلفية وعلى الـ Web.
 */

import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';

let currentSound: Audio.Sound | null = null;
let statusListener: ((s: AVPlaybackStatusSuccess) => void) | null = null;

export interface PlaybackStatus {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  didJustFinish: boolean;
}

let audioModeConfigured = false;
async function ensureAudioMode() {
  if (audioModeConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      // يسمح بالتشغيل حتى لو الجهاز على الوضع الصامت (iOS)
      playsInSilentModeIOS: true,
      // ✅ يبقى الصوت شغّالاً عند قفل الشاشة أو الانتقال لتطبيق آخر
      staysActiveInBackground: true,
      // يقلّل صوت تطبيقات أخرى لما يشتغل الـ Adhan/التلاوة بدل قطعها
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      // تكامل مع Now Playing على iOS و notification controls على Android
      interruptionModeIOS:     1, // InterruptionModeIOS.DoNotMix
      interruptionModeAndroid: 1, // InterruptionModeAndroid.DoNotMix
    });
  } catch {}
  audioModeConfigured = true;
}

export async function unload(): Promise<void> {
  if (currentSound) {
    try { await currentSound.unloadAsync(); } catch {}
    currentSound = null;
  }
}

export async function loadAndPlay(uri: string, onStatus?: (s: PlaybackStatus) => void): Promise<void> {
  await ensureAudioMode();
  await unload();

  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, volume: 1 },
    (st: AVPlaybackStatus) => {
      if (!st.isLoaded) return;
      const s = st as AVPlaybackStatusSuccess;
      onStatus?.({
        isPlaying: s.isPlaying,
        positionMs: s.positionMillis ?? 0,
        durationMs: s.durationMillis ?? 0,
        didJustFinish: s.didJustFinish === true,
      });
    },
  );
  currentSound = sound;
}

export async function setPlaying(playing: boolean): Promise<void> {
  if (!currentSound) return;
  try {
    if (playing) await currentSound.playAsync();
    else await currentSound.pauseAsync();
  } catch {}
}

export async function setSpeed(rate: number): Promise<void> {
  if (!currentSound) return;
  try {
    await currentSound.setRateAsync(rate, true);
  } catch {}
}

export async function seekTo(positionMs: number): Promise<void> {
  if (!currentSound) return;
  try {
    await currentSound.setPositionAsync(positionMs);
  } catch {}
}

export function isLoaded(): boolean {
  return !!currentSound;
}
