import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { formatTime } from '../utils/timerDefaults';
import { BellRing, RotateCcw, XCircle, Volume2 } from 'lucide-react';

interface TimesUpModalProps {
  isOpen: boolean;
  overtimeSeconds: number;
  totalDuration: number;
  speechText: string;
  onDismiss: () => void;
  onRestart: () => void;
  onRepeatAlert: () => void;
}

export const TimesUpModal: React.FC<TimesUpModalProps> = ({
  isOpen,
  overtimeSeconds,
  totalDuration,
  speechText,
  onDismiss,
  onRestart,
  onRepeatAlert,
}) => {
  const hasFiredConfetti = useRef(false);

  useEffect(() => {
    if (isOpen && !hasFiredConfetti.current) {
      hasFiredConfetti.current = true;
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 250);
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }

    if (!isOpen) {
      hasFiredConfetti.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl overflow-hidden ring-4 ring-rose-500/20">
        {/* Pulsing Alert Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 mb-4 animate-bounce">
          <BellRing className="w-10 h-10" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Time&apos;s Up!
        </h2>

        {/* Spoken text reminder */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium my-3">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Announced: &ldquo;{speechText}&rdquo;</span>
        </div>

        {/* Overtime Counter */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Timer Completed · Overtime
          </span>
          <div className="text-3xl sm:text-4xl font-mono font-bold text-rose-400 tabular-nums">
            +{formatTime(overtimeSeconds)}
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            Target duration: {formatTime(totalDuration)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-3.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Dismiss Alarm</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-sm font-bold shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Timer</span>
          </button>
        </div>

        {/* Re-announce speech button */}
        <button
          type="button"
          onClick={onRepeatAlert}
          className="mt-4 text-xs text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <Volume2 className="w-3 h-3" />
          <span>Re-speak voice alert</span>
        </button>
      </div>
    </div>
  );
};
