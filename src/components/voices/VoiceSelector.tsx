import React, { useState, useMemo } from 'react';
import { Mic, Filter } from 'lucide-react';
import type { Voice, VoiceGender } from '@/types/voice';
import { Badge } from '@/components/ui/badge';
import { VoicePreview } from './VoicePreview';
import { clsx } from 'clsx';

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId?: string;
  onSelect: (voiceId: string | undefined) => void;
}

const GENDER_FILTERS: { label: string; value: VoiceGender | 'any' }[] = [
  { label: 'Any', value: 'any' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Neutral', value: 'neutral' },
];

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onSelect,
}) => {
  const [genderFilter, setGenderFilter] = useState<VoiceGender | 'any'>('any');

  const filtered = useMemo(
    () => voices.filter(v => genderFilter === 'any' || v.gender === genderFilter),
    [voices, genderFilter],
  );

  const selected = voices.find(v => v.id === selectedVoiceId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Mic size={14} />
          Voice
        </label>
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-gray-500" />
          {GENDER_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setGenderFilter(f.value)}
              className={clsx(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                genderFilter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="rounded-lg border border-indigo-500/50 bg-indigo-900/20 px-4 py-2.5 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-600/30 flex items-center justify-center shrink-0">
            <Mic size={14} className="text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-200 truncate">{selected.name}</p>
            <p className="text-xs text-indigo-400 capitalize">{selected.gender} • {selected.language}</p>
          </div>
          <button
            onClick={() => onSelect(undefined)}
            className="text-xs text-indigo-400 hover:text-indigo-200 transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {!selected && (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-800 divide-y divide-gray-800/50">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No voices match the selected filter.
            </div>
          ) : (
            filtered.map(voice => (
              <div
                key={voice.id}
                onClick={() => onSelect(voice.id)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/60 transition-colors',
                  selectedVoiceId === voice.id && 'bg-indigo-900/30',
                )}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onSelect(voice.id)}
                aria-selected={selectedVoiceId === voice.id}
              >
                <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                  <Mic size={14} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{voice.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant={voice.gender === 'male' ? 'blue' : voice.gender === 'female' ? 'purple' : 'default'}>
                      {voice.gender}
                    </Badge>
                    <span className="text-xs text-gray-500">{voice.language}</span>
                  </div>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <VoicePreview voiceId={voice.id} previewUrl={voice.previewUrl} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
