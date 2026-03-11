/**
 * VoiceManager.tsx
 *
 * Dashboard panel for managing cloned voices:
 * – Displays all cloned voices with name, gender, language, and pitch profile
 * – Allows uploading audio samples to clone a new voice
 * – Integrates VoicePreview for in-dashboard testing with accuracy calibration
 */

import React, { useState, useCallback, useEffect } from "react";
import VoicePreview from "./VoicePreview";

// ---------------------------------------------------------------------------
// Types (mirror server types for the frontend layer)
// ---------------------------------------------------------------------------

export interface PitchProfile {
  meanPitchHz: number;
  pitchStdDev: number;
  pitchRangeHz: [number, number];
  emotionalTonality: string;
}

export interface ClonedVoice {
  voiceId: string;
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  language: string;
  createdAt: string;
  pitchProfile?: PitchProfile;
}

export interface VoiceManagerProps {
  /** Base URL of the AI Thunderbolt Pro backend API */
  apiBaseUrl?: string;
}

interface NewVoiceForm {
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  language: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const VoiceManager: React.FC<VoiceManagerProps> = ({
  apiBaseUrl = "",
}) => {
  const [voices, setVoices] = useState<ClonedVoice[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New voice form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewVoiceForm>({
    name: "",
    description: "",
    gender: "neutral",
    language: "en-US",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  // Preview state
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch voices
  // ---------------------------------------------------------------------------

  const fetchVoices = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/voices`);
      if (!res.ok) throw new Error(`Failed to load voices (${res.status})`);
      const data = (await res.json()) as { voices: ClonedVoice[] };
      setVoices(data.voices);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    void fetchVoices();
  }, [fetchVoices]);

  // ---------------------------------------------------------------------------
  // Clone new voice
  // ---------------------------------------------------------------------------

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleClone = useCallback(async () => {
    if (!form.name.trim() || selectedFiles.length === 0) return;

    setCloning(true);
    setCloneError(null);

    try {
      const audioFiles: string[] = await Promise.all(
        selectedFiles.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve(
                  (reader.result as string).replace(/^data:[^;]+;base64,/, "")
                );
              reader.onerror = () => reject(new Error("File read error"));
              reader.readAsDataURL(file);
            })
        )
      );

      const res = await fetch(`${apiBaseUrl}/api/voices/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, audioFiles }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      setShowForm(false);
      setForm({ name: "", description: "", gender: "neutral", language: "en-US" });
      setSelectedFiles([]);
      await fetchVoices();
    } catch (err: unknown) {
      setCloneError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCloning(false);
    }
  }, [form, selectedFiles, apiBaseUrl, fetchVoices]);

  // ---------------------------------------------------------------------------
  // Delete voice
  // ---------------------------------------------------------------------------

  const handleDelete = useCallback(
    async (voiceId: string) => {
      if (!window.confirm("Delete this voice permanently?")) return;
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/voices/${encodeURIComponent(voiceId)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error(`Delete failed (${res.status})`);
        await fetchVoices();
        if (previewVoiceId === voiceId) setPreviewVoiceId(null);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [apiBaseUrl, fetchVoices, previewVoiceId]
  );

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const genderBadgeStyle = (gender: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor:
      gender === "male" ? "#bee3f8" : gender === "female" ? "#fed7e2" : "#e2e8f0",
    color: gender === "male" ? "#2b6cb0" : gender === "female" ? "#97266d" : "#4a5568",
    marginRight: 6,
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      data-testid="voice-manager"
      style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 800 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          🎙 Voice Library
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#3182ce",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showForm ? "✕ Cancel" : "+ Clone New Voice"}
        </button>
      </div>

      {/* New voice form */}
      {showForm && (
        <div
          style={{
            border: "1px solid #bee3f8",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            backgroundColor: "#ebf8ff",
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Clone a New Voice</h3>

          <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Voice Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Aria Sales Agent"
            style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e0", marginBottom: 10 }}
          />

          <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Optional description"
            style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e0", marginBottom: 10 }}
          />

          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    gender: e.target.value as "male" | "female" | "neutral",
                  }))
                }
                style={{ width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e0" }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                Language
              </label>
              <input
                type="text"
                value={form.language}
                onChange={(e) =>
                  setForm((f) => ({ ...f, language: e.target.value }))
                }
                placeholder="e.g. en-US"
                style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e0" }}
              />
            </div>
          </div>

          <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Audio Samples * (MP3/WAV, 30 sec – 5 min each)
          </label>
          <input
            type="file"
            accept="audio/mpeg,audio/wav"
            multiple
            onChange={handleFileChange}
            style={{ marginBottom: 12 }}
          />
          {selectedFiles.length > 0 && (
            <p style={{ fontSize: 12, color: "#4a5568" }}>
              {selectedFiles.length} file(s) selected
            </p>
          )}

          {cloneError && (
            <p role="alert" style={{ color: "#e53e3e", fontSize: 13 }}>
              ⚠ {cloneError}
            </p>
          )}

          <button
            onClick={() => void handleClone()}
            disabled={cloning || !form.name.trim() || selectedFiles.length === 0}
            style={{
              padding: "8px 20px",
              borderRadius: 6,
              border: "none",
              backgroundColor: cloning ? "#a0aec0" : "#38a169",
              color: "#fff",
              fontWeight: 600,
              cursor: cloning ? "not-allowed" : "pointer",
            }}
          >
            {cloning ? "⏳ Cloning…" : "🎙 Clone Voice"}
          </button>
        </div>
      )}

      {/* Voice list */}
      {isLoading && (
        <p style={{ color: "#718096" }}>Loading voices…</p>
      )}
      {loadError && (
        <p role="alert" style={{ color: "#e53e3e" }}>
          ⚠ {loadError}
        </p>
      )}

      {!isLoading && voices.length === 0 && (
        <p style={{ color: "#718096" }}>
          No cloned voices yet. Click "+ Clone New Voice" to get started.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {voices.map((voice) => (
          <div
            key={voice.voiceId}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <strong style={{ fontSize: 15 }}>{voice.name}</strong>
                <div style={{ marginTop: 4 }}>
                  <span style={genderBadgeStyle(voice.gender)}>
                    {voice.gender}
                  </span>
                  <span style={{ fontSize: 12, color: "#718096" }}>
                    {voice.language}
                  </span>
                </div>
                {voice.description && (
                  <p style={{ fontSize: 13, color: "#4a5568", margin: "4px 0 0" }}>
                    {voice.description}
                  </p>
                )}
                {voice.pitchProfile && (
                  <p style={{ fontSize: 12, color: "#718096", margin: "4px 0 0" }}>
                    Pitch:{" "}
                    {Math.round(voice.pitchProfile.meanPitchHz)} Hz avg ·{" "}
                    {voice.pitchProfile.emotionalTonality}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() =>
                    setPreviewVoiceId((id) =>
                      id === voice.voiceId ? null : voice.voiceId
                    )
                  }
                  style={{
                    padding: "4px 12px",
                    borderRadius: 4,
                    border: "1px solid #3182ce",
                    backgroundColor:
                      previewVoiceId === voice.voiceId ? "#3182ce" : "#fff",
                    color:
                      previewVoiceId === voice.voiceId ? "#fff" : "#3182ce",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                  aria-label={`Preview ${voice.name}`}
                >
                  {previewVoiceId === voice.voiceId ? "▲ Hide" : "▶ Preview"}
                </button>
                <button
                  onClick={() => void handleDelete(voice.voiceId)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 4,
                    border: "1px solid #e53e3e",
                    backgroundColor: "#fff",
                    color: "#e53e3e",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                  aria-label={`Delete ${voice.name}`}
                >
                  🗑 Delete
                </button>
              </div>
            </div>

            {/* Inline preview panel */}
            {previewVoiceId === voice.voiceId && (
              <div style={{ marginTop: 14 }}>
                <VoicePreview
                  voiceId={voice.voiceId}
                  voiceName={voice.name}
                  apiBaseUrl={apiBaseUrl}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceManager;
