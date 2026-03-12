import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { voicesApi } from '@/lib/api';
import type { Voice, VoiceGender } from '@/types/voice';
import { toast } from 'sonner';

interface VoiceEditModalProps {
  voice: Voice | null;
  onClose: () => void;
  onUpdated: (voice: Voice) => void;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
];

const GENDERS: { value: VoiceGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'neutral', label: 'Neutral' },
];

export const VoiceEditModal: React.FC<VoiceEditModalProps> = ({ voice, onClose, onUpdated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState<VoiceGender>('neutral');
  const [language, setLanguage] = useState('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (voice) {
      setName(voice.name);
      setDescription(voice.description);
      setGender(voice.gender);
      setLanguage(voice.language);
      setErrors({});
    }
  }, [voice]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Voice name is required.';
    if (name.trim().length > 60) newErrors.name = 'Name must be 60 characters or fewer.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !voice) return;

    try {
      setIsSubmitting(true);
      const updated = await voicesApi.update(voice.id, {
        name: name.trim(),
        description: description.trim(),
        gender,
        language,
      });
      toast.success('Voice updated successfully!');
      onUpdated(updated);
      onClose();
    } catch {
      toast.error('Failed to update voice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={voice !== null} onClose={onClose} title="Edit Voice" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Voice Name"
          placeholder="e.g. Professional Sarah"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
          maxLength={60}
        />

        <Textarea
          label="Description (optional)"
          placeholder="Describe this voice – tone, use case, etc."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Gender"
            value={gender}
            onChange={e => setGender(e.target.value as VoiceGender)}
            options={GENDERS}
          />
          <Select
            label="Language"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            options={LANGUAGES}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
