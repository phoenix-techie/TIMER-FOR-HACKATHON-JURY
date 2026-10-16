import React from 'react';
import { Checkpoint } from '../types/timer';
import { formatTime } from '../utils/timerDefaults';
import { Volume2, CheckCircle2 } from 'lucide-react';

interface CircularTimerProps {
  remainingSeconds: number;
  totalDuration: number;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  checkpoints: Checkpoint[];
  nextCheckpoint: Checkpoint | null;
  onSelectCheckpointPreview?: (text: string) => void;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  remainingSeconds,
  totalDuration,
  isRunning,
  isPaused,
  isFinished,
  checkpoints,
  nextCheckpoint,
}) => {
  const elapsedSeconds = Math.max(0, totalDuration - remainingSeconds);
  const progressRatio = totalDuration > 0 ? Math.min(1, Math.max(0, elapsedSeconds / totalDuration)) : 0;

  // SVG dimensions
  const size = 320;
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] flex items-center justify-center">
        {/* Ambient glow behind ring */}
        <div
          className={`absolute inset-6 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
            isFinished
              ? 'bg-rose-500/30'
              : isRunning
              ? 'bg-amber-500/20'
              : 'bg-indigo-500/10'
          }`}
        />

        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full -rotate-90 transform drop-shadow-xl"
        >
          {/* Subtle Outer Track Glow */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800/80"
          />

          {/* Active Progress Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
          />

          {/* Checkpoint Markers on Circle */}
          {checkpoints.map((cp) => {
            if (!cp.enabled || cp.atSeconds <= 0 || cp.atSeconds >= totalDuration) return null;
            const angle = (cp.atSeconds / totalDuration) * 360;
            const radians = (angle * Math.PI) / 180;
            const x = center + radius * Math.cos(radians);
            const y = center + radius * Math.sin(radians);
            const isPassed = elapsedSeconds >= cp.atSeconds;

            return (
              <g key={cp.id} className="transition-all duration-300">
                {/* Checkpoint node pin */}
                <circle
                  cx={x}
                  cy={y}
                  r={isPassed ? 7 : 5}
                  fill={isPassed ? '#f59e0b' : '#334155'}
                  stroke={isPassed ? '#fef3c7' : '#0f172a'}
                  strokeWidth="2.5"
                  className="transition-colors duration-300"
                />
                {isPassed && (
                  <circle
                    cx={x}
                    cy={y}
                    r={11}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}

          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Timer Typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          {/* Status Label */}
          <span
            className={`text-xs uppercase tracking-widest font-semibold transition-colors duration-200 ${
              isFinished
                ? 'text-rose-400 font-bold animate-pulse'
                : isRunning
                ? 'text-amber-400'
                : isPaused
                ? 'text-sky-400'
                : 'text-slate-400'
            }`}
          >
            {isFinished
              ? "Time's Up!"
              : isRunning
              ? 'Timer Running'
              : isPaused
              ? 'Paused'
              : 'Ready'}
          </span>

          {/* Large Tabular Countdown */}
          <div className="text-5xl sm:text-6xl md:text-7xl font-mono font-bold tracking-tight text-white tabular-nums my-1 drop-shadow-md">
            {formatTime(remainingSeconds)}
          </div>

          {/* Time Progression Subtitle */}
          <div className="text-xs text-slate-400 font-mono tabular-nums flex items-center justify-center gap-2">
            <span>{formatTime(elapsedSeconds)} elapsed</span>
            <span>·</span>
            <span>{Math.round(progressRatio * 100)}%</span>
          </div>

          {/* Next Checkpoint Alert Pill */}
          {nextCheckpoint && isRunning && (
            <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-[11px] text-amber-200 shadow-sm max-w-[210px] truncate animate-fadeIn">
              <Volume2 className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">Next: &ldquo;{nextCheckpoint.speechText}&rdquo; in {formatTime(nextCheckpoint.atSeconds - elapsedSeconds)}</span>
            </div>
          )}

          {isFinished && (
            <div className="mt-2 flex items-center gap-1 text-xs text-rose-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finished!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
