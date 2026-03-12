import React, { useState, useEffect } from 'react';
import { Loader2, Bot } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { VoiceSelector } from '@/components/voices/VoiceSelector';
import { agentsApi, voicesApi } from '@/lib/api';
import type { Agent, Voice } from '@/types/voice';
import { toast } from 'sonner';

interface AgentFormProps {
  agent?: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (agent: Agent) => void;
}

export const AgentForm: React.FC<AgentFormProps> = ({ agent, isOpen, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('en');
  const [voiceId, setVoiceId] = useState<string | undefined>(undefined);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void voicesApi.list().then(setVoices).catch(() => {
      toast.error('Failed to load voices');
    });
  }, []);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description);
      setLanguage(agent.language);
      setVoiceId(agent.voiceId);
    } else {
      setName('');
      setDescription('');
      setLanguage('en');
      setVoiceId(undefined);
    }
    setErrors({});
  }, [agent, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Agent name is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        language,
        voiceId,
      };
      const saved = agent
        ? await agentsApi.update(agent.id, payload)
        : await agentsApi.create(payload);
      toast.success(`Agent "${saved.name}" ${agent ? 'updated' : 'created'}!`);
      onSaved(saved);
      onClose();
    } catch {
      toast.error('Failed to save agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent ? 'Edit AI Agent' : 'Create AI Agent'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-xl bg-indigo-900/20 border border-indigo-800/40 px-4 py-3">
          <div className="rounded-full bg-indigo-600/30 p-2 shrink-0">
            <Bot size={18} className="text-indigo-400" />
          </div>
          <p className="text-xs text-indigo-300">
            Configure your AI agent's identity and voice. The selected voice will be used for all calls made by this agent.
          </p>
        </div>

        <Input
          label="Agent Name"
          placeholder="e.g. Sales Assistant"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
        />

        <Textarea
          label="Description (optional)"
          placeholder="Describe this agent's purpose, personality, or instructions..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />

        <VoiceSelector voices={voices} selectedVoiceId={voiceId} onSelect={setVoiceId} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {agent ? 'Saving…' : 'Creating…'}
              </>
            ) : agent ? (
              'Save Changes'
            ) : (
              'Create Agent'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
