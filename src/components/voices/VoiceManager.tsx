import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Mic, Search, Loader2 } from 'lucide-react';
import type { Voice } from '@/types/voice';
import { voicesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { VoiceCard } from './VoiceCard';
import { VoiceCloneModal } from './VoiceCloneModal';
import { VoiceEditModal } from './VoiceEditModal';
import { toast } from 'sonner';

export const VoiceManager: React.FC = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null);

  const loadVoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await voicesApi.list();
      setVoices(data);
    } catch {
      toast.error('Failed to load voices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVoices();
  }, [loadVoices]);

  const handleVoiceCreated = (voice: Voice) => {
    setVoices(prev => [voice, ...prev]);
  };

  const handleVoiceUpdated = (updated: Voice) => {
    setVoices(prev => prev.map(v => (v.id === updated.id ? updated : v)));
  };

  const handleDelete = async (voice: Voice) => {
    try {
      await voicesApi.delete(voice.id);
      setVoices(prev => prev.filter(v => v.id !== voice.id));
      toast.success(`Voice "${voice.name}" deleted.`);
    } catch {
      toast.error('Failed to delete voice. Please try again.');
    }
  };

  const filtered = voices.filter(
    v =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.language.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const presetVoices = filtered.filter(v => v.isPreset);
  const clonedVoices = filtered.filter(v => !v.isPreset);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Voice Library</h2>
          <p className="mt-1 text-sm text-gray-400">
            Manage cloned voices and presets for your AI agents.
          </p>
        </div>
        <Button onClick={() => setShowCloneModal(true)}>
          <Plus size={16} />
          Clone Voice
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type="search"
          placeholder="Search voices by name, description, or language…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && voices.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-700 py-16">
          <div className="rounded-full bg-indigo-600/20 p-5">
            <Mic size={32} className="text-indigo-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-medium text-gray-200">No voices yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Clone your first voice by uploading an audio sample.
            </p>
          </div>
          <Button onClick={() => setShowCloneModal(true)}>
            <Plus size={16} />
            Clone Your First Voice
          </Button>
        </div>
      )}

      {/* Cloned Voices */}
      {!isLoading && clonedVoices.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Cloned Voices ({clonedVoices.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clonedVoices.map(voice => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                onEdit={setEditingVoice}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Preset Voices */}
      {!isLoading && presetVoices.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Preset Voices ({presetVoices.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {presetVoices.map(voice => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                onEdit={setEditingVoice}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* No search results */}
      {!isLoading && voices.length > 0 && filtered.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-500">
          No voices match "<span className="text-gray-300">{searchQuery}</span>".
        </div>
      )}

      {/* Modals */}
      <VoiceCloneModal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        onCreated={handleVoiceCreated}
      />
      <VoiceEditModal
        voice={editingVoice}
        onClose={() => setEditingVoice(null)}
        onUpdated={handleVoiceUpdated}
      />
    </div>
  );
};
