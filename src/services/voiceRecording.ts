/**
 * 🎤 Voice recording — تسجيل صوت المستخدم للتسميع.
 *
 * يستخدم expo-av لتسجيل الصوت. نحفظ الـ URI في الذاكرة، ولاحقاً نقدر:
 *  - نشغّل الـ URI playback مقابل التلاوة المرجعية
 *  - نحفظه في AsyncStorage لجلسات سابقة
 *  - (مستقبلاً) نرسله لـ AI للمقارنة
 *
 * API نظيف:
 *   await startRecording();
 *   ... المستخدم بيتكلم ...
 *   const result = await stopRecording();  // → { uri, durationMs }
 *   await playRecording(result.uri);
 *   await deleteRecording(result.uri);
 */

import { Audio, type AVPlaybackStatusSuccess } from 'expo-av';
import { log } from '@utils/logger';

let currentRecording: Audio.Recording | null = null;
let playbackSound: Audio.Sound | null = null;
let recordingStartedAt = 0;

export interface RecordingResult {
  uri: string;
  durationMs: number;
}

/**
 * يطلب إذن الميكروفون. يجب استدعاؤه قبل startRecording.
 * يرجع false لو رفض المستخدم.
 */
export async function ensureRecordingPermission(): Promise<boolean> {
  try {
    const perm = await Audio.requestPermissionsAsync();
    return perm.status === 'granted';
  } catch (e) {
    log.warn('recording permission failed', { error: String(e) });
    return false;
  }
}

/**
 * يبدأ تسجيلاً جديداً. لو في تسجيل سابق، يلغيه.
 */
export async function startRecording(): Promise<void> {
  // أوقف أي تسجيل سابق
  if (currentRecording) {
    try { await currentRecording.stopAndUnloadAsync(); } catch {}
    currentRecording = null;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  currentRecording = recording;
  recordingStartedAt = Date.now();
}

/**
 * يوقف التسجيل الحالي ويرجّع الـ URI + المدة.
 */
export async function stopRecording(): Promise<RecordingResult | null> {
  if (!currentRecording) return null;
  try {
    await currentRecording.stopAndUnloadAsync();
    const uri = currentRecording.getURI();
    const durationMs = Date.now() - recordingStartedAt;
    currentRecording = null;

    // ارجع الـ audio mode للوضع العادي بعد التسجيل
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    if (!uri) return null;
    return { uri, durationMs };
  } catch (e) {
    log.error('stopRecording failed', { error: String(e) });
    currentRecording = null;
    return null;
  }
}

/**
 * يلغي التسجيل الحالي بدون حفظ.
 */
export async function cancelRecording(): Promise<void> {
  if (!currentRecording) return;
  try { await currentRecording.stopAndUnloadAsync(); } catch {}
  currentRecording = null;
}

/**
 * يشغّل التسجيل عبر الـ URI المحفوظ.
 */
export async function playRecording(uri: string, onFinish?: () => void): Promise<void> {
  // أوقف أي تشغيل سابق
  if (playbackSound) {
    try { await playbackSound.unloadAsync(); } catch {}
    playbackSound = null;
  }
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1 },
      (st) => {
        if (!st.isLoaded) return;
        const s = st as AVPlaybackStatusSuccess;
        if (s.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (playbackSound === sound) playbackSound = null;
          onFinish?.();
        }
      },
    );
    playbackSound = sound;
  } catch (e) {
    log.error('playRecording failed', { error: String(e) });
  }
}

/**
 * يوقف الـ playback.
 */
export async function stopPlayback(): Promise<void> {
  if (!playbackSound) return;
  try { await playbackSound.unloadAsync(); } catch {}
  playbackSound = null;
}

/**
 * هل في تسجيل جاري حالياً؟
 */
export function isRecording(): boolean {
  return currentRecording !== null;
}
