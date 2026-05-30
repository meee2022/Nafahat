/**
 * خدمة تشغيل الصوت — مبنية على expo-audio (بديل expo-av المهجور).
 * تُستخدم من الـ Zustand store. تدعم التشغيل في الخلفية وعلى الـ Web.
 *
 * ملاحظة: expo-audio يستخدم الثواني داخلياً؛ نُبقي الواجهة الخارجية
 * بالمللي ثانية (positionMs/durationMs) كما كانت، ونحوّل داخلياً.
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';

let currentPlayer: AudioPlayer | null = null;
let currentSub: { remove: () => void } | null = null;

/** رقم نسخة لكل استدعاء loadAndPlay — يُستخدم كـ cancellation token. */
let loadRequestVersion = 0;

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
    await setAudioModeAsync({
      playsInSilentMode: true,        // يشتغل حتى في الوضع الصامت (iOS)
      shouldPlayInBackground: true,   // يبقى شغّالاً عند قفل الشاشة/التطبيق في الخلفية
      shouldRouteThroughEarpiece: false,
      interruptionMode: 'doNotMix',
      interruptionModeAndroid: 'doNotMix',
    });
  } catch {}
  audioModeConfigured = true;
}

function teardown(player: AudioPlayer | null, sub: { remove: () => void } | null) {
  try { sub?.remove(); } catch {}
  try { player?.remove(); } catch {}
}

export async function unload(): Promise<void> {
  teardown(currentPlayer, currentSub);
  currentPlayer = null;
  currentSub = null;
}

/**
 * يحمّل ملف صوتي ويُشغّله من موضع محدّد.
 */
export async function loadAndPlay(
  uri: string,
  onStatus?: (s: PlaybackStatus) => void,
  /** اختياري: دالة تحسب موضع البداية (ms) من مدّة الـ MP3 (ms). */
  computeStartMs?: (durationMs: number) => number,
): Promise<void> {
  const myVersion = ++loadRequestVersion;

  await ensureAudioMode();
  if (myVersion !== loadRequestVersion) return;

  await unload();
  // 🔇 أوقف أي صوت كلمة (one-shot) شغّال حتى لا يتداخل صوتان
  teardownOneShot();
  if (myVersion !== loadRequestVersion) return;

  // إنشاء المشغّل (متزامن في expo-audio) مع فاصل تحديث الحالة 250ms
  let player: AudioPlayer;
  try {
    player = createAudioPlayer({ uri }, 250);
  } catch (e) {
    if (myVersion !== loadRequestVersion) return;
    throw e;
  }
  if (myVersion !== loadRequestVersion) {
    teardown(player, null);
    return;
  }
  currentPlayer = player;

  // 🎯 محاولة seek سريعة قبل بدء الصوت (لو المدّة جاهزة بسرعة - ملف مخزّن مثلاً)
  let seekDone = false;
  if (computeStartMs) {
    for (let i = 0; i < 8; i++) {
      if (myVersion !== loadRequestVersion) { teardown(player, null); return; }
      if (player.isLoaded && (player.duration ?? 0) > 0) {
        const durSec = player.duration;
        const targetSec = computeStartMs(durSec * 1000) / 1000;
        if (targetSec > 0 && targetSec < durSec) {
          try { await player.seekTo(targetSec); } catch {}
        }
        seekDone = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  if (myVersion !== loadRequestVersion) { teardown(player, null); return; }

  // listener لتحديث الحالة (تحويل الثواني → ms)
  // 🔑 لو لسه ما عملناش seek (المدّة اتأخرت لأن الملف بيتحمّل من النت)،
  //    نعمله أول ما المدّة تتعرف هنا — فالقفز للآية يحصل دايماً مش من أول السورة.
  currentSub = player.addListener('playbackStatusUpdate', (st: AudioStatus) => {
    if (myVersion !== loadRequestVersion) return;
    if (!st.isLoaded) return;

    if (!seekDone && computeStartMs && (st.duration ?? 0) > 0) {
      seekDone = true;
      const durSec = st.duration as number;
      const targetSec = computeStartMs(durSec * 1000) / 1000;
      if (targetSec > 0 && targetSec < durSec) {
        try { player.seekTo(targetSec); } catch {}
      }
    }

    onStatus?.({
      isPlaying: st.playing,
      positionMs: Math.round((st.currentTime ?? 0) * 1000),
      durationMs: Math.round((st.duration ?? 0) * 1000),
      didJustFinish: st.didJustFinish === true,
    });
  });

  try { player.play(); } catch {}
}

export async function setPlaying(playing: boolean): Promise<void> {
  if (!currentPlayer) return;
  try {
    if (playing) currentPlayer.play();
    else currentPlayer.pause();
  } catch {}
}

export async function setSpeed(rate: number): Promise<void> {
  if (!currentPlayer) return;
  try { currentPlayer.setPlaybackRate(rate); } catch {}
}

export async function seekTo(positionMs: number): Promise<void> {
  if (!currentPlayer) return;
  try { await currentPlayer.seekTo(positionMs / 1000); } catch {}
}

export function isLoaded(): boolean {
  return !!currentPlayer;
}

/**
 * 🌙 يُخفت الصوت تدريجياً (fade-out) ثم يوقف. (يُستخدم في sleep timer)
 */
let fadeAbortToken = 0;
export async function fadeOutAndStop(durationMs: number = 8000, steps: number = 40): Promise<void> {
  if (!currentPlayer) return;
  const myToken = ++fadeAbortToken;
  const stepMs = Math.max(50, durationMs / steps);
  const startVolume = 1;

  for (let i = 1; i <= steps; i++) {
    if (myToken !== fadeAbortToken) return;
    if (!currentPlayer) return;
    const v = Math.max(0, startVolume * (1 - i / steps));
    try { currentPlayer.volume = v; } catch {}
    await new Promise((r) => setTimeout(r, stepMs));
  }
  if (myToken !== fadeAbortToken) return;
  try {
    if (currentPlayer) {
      currentPlayer.pause();
      currentPlayer.volume = 1;
    }
  } catch {}
}

/** يلغي أي fade-out جارٍ ويعيد volume لطبيعته. */
export async function cancelFade(): Promise<void> {
  fadeAbortToken++;
  if (currentPlayer) {
    try { currentPlayer.volume = 1; } catch {}
  }
}

// ─────────────── صوت "خاطف" قصير (لا يتداخل مع التلاوة الرئيسية) ───────────────

let oneShotPlayer: AudioPlayer | null = null;
let oneShotSub: { remove: () => void } | null = null;
let oneShotVersion = 0;

export async function playOneShot(uri: string): Promise<void> {
  const myVersion = ++oneShotVersion;
  await ensureAudioMode();
  if (myVersion !== oneShotVersion) return;

  // 🔇 منع تشغيل صوتين معاً: أوقف المشغّل الرئيسي + أي one-shot سابق
  try { currentPlayer?.pause(); } catch {}
  teardown(oneShotPlayer, oneShotSub);
  oneShotPlayer = null;
  oneShotSub = null;

  try {
    const player = createAudioPlayer({ uri }, 300);
    if (myVersion !== oneShotVersion) { try { player.remove(); } catch {} return; }
    oneShotPlayer = player;
    oneShotSub = player.addListener('playbackStatusUpdate', (st: AudioStatus) => {
      if (st.isLoaded && st.didJustFinish) {
        teardown(player, oneShotSub);
        if (oneShotPlayer === player) { oneShotPlayer = null; oneShotSub = null; }
      }
    });
    player.play();
  } catch {}
}

/** يوقف ويحرّر أي one-shot (صوت كلمة) شغّال. */
function teardownOneShot() {
  oneShotVersion++;
  teardown(oneShotPlayer, oneShotSub);
  oneShotPlayer = null;
  oneShotSub = null;
}
