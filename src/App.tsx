/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Checkpoint,
  TimerPreset,
  VoiceSettings,
  SessionHistory,
} from './types/timer';
import {
  DEFAULT_VOICE_SETTINGS,
  TIMER_PRESETS,
  generateCheckpointsForDuration,
} from './utils/timerDefaults';
import {
  unlockAudioContext,
  playStartSound,
  playTimesUpSound,
  playClickSound,
  speakLoudly,
  requestWakeLock,
  releaseWakeLock,
} from './utils/audioVoice';
import { CircularTimer } from './components/CircularTimer';
import { PresetSelector } from './components/PresetSelector';
import { CheckpointTimeline } from './components/CheckpointTimeline';
import { SettingsModal } from './components/SettingsModal';
import { TimesUpModal } from './components/TimesUpModal';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  History,
  Timer as TimerIcon,
} from 'lucide-react';

export default function App() {
  // Preset & Configuration
  const [selectedPresetId, setSelectedPresetId] = useState<string>('5min');
  const [totalDuration, setTotalDuration] = useState<number>(300); // 5 min default as requested
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState<number>(0);

  // Checkpoints
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => {
    const fiveMinPreset = TIMER_PRESETS.find((p) => p.id === '5min')!;
    return fiveMinPreset.defaultCheckpoints.map((cp, idx) => ({
      ...cp,
      id: `cp-5min-${idx}`,
      hasTriggered: false,
    }));
  });

  // Voice Settings (stored in local state, seeded with loud voice defaults)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('vocal_timer_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_VOICE_SETTINGS;
  });

  // UI Modals
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sessionLogs, setSessionLogs] = useState<SessionHistory[]>(() => {
    try {
      const saved = localStorage.getItem('vocal_timer_sessions');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Timing references for drift-free countdown
  const startTimeRef = useRef<number>(0);
  const pausedTimeElapsedRef = useRef<number>(0);
  const finishIntervalRef = useRef<number | null>(null);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vocal_timer_settings', JSON.stringify(voiceSettings));
    } catch {
      // ignore
    }
  }, [voiceSettings]);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vocal_timer_sessions', JSON.stringify(sessionLogs));
    } catch {
      // ignore
    }
  }, [sessionLogs]);

  // Next upcoming checkpoint finder
  const elapsedSeconds = Math.max(0, totalDuration - remainingSeconds);
  const nextCheckpoint = checkpoints
    .filter((cp) => cp.enabled && !cp.hasTriggered && cp.atSeconds > elapsedSeconds)
    .sort((a, b) => a.atSeconds - b.atSeconds)[0] || null;

  /**
   * Reset timer state to initial duration and clear checkpoints hasTriggered
   */
  const handleReset = useCallback(() => {
    playClickSound();
    setIsRunning(false);
    setIsPaused(false);
    setIsFinished(false);
    setOvertimeSeconds(0);
    setRemainingSeconds(totalDuration);
    pausedTimeElapsedRef.current = 0;
    if (finishIntervalRef.current) {
      window.clearInterval(finishIntervalRef.current);
      finishIntervalRef.current = null;
    }
    releaseWakeLock();

    setCheckpoints((prev) =>
      prev.map((cp) => ({
        ...cp,
        hasTriggered: false,
      }))
    );
  }, [totalDuration]);

  /**
   * Select a preset
   */
  const handleSelectPreset = (preset: TimerPreset) => {
    playClickSound();
    setSelectedPresetId(preset.id);
    setTotalDuration(preset.durationSeconds);
    setRemainingSeconds(preset.durationSeconds);
    setIsRunning(false);
    setIsPaused(false);
    setIsFinished(false);
    setOvertimeSeconds(0);
    pausedTimeElapsedRef.current = 0;
    if (finishIntervalRef.current) {
      window.clearInterval(finishIntervalRef.current);
      finishIntervalRef.current = null;
    }

    setCheckpoints(
      preset.defaultCheckpoints.map((cp, idx) => ({
        ...cp,
        id: `cp-${preset.id}-${idx}-${Date.now()}`,
        hasTriggered: false,
      }))
    );
  };

  /**
   * Set Custom duration
   */
  const handleSetCustomDuration = (seconds: number) => {
    setSelectedPresetId('custom');
    setTotalDuration(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(false);
    setIsPaused(false);
    setIsFinished(false);
    setOvertimeSeconds(0);
    pausedTimeElapsedRef.current = 0;

    const newCheckpoints = generateCheckpointsForDuration(seconds);
    setCheckpoints(newCheckpoints);
  };

  /**
   * Start / Resume Timer
   */
  const handleStartResume = () => {
    unlockAudioContext();

    if (voiceSettings.wakeLockEnabled) {
      requestWakeLock();
    }

    if (!isRunning && !isPaused) {
      // Brand new start
      if (voiceSettings.enableSoundEffects) {
        playStartSound(voiceSettings.volume);
      }
      if (voiceSettings.announceStart && voiceSettings.enableSpeech) {
        // Speak loudly: "Timer started" (or custom text)
        speakLoudly(voiceSettings.startSpeechText || 'Timer started', voiceSettings);
      }
      startTimeRef.current = Date.now();
      pausedTimeElapsedRef.current = 0;
    } else if (isPaused) {
      // Resume from paused
      startTimeRef.current = Date.now() - pausedTimeElapsedRef.current * 1000;
    }

    setIsRunning(true);
    setIsPaused(false);
    setIsFinished(false);
  };

  /**
   * Pause Timer
   */
  const handlePause = () => {
    playClickSound();
    setIsRunning(false);
    setIsPaused(true);
    pausedTimeElapsedRef.current = totalDuration - remainingSeconds;
    releaseWakeLock();
  };

  /**
   * Main Countdown Tick Hook
   */
  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      const now = Date.now();
      const currentElapsed = Math.floor((now - startTimeRef.current) / 1000);
      const newRemaining = Math.max(0, totalDuration - currentElapsed);

      setRemainingSeconds(newRemaining);

      // Check for Checkpoint triggers
      setCheckpoints((prevCheckpoints) => {
        let hasChanges = false;
        const updated = prevCheckpoints.map((cp) => {
          if (cp.enabled && !cp.hasTriggered && currentElapsed >= cp.atSeconds) {
            hasChanges = true;
            // Speak checkpoint milestone aloud loudly!
            speakLoudly(cp.speechText, voiceSettings);
            return { ...cp, hasTriggered: true };
          }
          return cp;
        });
        return hasChanges ? updated : prevCheckpoints;
      });

      // Timer Finished condition
      if (newRemaining <= 0) {
        window.clearInterval(interval);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(true);

        // Loud fanfare and Times Up announcement
        if (voiceSettings.enableSoundEffects) {
          playTimesUpSound(voiceSettings.volume);
        }
        if (voiceSettings.announceFinish && voiceSettings.enableSpeech) {
          speakLoudly(voiceSettings.finishSpeechText || "Time's up", voiceSettings);
        }

        // Record session
        setSessionLogs((prev) => [
          {
            id: `session-${Date.now()}`,
            timestamp: Date.now(),
            durationSeconds: totalDuration,
            completed: true,
            checkpointsReached: checkpoints.filter((cp) => cp.enabled).length,
            totalCheckpoints: checkpoints.filter((cp) => cp.enabled).length,
          },
          ...prev.slice(0, 9),
        ]);

        // Start overtime counter
        const finishTime = Date.now();
        finishIntervalRef.current = window.setInterval(() => {
          setOvertimeSeconds(Math.floor((Date.now() - finishTime) / 1000));
        }, 1000);
      }
    }, 200);

    return () => {
      window.clearInterval(interval);
    };
  }, [isRunning, totalDuration, voiceSettings, checkpoints]);

  /**
   * Adjust remaining time by seconds on the fly (+1m, -30s)
   */
  const handleAdjustTime = (deltaSeconds: number) => {
    playClickSound();
    const newRemaining = Math.max(5, remainingSeconds + deltaSeconds);
    const newTotal = isRunning || isPaused ? Math.max(newRemaining, totalDuration + (deltaSeconds > 0 ? deltaSeconds : 0)) : newRemaining;
    setTotalDuration(newTotal);
    setRemainingSeconds(newRemaining);
    if (isRunning) {
      startTimeRef.current = Date.now() - (newTotal - newRemaining) * 1000;
    }
  };

  /**
   * Fullscreen toggle
   */
  const toggleFullscreen = () => {
    playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  /**
   * Checkpoint timeline actions
   */
  const handleToggleCheckpoint = (id: string) => {
    playClickSound();
    setCheckpoints((prev) =>
      prev.map((cp) => (cp.id === id ? { ...cp, enabled: !cp.enabled } : cp))
    );
  };

  const handleDeleteCheckpoint = (id: string) => {
    playClickSound();
    setCheckpoints((prev) => prev.filter((cp) => cp.id !== id));
  };

  const handleAddCheckpoint = (atSeconds: number, label: string, speechText: string) => {
    playClickSound();
    const newCp: Checkpoint = {
      id: `cp-custom-${Date.now()}`,
      atSeconds,
      label,
      speechText,
      enabled: true,
      hasTriggered: elapsedSeconds >= atSeconds,
    };
    setCheckpoints((prev) => [...prev, newCp]);
  };

  const handleAddIntervalCheckpoints = (intervalMinutes: number) => {
    playClickSound();
    const intervalSec = intervalMinutes * 60;
    const additions: Checkpoint[] = [];
    for (let s = intervalSec; s < totalDuration; s += intervalSec) {
      const min = Math.floor(s / 60);
      const exists = checkpoints.some((c) => c.atSeconds === s);
      if (!exists) {
        additions.push({
          id: `cp-interval-${s}-${Date.now()}`,
          atSeconds: s,
          label: `${min} min mark`,
          speechText: `${min} minutes elapsed`,
          enabled: true,
          hasTriggered: elapsedSeconds >= s,
        });
      }
    }
    setCheckpoints((prev) => [...prev, ...additions]);
  };

  const handlePreviewSpeech = (text: string) => {
    unlockAudioContext();
    speakLoudly(text, voiceSettings);
  };

  const handleReannounceTimesUp = () => {
    unlockAudioContext();
    if (voiceSettings.enableSoundEffects) {
      playTimesUpSound(voiceSettings.volume);
    }
    speakLoudly(voiceSettings.finishSpeechText || "Time's up", voiceSettings);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        {/* Zone 1: Single text element Brand wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <TimerIcon className="w-4 h-4 text-slate-950" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            VocalTimer
          </span>
        </div>

        {/* Zone 2: Informational Nav Links / Badges */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
          <span className="text-amber-400 font-mono flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            Loud Audio Milestones Active
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>Web Speech Synthesis</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>Screen Awake: {voiceSettings.wakeLockEnabled ? 'On' : 'Off'}</span>
        </div>

        {/* Zone 3: Primary Actions (Mute toggle, Settings modal, Fullscreen) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              setVoiceSettings((s) => ({
                ...s,
                enableSpeech: !s.enableSpeech,
                enableSoundEffects: !s.enableSoundEffects,
              }))
            }
            title={voiceSettings.enableSpeech ? 'Mute all audio' : 'Unmute audio'}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              voiceSettings.enableSpeech && voiceSettings.enableSoundEffects
                ? 'bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {voiceSettings.enableSpeech ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Voice & Sound</span>
          </button>
        </div>
      </header>

      {/* Main App Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-8">
        {/* Preset Selector */}
        <PresetSelector
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          onSetCustomDuration={handleSetCustomDuration}
          isRunning={isRunning}
          totalDuration={totalDuration}
        />

        {/* Core Timer Viewport Section (2 Columns on large screen: Center Dial + Controls & Checkpoints) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Countdown Ring & Primary Tactile Controls */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-md shadow-xl">
            {/* The Circular Countdown Gauge */}
            <CircularTimer
              remainingSeconds={remainingSeconds}
              totalDuration={totalDuration}
              isRunning={isRunning}
              isPaused={isPaused}
              isFinished={isFinished}
              checkpoints={checkpoints}
              nextCheckpoint={nextCheckpoint}
            />

            {/* Big Tactile Action Buttons */}
            <div className="w-full flex items-center justify-center gap-3 mt-6">
              {!isRunning ? (
                <button
                  type="button"
                  onClick={handleStartResume}
                  className="flex-1 max-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{isPaused ? 'Resume' : 'Start Timer'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="flex-1 max-w-[200px] h-14 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500 text-amber-300 font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                title="Reset Timer"
                className="w-14 h-14 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Time Adjusters (+1m, +30s, -30s) */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800/80 w-full justify-center">
              <span className="text-[11px] text-slate-500 font-mono">Quick Adjust:</span>
              <button
                type="button"
                onClick={() => handleAdjustTime(-30)}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                -30s
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTime(30)}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTime(60)}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                +1 min
              </button>
            </div>
          </div>

          {/* Right Column: Audio Checkpoints & Voice Milestones Timeline */}
          <div className="lg:col-span-7 space-y-6">
            <CheckpointTimeline
              checkpoints={checkpoints}
              totalDuration={totalDuration}
              remainingSeconds={remainingSeconds}
              isRunning={isRunning}
              onToggleCheckpoint={handleToggleCheckpoint}
              onDeleteCheckpoint={handleDeleteCheckpoint}
              onAddCheckpoint={handleAddCheckpoint}
              onPreviewSpeech={handlePreviewSpeech}
              onAddIntervalCheckpoints={handleAddIntervalCheckpoints}
            />

            {/* Completed Sessions Log */}
            {sessionLogs.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Recent Completed Sessions</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {sessionLogs.length} logged
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sessionLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-white">
                          {Math.floor(log.durationSeconds / 60)} min timer
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        ✓ Finished
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quiet Clean Footer */}
      <footer className="mt-8 border-t border-slate-800/60 py-4 px-4 text-center text-xs text-slate-500">
        <p>VocalTimer · Built with Speech Synthesis & Web Audio for crisp, hands-free audio announcements.</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={voiceSettings}
        onUpdateSettings={(newPartial) => setVoiceSettings((prev) => ({ ...prev, ...newPartial }))}
      />

      {/* Times Up Modal */}
      <TimesUpModal
        isOpen={isFinished}
        overtimeSeconds={overtimeSeconds}
        totalDuration={totalDuration}
        speechText={voiceSettings.finishSpeechText || "Time's up"}
        onDismiss={handleReset}
        onRestart={() => {
          handleReset();
          setTimeout(() => {
            handleStartResume();
          }, 150);
        }}
        onRepeatAlert={handleReannounceTimesUp}
      />
    </div>
  );
}
