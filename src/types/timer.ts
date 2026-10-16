export interface Checkpoint {
  id: string;
  atSeconds: number; // elapsed seconds when this triggers
  label: string; // display label e.g. "2 min mark"
  speechText: string; // voice utterance e.g. "2 minutes elapsed"
  enabled: boolean;
  hasTriggered?: boolean;
}

export interface TimerPreset {
  id: string;
  label: string;
  durationSeconds: number;
  description: string;
  defaultCheckpoints: Omit<Checkpoint, 'id' | 'hasTriggered'>[];
}

export interface VoiceSettings {
  voiceURI: string | null;
  volume: number; // 0 to 1 (default 1 = loud)
  rate: number; // 0.8 to 1.5 (default 1)
  pitch: number; // 0.8 to 1.5 (default 1)
  playChimeBeforeVoice: boolean;
  announceStart: boolean;
  startSpeechText: string;
  announceFinish: boolean;
  finishSpeechText: string;
  enableSpeech: boolean;
  enableSoundEffects: boolean;
  wakeLockEnabled: boolean;
}

export interface SessionHistory {
  id: string;
  timestamp: number;
  durationSeconds: number;
  completed: boolean;
  checkpointsReached: number;
  totalCheckpoints: number;
}
