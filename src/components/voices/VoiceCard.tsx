import React, { useState } from 'react';
import { Pencil, Trash2, Globe, Star } from 'lucide-react';
import type { Voice } from '@/types/voice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoicePreview } from './VoicePreview';

interface VoiceCardProps {
  voice: Voice;
  onEdit: (voice: Voice) => void;
  onDelete: (voice: Voice) => void;
}

const genderVariant = (gender: Voice['gender']) => {
  const map = { male: 'blue', female: 'purple', neutral: 'default' } as const;
  return map[gender];
};

export const VoiceCard: React.FC<VoiceCardProps> = ({ voice, onEdit, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate">{voice.name}</h3>
            {voice.isPreset && (
              <Badge variant="yellow">
                <Star size={10} className="mr-1" />
                Preset
              </Badge>
            )}
          </div>
          {voice.description && (
            <p className="mt-1 text-xs text-gray-400 line-clamp-2">{voice.description}</p>
          )}
        </div>
        {!voice.isPreset && (
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(voice)} aria-label="Edit voice">
              <Pencil size={14} />
            </Button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <Button variant="danger" size="sm" onClick={() => onDelete(voice)}>
                  Confirm
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} aria-label="Delete voice">
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={genderVariant(voice.gender)}>
          {voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1)}
        </Badge>
        <Badge variant="green">
          <Globe size={10} className="mr-1" />
          {voice.language}
        </Badge>
      </div>

      {/* Preview */}
      <div>
        <VoicePreview voiceId={voice.id} previewUrl={voice.previewUrl} />
      </div>
    </div>
  );
};
