import React, { useState } from 'react';
import { Checkpoint } from '../types/timer';
import { formatTime } from '../utils/timerDefaults';
import { Volume2, Plus, Trash2, Check, Clock, Sparkles } from 'lucide-react';

interface CheckpointTimelineProps {
  checkpoints: Checkpoint[];
  totalDuration: number;
  remainingSeconds: number;
  isRunning: boolean;
  onToggleCheckpoint: (id: string) => void;
  onDeleteCheckpoint: (id: string) => void;
  onAddCheckpoint: (atSeconds: number, label: string, speechText: string) => void;
  onPreviewSpeech: (text: string) => void;
  onAddIntervalCheckpoints: (intervalMinutes: number) => void;
}

export const CheckpointTimeline: React.FC<CheckpointTimelineProps> = ({
  checkpoints,
  totalDuration,
  remainingSeconds,
  isRunning,
  onToggleCheckpoint,
  onDeleteCheckpoint,
  onAddCheckpoint,
  onPreviewSpeech,
  onAddIntervalCheckpoints,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMinutes, setNewMinutes] = useState(1);
  const [newSeconds, setNewSeconds] = useState(0);
  const [newSpeech, setNewSpeech] = useState('');

  const elapsedSeconds = Math.max(0, totalDuration - remainingSeconds);
  const sortedCheckpoints = [...checkpoints].sort((a, b) => a.atSeconds - b.atSeconds);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSec = Number(newMinutes) * 60 + Number(newSeconds);
    if (totalSec <= 0 || totalSec >= totalDuration) {
      return;
    }
    const label = `${newMinutes}m ${newSeconds > 0 ? `${newSeconds}s` : ''}`.trim() + ' mark';
    const speech = newSpeech.trim() || `${newMinutes} minutes elapsed`;
    onAddCheckpoint(totalSec, label, speech);
    setShowAddForm(false);
    setNewSpeech('');
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Audio Checkpoints & Voice Milestones
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            The timer speaks aloud at the start, at each milestone, and when time is up.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Checkpoint</span>
          </button>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="my-6 px-2">
        <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          {/* Progress bar */}
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, (elapsedSeconds / totalDuration) * 100))}%` }}
          />

          {/* Checkpoint tick marks inside bar */}
          {sortedCheckpoints.map((cp) => {
            if (cp.atSeconds <= 0 || cp.atSeconds >= totalDuration) return null;
            const pct = (cp.atSeconds / totalDuration) * 100;
            const isPassed = elapsedSeconds >= cp.atSeconds;
            return (
              <div
                key={cp.id}
                style={{ left: `${pct}%` }}
                className={`absolute top-0 bottom-0 w-1 -ml-0.5 ${
                  isPassed ? 'bg-amber-200' : 'bg-slate-400'
                } z-10`}
                title={`${formatTime(cp.atSeconds)} - ${cp.speechText}`}
              />
            );
          })}
        </div>

        {/* Start, Milestones, and End Labels */}
        <div className="relative w-full h-6 text-[11px] font-mono text-slate-400 mt-1">
          <span className="absolute left-0 text-slate-400">00:00 (Start)</span>
          <span className="absolute right-0 text-slate-400">{formatTime(totalDuration)} (Finish)</span>
        </div>
      </div>

      {/* Add Form Collapse */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="mb-5 p-4 rounded-xl bg-slate-950/80 border border-amber-500/30">
          <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-3">
            Add New Spoken Checkpoint
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Elapsed Minutes</label>
              <input
                type="number"
                min="0"
                max={Math.floor(totalDuration / 60)}
                value={newMinutes}
                onChange={(e) => {
                  const m = Math.max(0, Number(e.target.value));
                  setNewMinutes(m);
                  if (!newSpeech) {
                    setNewSpeech(`${m} minutes elapsed`);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Elapsed Seconds</label>
              <input
                type="number"
                min="0"
                max="59"
                value={newSeconds}
                onChange={(e) => setNewSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Voice Announcement</label>
              <input
                type="text"
                placeholder={newMinutes > 0 ? `${newMinutes} minutes elapsed` : 'e.g. 2 minutes elapsed'}
                value={newSpeech}
                onChange={(e) => setNewSpeech(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              Save Checkpoint
            </button>
          </div>
        </form>
      )}

      {/* Checkpoints Sequence List */}
      <div className="space-y-2.5">
        {/* Fixed Start Announcement Card */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-xs font-semibold">
              0:00
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Timer Start Announcement</span>
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">Immediate</span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Volume2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Says loudly: &ldquo;Timer started&rdquo;</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onPreviewSpeech('Timer started')}
            title="Preview voice output"
            className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Intermediate Checkpoints */}
        {sortedCheckpoints.map((cp) => {
          const isPassed = elapsedSeconds >= cp.atSeconds;
          const isCurrent = isRunning && !isPassed && (elapsedSeconds >= (cp.atSeconds - 30));

          return (
            <div
              key={cp.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isPassed
                  ? 'bg-amber-500/5 border-amber-500/30 text-amber-200'
                  : isCurrent
                  ? 'bg-slate-800/80 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-slate-950/40 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Time Indicator */}
                <div
                  className={`w-14 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                    isPassed
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {formatTime(cp.atSeconds)}
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{cp.label}</span>
                    {isPassed && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-mono">
                        <Check className="w-3 h-3" /> Elapsed
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] text-amber-400 animate-pulse font-mono">
                        Coming up in {formatTime(cp.atSeconds - elapsedSeconds)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Volume2 className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Says aloud: &ldquo;{cp.speechText}&rdquo;</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Preview voice */}
                <button
                  type="button"
                  onClick={() => onPreviewSpeech(cp.speechText)}
                  title="Test voice for this checkpoint"
                  className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {/* Toggle Active */}
                <button
                  type="button"
                  onClick={() => onToggleCheckpoint(cp.id)}
                  title={cp.enabled ? 'Mute this checkpoint' : 'Enable this checkpoint'}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    cp.enabled
                      ? 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                      : 'bg-slate-900 text-slate-500 line-through'
                  }`}
                >
                  {cp.enabled ? 'Active' : 'Muted'}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => onDeleteCheckpoint(cp.id)}
                  title="Remove checkpoint"
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Fixed Finish Announcement Card */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-14 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-mono text-xs font-semibold">
              {formatTime(totalDuration)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Timer Finish & Alarm</span>
                <span className="text-[10px] text-rose-400 uppercase tracking-wider font-mono">End of Timer</span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Volume2 className="w-3 h-3 text-rose-400 shrink-0" />
                <span>Says loudly: &ldquo;Time&apos;s up&rdquo; + Alarm Chimes</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onPreviewSpeech("Time's up")}
            title="Preview finish voice"
            className="p-2 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Interval Helper */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Quick auto-checkpoints:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAddIntervalCheckpoints(1)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors cursor-pointer"
          >
            Every 1 min
          </button>
          <button
            type="button"
            onClick={() => onAddIntervalCheckpoints(2)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors cursor-pointer"
          >
            Every 2 min
          </button>
          <button
            type="button"
            onClick={() => onAddIntervalCheckpoints(5)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors cursor-pointer"
          >
            Every 5 min
          </button>
        </div>
      </div>
    </div>
  );
};
