import React, { useState, useRef } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { voicesApi } from '@/lib/api';
import { toast } from 'sonner';

interface VoicePreviewProps {
  voiceId: string;
  previewUrl?: string;
  sampleText?: string;
}

export const VoicePreview: React.FC<VoicePreviewProps> = ({
  voiceId,
  previewUrl,
  sampleText = 'Hello! This is a preview of my voice. I am an AI assistant ready to help you.',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      let audioUrl = previewUrl;

      if (!audioUrl) {
        const result = await voicesApi.preview(voiceId, sampleText);
        audioUrl = result.audioUrl;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        toast.error('Failed to play audio preview');
        setIsPlaying(false);
        setIsLoading(false);
      };
      await audio.play();
      setIsPlaying(true);
    } catch {
      toast.error('Failed to load voice preview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTogglePlay}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isPlaying ? (
        <Pause size={14} />
      ) : (
        <Play size={14} />
      )}
      {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Preview'}
    </button>
  );
};
