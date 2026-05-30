/**
 * 🎤 Voice recording — تسجيل صوت المستخدم للتسميع.
 * مبني على expo-audio (بديل expo-av المهجور).
 *
 * API نظيف:
 *   await ensureRecordingPermission();
 *   await startRecording();
 *   const result = await stopRecording();  // → { uri, durationMs }
 *   await playRecording(result.uri);
 */

import {
  createAudioPlayer, setAudioModeAsync, requestRecordingPermissionsAsync,
  RecordingPresets, type AudioPlayer, type AudioStatus,
} from 'expo-audio';
// الوصول للمسجّل بشكل إمبراطيفي (خارج الـ hooks) عبر الموديول الأصلي:
import AudioModule from 'expo-audio/build/AudioModule';
import { createRecordingOptions } from 'expo-audio/build/utils/options';
import { log } from '@utils/logger';

let currentRecording: any = null;
let playbackPlayer: AudioPlayer | null = null;
let playbackSub: { remove: () => void } | null = null;
let recordingStartedAt = 0;

export interface RecordingResult {
  uri: string;
  durationMs: number;
}

/** يطلب إذن الميكروفون. يجب استدعاؤه قبل startRecording. */
export async function ensureRecordingPermission(): Promise<boolean> {
  try {
    const perm = await requestRecordingPermissionsAsync();
    return perm.granted === true || perm.status === 'granted';
  } catch (e) {
    log.warn('recording permission failed', { error: String(e) });
    return false;
  }
}

/** يبدأ تسجيلاً جديداً. لو في تسجيل سابق، يلغيه. */
export async function startRecording(): Promise<void> {
  if (currentRecording) {
    try { await currentRecording.stop(); } catch {}
    try { currentRecording.remove?.(); } catch {}
    currentRecording = null;
  }

  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });

  const options = createRecordingOptions(RecordingPresets.HIGH_QUALITY);
  const recorder = new (AudioModule as any).AudioRecorder(options);
  await recorder.prepareToRecordAsync();
  recorder.record();
  currentRecording = recorder;
  recordingStartedAt = Date.now();
}

/** يوقف التسجيل الحالي ويرجّع الـ URI + المدة. */
export async function stopRecording(): Promise<RecordingResult | null> {
  if (!currentRecording) return null;
  const rec = currentRecording;
  try {
    await rec.stop();
    const uri: string | null = rec.uri ?? null;
    const durationMs = Date.now() - recordingStartedAt;
    try { rec.remove?.(); } catch {}
    currentRecording = null;

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });

    if (!uri) return null;
    return { uri, durationMs };
  } catch (e) {
    log.error('stopRecording failed', { error: String(e) });
    try { rec.remove?.(); } catch {}
    currentRecording = null;
    return null;
  }
}

/** يلغي التسجيل الحالي بدون حفظ. */
export async function cancelRecording(): Promise<void> {
  if (!currentRecording) return;
  try { await currentRecording.stop(); } catch {}
  try { currentRecording.remove?.(); } catch {}
  currentRecording = null;
}

/** يشغّل التسجيل عبر الـ URI المحفوظ. */
export async function playRecording(uri: string, onFinish?: () => void): Promise<void> {
  try { playbackSub?.remove(); } catch {}
  try { playbackPlayer?.remove(); } catch {}
  playbackPlayer = null;
  playbackSub = null;
  try {
    const player = createAudioPlayer({ uri }, 300);
    playbackPlayer = player;
    playbackSub = player.addListener('playbackStatusUpdate', (st: AudioStatus) => {
      if (st.isLoaded && st.didJustFinish) {
        try { playbackSub?.remove(); } catch {}
        try { player.remove(); } catch {}
        if (playbackPlayer === player) { playbackPlayer = null; playbackSub = null; }
        onFinish?.();
      }
    });
    player.play();
  } catch (e) {
    log.error('playRecording failed', { error: String(e) });
  }
}

/** يوقف الـ playback. */
export async function stopPlayback(): Promise<void> {
  try { playbackSub?.remove(); } catch {}
  try { playbackPlayer?.remove(); } catch {}
  playbackPlayer = null;
  playbackSub = null;
}

/** هل في تسجيل جاري حالياً؟ */
export function isRecording(): boolean {
  return currentRecording !== null;
}

// ════════ Voice comparison heuristic (MVP - بدون AI) ════════

export interface ComparisonResult {
  similarity: number;
  userDurationMs: number;
  referenceDurationMs: number;
  durationRatio: number;
  notes: string[];
}

/** يقيس مدّة ملف صوتي (ms) عبر expo-audio. */
async function measureDurationMs(uri: string): Promise<number> {
  let player: AudioPlayer | null = null;
  try {
    player = createAudioPlayer({ uri }, 500);
    for (let i = 0; i < 12; i++) {
      if (player.isLoaded && (player.duration ?? 0) > 0) {
        return Math.round(player.duration * 1000);
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    return 0;
  } catch {
    return 0;
  } finally {
    try { player?.remove(); } catch {}
  }
}

/** 🎵 يقارن تسجيل المستخدم مع تلاوة مرجعية بشكل بسيط (heuristic). */
export async function compareRecordings(
  userUri: string,
  referenceDurationMs: number,
): Promise<ComparisonResult> {
  const userDurationMs = await measureDurationMs(userUri);

  const notes: string[] = [];
  let similarity = 60;

  if (userDurationMs === 0 || referenceDurationMs === 0) {
    return {
      similarity: 0,
      userDurationMs,
      referenceDurationMs,
      durationRatio: 0,
      notes: ['لم نتمكّن من قياس المدة - حاول إعادة التسجيل.'],
    };
  }

  const durationRatio = userDurationMs / referenceDurationMs;

  if (durationRatio < 0.6) {
    notes.push('قراءتك أسرع بكثير من المرجع - تأنّى أكثر في النطق');
    similarity -= 25;
  } else if (durationRatio < 0.8) {
    notes.push('قراءتك أسرع قليلاً - حاول إبطاء قليل');
    similarity -= 10;
  } else if (durationRatio > 1.6) {
    notes.push('قراءتك أبطأ بكثير - الإيقاع يحتاج تحسين');
    similarity -= 20;
  } else if (durationRatio > 1.3) {
    notes.push('قراءتك أبطأ قليلاً');
    similarity -= 5;
  } else {
    notes.push('إيقاع القراءة ممتاز ✓');
    similarity += 25;
  }

  if (durationRatio >= 0.95 && durationRatio <= 1.1) {
    similarity += 15;
    notes.push('تطابق مدّة ممتاز - استمرّ');
  }

  similarity = Math.max(0, Math.min(100, similarity));

  return { similarity, userDurationMs, referenceDurationMs, durationRatio, notes };
}
