import React, { useState } from 'react';
import { TIMER_PRESETS } from '../utils/timerDefaults';
import { TimerPreset } from '../types/timer';
import { SlidersHorizontal } from 'lucide-react';

interface PresetSelectorProps {
  selectedPresetId: string;
  onSelectPreset: (preset: TimerPreset) => void;
  onSetCustomDuration: (seconds: number) => void;
  isRunning: boolean;
  totalDuration: number;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  onSetCustomDuration,
  isRunning,
  totalDuration,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(8);
  const [customSeconds, setCustomSeconds] = useState(0);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sec = Number(customMinutes) * 60 + Number(customSeconds);
    if (sec > 0) {
      onSetCustomDuration(sec);
      setShowCustomModal(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          Timer Presets
        </span>
        {isRunning && (
          <span className="text-[11px] text-amber-400/80">
            (Timer active: selecting resets timer)
          </span>
        )}
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {TIMER_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-500/40 text-amber-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div className="font-bold text-sm sm:text-base font-mono tabular-nums text-white">
                {preset.label}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {preset.description}
              </div>
            </button>
          );
        })}

        {/* Custom Duration Button */}
        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedPresetId === 'custom'
              ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-500/40 text-amber-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base font-mono text-white">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Custom</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">
            {selectedPresetId === 'custom' ? `${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s` : 'Set any time'}
          </div>
        </button>
      </div>

      {/* Custom Duration Popover */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1">Set Custom Timer Duration</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter any duration. Checkpoints will be automatically generated with voice checkpoints.
            </p>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-lg text-center focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-lg text-center focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
                >
                  Set Duration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
