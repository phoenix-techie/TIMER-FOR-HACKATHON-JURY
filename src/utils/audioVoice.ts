/**
 * Audio synthesis and text-to-speech utilities for loud timer alerts and checkpoints.
 */

import { VoiceSettings } from '../types/timer';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Prime audio context on user gesture (click/tap) so audio & speech can play freely.
 */
export function unlockAudioContext(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (err) {
    console.warn('AudioContext init error:', err);
  }
}

/**
 * Plays an energetic starting chime (two ascending pure tones).
 */
export function playStartSound(volume: number = 1.0): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.35); // G5

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.4 * volume, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.warn('Play start sound error:', e);
  }
}

/**
 * Crisp bell ping for checkpoints.
 */
export function playCheckpointSound(volume: number = 1.0): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5

    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(1760, now); // A6

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.5 * volume, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gainNode);
    harmonic.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
    harmonic.start(now);
    harmonic.stop(now + 0.55);
  } catch (e) {
    console.warn('Play checkpoint sound error:', e);
  }
}

/**
 * Loud multi-tone fanfare for Times Up alarm.
 */
export function playTimesUpSound(volume: number = 1.0): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.6 * volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  } catch (e) {
    console.warn('Play times up sound error:', e);
  }
}

/**
 * Soft tick feedback for button taps.
 */
export function playClickSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Ignore audio errors on micro-feedback
  }
}

/**
 * Get available speech synthesis voices with language prioritization.
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const handler = () => {
      const v = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(v);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);

    // Fallback timeout in case onvoiceschanged does not fire
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 400);
  });
}

/**
 * Loudly speaks text using Web Speech API with optional preceding alert tone.
 */
export function speakLoudly(
  text: string,
  settings: VoiceSettings,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    // If speech synthesis not available, play sound effect as fallback
    if (settings.enableSoundEffects) {
      playCheckpointSound(settings.volume);
    }
    onEnd?.();
    return;
  }

  if (!settings.enableSpeech || !text.trim()) {
    onEnd?.();
    return;
  }

  // Pre-chime if enabled
  if (settings.enableSoundEffects && settings.playChimeBeforeVoice) {
    playCheckpointSound(settings.volume);
  }

  const delayMs = settings.enableSoundEffects && settings.playChimeBeforeVoice ? 220 : 0;

  setTimeout(() => {
    try {
      window.speechSynthesis.cancel(); // clear any pending queue

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = Math.max(0.1, Math.min(1.0, settings.volume));
      utterance.rate = Math.max(0.5, Math.min(2.0, settings.rate));
      utterance.pitch = Math.max(0.5, Math.min(2.0, settings.pitch));

      if (settings.voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selected = voices.find((v) => v.voiceURI === settings.voiceURI);
        if (selected) {
          utterance.voice = selected;
        }
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis speak failed:', e);
      onEnd?.();
    }
  }, delayMs);
}

/**
 * Screen WakeLock manager to keep screen on during timer countdown.
 */
let wakeLockSentinel: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function releaseWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // ignore
    } finally {
      wakeLockSentinel = null;
    }
  }
}
