/**
 * VoicePreview.tsx
 *
 * Plays a preview of a cloned voice and provides an adjustable
 * "Calibrate Accuracy" slider that controls the ElevenLabs synthesis
 * quality settings sent to the backend.
 */

import React, { useState, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoicePreviewProps {
  /** ElevenLabs voice ID of the cloned voice to preview */
  voiceId: string;
  /** Display name for the voice */
  voiceName: string;
  /** Base URL of the AI Thunderbolt Pro backend API */
  apiBaseUrl?: string;
  /** Sample text sent for synthesis (customisable by the user) */
  defaultSampleText?: string;
  /** Initial accuracy level [0, 1] */
  initialAccuracyLevel?: number;
  /** Initial smoothing factor [0, 1] */
  initialSmoothingFactor?: number;
}

export type PreviewState = "idle" | "loading" | "playing" | "error";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * VoicePreview renders:
 * - An editable sample-text input
 * - A "Calibrate Accuracy" slider (maps to ElevenLabs accuracy settings)
 * - A "Smoothing" slider (post-processing noise reduction)
 * - A Play / Stop button that streams the synthesized audio
 */
const VoicePreview: React.FC<VoicePreviewProps> = ({
  voiceId,
  voiceName,
  apiBaseUrl = "",
  defaultSampleText = "Hello! This is a preview of your cloned voice.",
  initialAccuracyLevel = 0.8,
  initialSmoothingFactor = 0.5,
}) => {
  const [sampleText, setSampleText] = useState(defaultSampleText);
  const [accuracyLevel, setAccuracyLevel] = useState(initialAccuracyLevel);
  const [smoothingFactor, setSmoothingFactor] = useState(initialSmoothingFactor);
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  /** Releases any previously created object URL to avoid memory leaks. */
  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    releaseObjectUrl();
    setPreviewState("idle");
  }, [releaseObjectUrl]);

  const handlePlay = useCallback(async () => {
    if (previewState === "playing") {
      stopPlayback();
      return;
    }

    setPreviewState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/voices/${encodeURIComponent(voiceId)}/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sampleText, accuracyLevel, smoothingFactor }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errorData.error ?? `Server returned ${response.status}`
        );
      }

      const blob = await response.blob();
      releaseObjectUrl();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => setPreviewState("idle");
      audio.onerror = () => {
        setPreviewState("error");
        setErrorMessage("Audio playback failed.");
      };

      await audio.play();
      setPreviewState("playing");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      setPreviewState("error");
    }
  }, [
    previewState,
    voiceId,
    apiBaseUrl,
    sampleText,
    accuracyLevel,
    smoothingFactor,
    releaseObjectUrl,
    stopPlayback,
  ]);

  const accuracyLabel = `${Math.round(accuracyLevel * 100)}%`;
  const smoothingLabel = `${Math.round(smoothingFactor * 100)}%`;

  return (
    <div
      className="voice-preview"
      data-testid="voice-preview"
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 16,
        maxWidth: 480,
        fontFamily: "sans-serif",
      }}
    >
      {/* Header */}
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>
        🎙 {voiceName}
      </h3>

      {/* Sample text */}
      <label
        htmlFor={`sample-text-${voiceId}`}
        style={{ display: "block", fontSize: 13, marginBottom: 4 }}
      >
        Sample text
      </label>
      <textarea
        id={`sample-text-${voiceId}`}
        value={sampleText}
        onChange={(e) => setSampleText(e.target.value)}
        rows={3}
        style={{
          width: "100%",
          boxSizing: "border-box",
          resize: "vertical",
          borderRadius: 4,
          border: "1px solid #cbd5e0",
          padding: "6px 8px",
          fontSize: 14,
          marginBottom: 12,
        }}
        disabled={previewState === "loading" || previewState === "playing"}
      />

      {/* Calibrate Accuracy slider */}
      <label
        htmlFor={`accuracy-${voiceId}`}
        style={{ display: "block", fontSize: 13, marginBottom: 4 }}
      >
        Calibrate Accuracy:{" "}
        <strong>{accuracyLabel}</strong>
      </label>
      <input
        id={`accuracy-${voiceId}`}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={accuracyLevel}
        onChange={(e) => setAccuracyLevel(parseFloat(e.target.value))}
        style={{ width: "100%", marginBottom: 12 }}
        aria-label="Calibrate Accuracy"
        disabled={previewState === "loading" || previewState === "playing"}
      />

      {/* Smoothing slider */}
      <label
        htmlFor={`smoothing-${voiceId}`}
        style={{ display: "block", fontSize: 13, marginBottom: 4 }}
      >
        Post-processing Smoothing:{" "}
        <strong>{smoothingLabel}</strong>
      </label>
      <input
        id={`smoothing-${voiceId}`}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={smoothingFactor}
        onChange={(e) => setSmoothingFactor(parseFloat(e.target.value))}
        style={{ width: "100%", marginBottom: 16 }}
        aria-label="Post-processing Smoothing"
        disabled={previewState === "loading" || previewState === "playing"}
      />

      {/* Play / Stop button */}
      <button
        onClick={handlePlay}
        disabled={previewState === "loading" || !sampleText.trim()}
        style={{
          padding: "8px 20px",
          borderRadius: 6,
          border: "none",
          cursor:
            previewState === "loading" || !sampleText.trim()
              ? "not-allowed"
              : "pointer",
          backgroundColor:
            previewState === "playing"
              ? "#e53e3e"
              : previewState === "loading"
              ? "#a0aec0"
              : "#3182ce",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
        }}
        aria-label={previewState === "playing" ? "Stop preview" : "Play preview"}
      >
        {previewState === "loading"
          ? "⏳ Generating…"
          : previewState === "playing"
          ? "⏹ Stop"
          : "▶ Play Preview"}
      </button>

      {/* Error message */}
      {previewState === "error" && errorMessage && (
        <p
          role="alert"
          style={{ color: "#e53e3e", marginTop: 8, fontSize: 13 }}
        >
          ⚠ {errorMessage}
        </p>
      )}
    </div>
  );
};

export default VoicePreview;
