import React, { useEffect, useState } from 'react';
import { VoiceSettings } from '../types/timer';
import { getAvailableVoices, speakLoudly, playCheckpointSound } from '../utils/audioVoice';
import { Volume2, VolumeX, Sparkles, X, SunMedium, Play } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getAvailableVoices().then((v) => {
        setVoices(v);
        // If no voice selected, pick default English voice
        if (!settings.voiceURI && v.length > 0) {
          const defaultEn = v.find((voice) => voice.lang.startsWith('en') && (voice.name.includes('Natural') || voice.default)) || v[0];
          if (defaultEn) {
            onUpdateSettings({ voiceURI: defaultEn.voiceURI });
          }
        }
      });
    }
  }, [isOpen, settings.voiceURI, onUpdateSettings]);

  if (!isOpen) return null;

  const handleTestAudio = () => {
    setIsTesting(true);
    speakLoudly(
      'Timer started. 2 minutes elapsed. Time is up!',
      settings,
      () => setIsTesting(false)
    );
  };

  const handleTestChimeOnly = () => {
    playCheckpointSound(settings.volume);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Voice & Sound Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Sound Master Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => onUpdateSettings({ enableSpeech: !settings.enableSpeech })}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                settings.enableSpeech
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">Spoken Voice</span>
                {settings.enableSpeech ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </div>
              <p className="text-[11px] text-slate-400">
                {settings.enableSpeech ? 'Announcing checkpoints aloud' : 'Speech muted'}
              </p>
            </div>

            <div
              onClick={() => onUpdateSettings({ enableSoundEffects: !settings.enableSoundEffects })}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                settings.enableSoundEffects
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">Sound Chimes</span>
                <Sparkles className={`w-4 h-4 ${settings.enableSoundEffects ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>
              <p className="text-[11px] text-slate-400">
                {settings.enableSoundEffects ? 'Chimes before speech' : 'Silent chimes'}
              </p>
            </div>
          </div>

          {/* Volume Slider (Loudness) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Voice & Alarm Loudness</span>
              <span className="text-amber-400 font-mono font-bold">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.volume}
              onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Set to 100% for maximum volume so checkpoints can be heard clearly across the room.
            </p>
          </div>

          {/* Voice Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Speech Synthesis Voice
            </label>
            <select
              value={settings.voiceURI || ''}
              onChange={(e) => onUpdateSettings({ voiceURI: e.target.value || null })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
            >
              {voices.length === 0 ? (
                <option value="">Default System Voice</option>
              ) : (
                voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang}) {v.default ? '★' : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Speech Rate & Pitch */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Speaking Speed</span>
                <span className="text-white font-mono">{settings.rate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={settings.rate}
                onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Pitch</span>
                <span className="text-white font-mono">{settings.pitch}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.05"
                value={settings.pitch}
                onChange={(e) => onUpdateSettings({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Custom Start & Finish Phrases */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Start Speech Phrase
              </label>
              <input
                type="text"
                value={settings.startSpeechText}
                onChange={(e) => onUpdateSettings({ startSpeechText: e.target.value })}
                placeholder="Timer started"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Finish Speech Phrase
              </label>
              <input
                type="text"
                value={settings.finishSpeechText}
                onChange={(e) => onUpdateSettings({ finishSpeechText: e.target.value })}
                placeholder="Time's up"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Screen WakeLock */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <SunMedium className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-white">Keep Screen Awake</div>
                <div className="text-[11px] text-slate-400">Prevents device display from sleeping while running</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.wakeLockEnabled}
              onChange={(e) => onUpdateSettings({ wakeLockEnabled: e.target.checked })}
              className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
            />
          </div>

          {/* Test Speech Sample */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
            <div className="text-xs text-amber-200">
              <span className="font-semibold block">Test Voice & Volume</span>
              <span className="text-[11px] text-amber-300/70">Verify volume and voice output</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestChimeOnly}
                className="px-2.5 py-1.5 text-xs text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg transition-colors cursor-pointer"
              >
                Chime
              </button>
              <button
                type="button"
                onClick={handleTestAudio}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isTesting ? 'Speaking...' : 'Test Speech'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
