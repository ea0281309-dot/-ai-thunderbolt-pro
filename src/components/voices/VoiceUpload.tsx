import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileAudio, X, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface VoiceUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave'];
const MAX_SIZE_MB = 50;
const MIN_SIZE_MB = 0.5; // ~30 seconds minimum

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const VoiceUpload: React.FC<VoiceUploadProps> = ({ onFileSelect, selectedFile, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
      return 'Only MP3 and WAV files are accepted.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must be smaller than ${MAX_SIZE_MB} MB.`;
    }
    if (file.size < MIN_SIZE_MB * 1024 * 1024) {
      return 'File is too small. Please upload at least 30 seconds of audio.';
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (selectedFile) {
    return (
      <div className="rounded-xl border border-green-700 bg-green-900/20 p-4 flex items-center gap-3">
        <CheckCircle size={20} className="text-green-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-300 truncate">{selectedFile.name}</p>
          <p className="text-xs text-green-500">{formatFileSize(selectedFile.size)}</p>
        </div>
        <button
          onClick={onClear}
          className="rounded-lg p-1 text-green-400 hover:bg-green-800/50 hover:text-white transition-colors"
          aria-label="Remove file"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'cursor-pointer rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-colors',
          isDragging
            ? 'border-indigo-500 bg-indigo-900/20'
            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800',
        )}
        role="button"
        aria-label="Upload audio file"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        <div className="rounded-full bg-indigo-600/20 p-4">
          <Upload size={24} className="text-indigo-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-200">
            Drag & drop audio file here, or click to browse
          </p>
          <p className="mt-1 text-xs text-gray-500">MP3 or WAV • 30 seconds – 5 minutes • Max 50 MB</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <FileAudio size={12} />
          <span>MP3</span>
          <span>•</span>
          <FileAudio size={12} />
          <span>WAV</span>
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
      />
    </div>
  );
};
