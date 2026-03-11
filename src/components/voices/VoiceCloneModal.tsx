import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { VoiceUpload } from './VoiceUpload';
import { voicesApi } from '@/lib/api';
import type { Voice, VoiceGender } from '@/types/voice';
import { toast } from 'sonner';

interface VoiceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (voice: Voice) => void;
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

export const VoiceCloneModal: React.FC<VoiceCloneModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState<VoiceGender>('neutral');
  const [language, setLanguage] = useState('en');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Voice name is required.';
    if (name.trim().length > 60) newErrors.name = 'Name must be 60 characters or fewer.';
    if (!audioFile) newErrors.audio = 'Please upload an audio sample.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !audioFile) return;

    try {
      setIsSubmitting(true);
      const voice = await voicesApi.create({
        name: name.trim(),
        description: description.trim(),
        gender,
        language,
        audioFile,
      });
      toast.success(`Voice "${voice.name}" cloned successfully!`);
      onCreated(voice);
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to clone voice. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setGender('neutral');
    setLanguage('en');
    setAudioFile(null);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Clone New Voice" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <VoiceUpload
          onFileSelect={setAudioFile}
          selectedFile={audioFile}
          onClear={() => setAudioFile(null)}
        />
        {errors.audio && <p className="text-xs text-red-400 -mt-3">{errors.audio}</p>}

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
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Cloning Voice…
              </>
            ) : (
              'Clone Voice'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
