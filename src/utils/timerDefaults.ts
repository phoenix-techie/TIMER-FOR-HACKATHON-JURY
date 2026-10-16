import { TimerPreset, VoiceSettings, Checkpoint } from '../types/timer';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceURI: null,
  volume: 1.0, // loud by default
  rate: 1.0,
  pitch: 1.0,
  playChimeBeforeVoice: true,
  announceStart: true,
  startSpeechText: 'Timer started',
  announceFinish: true,
  finishSpeechText: "Time's up",
  enableSpeech: true,
  enableSoundEffects: true,
  wakeLockEnabled: true,
};

export const TIMER_PRESETS: TimerPreset[] = [
  {
    id: '5min',
    label: '5 Min',
    durationSeconds: 300,
    description: 'Checkpoints at 2m and 3m',
    defaultCheckpoints: [
      {
        atSeconds: 120, // 2 minutes
        label: '2 min mark',
        speechText: '2 minutes elapsed',
        enabled: true,
      },
      {
        atSeconds: 180, // 3 minutes
        label: '3 min mark',
        speechText: '3 minutes elapsed',
        enabled: true,
      },
    ],
  },
  {
    id: '10min',
    label: '10 Min',
    durationSeconds: 600,
    description: 'Checkpoints at 2m, 5m, 8m',
    defaultCheckpoints: [
      {
        atSeconds: 120,
        label: '2 min mark',
        speechText: '2 minutes elapsed',
        enabled: true,
      },
      {
        atSeconds: 300,
        label: '5 min (Halfway)',
        speechText: '5 minutes elapsed, halfway mark',
        enabled: true,
      },
      {
        atSeconds: 480,
        label: '8 min mark',
        speechText: '8 minutes elapsed, 2 minutes left',
        enabled: true,
      },
    ],
  },
  {
    id: '15min',
    label: '15 Min',
    durationSeconds: 900,
    description: 'Checkpoints at 5m, 10m, 14m',
    defaultCheckpoints: [
      {
        atSeconds: 300,
        label: '5 min mark',
        speechText: '5 minutes elapsed',
        enabled: true,
      },
      {
        atSeconds: 600,
        label: '10 min mark',
        speechText: '10 minutes elapsed',
        enabled: true,
      },
      {
        atSeconds: 840,
        label: '14 min (1m left)',
        speechText: '14 minutes elapsed, 1 minute remaining',
        enabled: true,
      },
    ],
  },
  {
    id: '20min',
    label: '20 Min',
    durationSeconds: 1200,
    description: 'Checkpoints at 5m, 10m, 15m',
    defaultCheckpoints: [
      {
        atSeconds: 300,
        label: '5 min mark',
        speechText: '5 minutes elapsed',
        enabled: true,
      },
      {
        atSeconds: 600,
        label: '10 min (Halfway)',
        speechText: '10 minutes elapsed, halfway',
        enabled: true,
      },
      {
        atSeconds: 900,
        label: '15 min mark',
        speechText: '15 minutes elapsed, 5 minutes remaining',
        enabled: true,
      },
      {
        atSeconds: 1140,
        label: '19 min mark',
        speechText: '1 minute remaining',
        enabled: true,
      },
    ],
  },
  {
    id: '25min',
    label: '25 Min',
    durationSeconds: 1500,
    description: 'Pomodoro focus timer',
    defaultCheckpoints: [
      {
        atSeconds: 600,
        label: '10 min mark',
        speechText: '10 minutes elapsed',
        enabled: true,
      },
      {
        atSeconds: 1200,
        label: '20 min mark',
        speechText: '20 minutes elapsed, 5 minutes left',
        enabled: true,
      },
    ],
  },
  {
    id: '30min',
    label: '30 Min',
    durationSeconds: 1800,
    description: 'Checkpoints at 10m, 15m, 25m',
    defaultCheckpoints: [
      {
        atSeconds: 600,
        label: '10 min mark',
        speechText: '10 minutes elapsed',
        enabled: true,
      },
      {
        atSeconds: 900,
        label: '15 min (Halfway)',
        speechText: '15 minutes elapsed, halfway mark',
        enabled: true,
      },
      {
        atSeconds: 1500,
        label: '25 min mark',
        speechText: '25 minutes elapsed, 5 minutes remaining',
        enabled: true,
      },
    ],
  },
];

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const remainingSeconds = s % 60;
  return `${m.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatSecondsToMinutesText(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}

export function generateCheckpointsForDuration(durationSeconds: number): Checkpoint[] {
  // If matched standard preset, use its checkpoints
  const matched = TIMER_PRESETS.find((p) => p.durationSeconds === durationSeconds);
  if (matched) {
    return matched.defaultCheckpoints.map((cp, idx) => ({
      ...cp,
      id: `cp-${idx}-${Date.now()}`,
      hasTriggered: false,
    }));
  }

  // Otherwise generate sensible checkpoints based on duration
  const checkpoints: Checkpoint[] = [];
  const durationMin = Math.floor(durationSeconds / 60);

  if (durationMin >= 4) {
    // 2 min checkpoint
    checkpoints.push({
      id: `cp-2m-${Date.now()}`,
      atSeconds: 120,
      label: '2 min mark',
      speechText: '2 minutes elapsed',
      enabled: true,
      hasTriggered: false,
    });
  }

  if (durationMin >= 6) {
    // Halfway checkpoint
    const half = Math.floor(durationSeconds / 2);
    const halfMin = Math.floor(half / 60);
    checkpoints.push({
      id: `cp-half-${Date.now()}`,
      atSeconds: half,
      label: `${halfMin} min (Halfway)`,
      speechText: `${halfMin} minutes elapsed, halfway mark`,
      enabled: true,
      hasTriggered: false,
    });
  }

  return checkpoints;
}
