import { Analytics } from '@vercel/analytics/react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  addEmotion,
  ApiError,
  ACTIVE_CALL_STORAGE_KEY,
  endCall,
  getCall,
  listCalls,
  startCall,
  type CallRecord,
  type Sentiment,
} from './api';

const DEFAULT_EMOTIONS = [
  'calm',
  'curious',
  'excited',
  'frustrated',
  'joy',
  'neutral',
  'relieved',
  'sad',
  'surprised',
  'tense',
];

type BannerTone = 'idle' | 'loading' | 'success' | 'error';

interface BannerState {
  tone: BannerTone;
  message: string | null;
}

interface EmotionErrors {
  emotion?: string;
  confidence?: string;
  sentiment?: string;
}

const idleBanner = (): BannerState => ({ tone: 'idle', message: null });

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function validateEmotionForm(emotion: string, confidence: string, sentiment: Sentiment): EmotionErrors {
  const errors: EmotionErrors = {};
  const trimmedEmotion = emotion.trim();
  const numericConfidence = Number(confidence);

  if (!trimmedEmotion) {
    errors.emotion = 'Enter a non-empty emotion label.';
  }

  if (!confidence.trim()) {
    errors.confidence = 'Enter a confidence value between 0 and 1.';
  } else if (!Number.isFinite(numericConfidence)) {
    errors.confidence = 'Confidence must be a number between 0 and 1.';
  } else if (numericConfidence < 0 || numericConfidence > 1) {
    errors.confidence = 'Confidence must stay between 0 and 1.';
  }

  if (sentiment !== 'positive' && sentiment !== 'negative' && sentiment !== 'neutral') {
    errors.sentiment = 'Choose a valid sentiment.';
  }

  return errors;
}

function mergeCalls(previous: CallRecord[], next: CallRecord): CallRecord[] {
  const index = previous.findIndex((call) => call.sid === next.sid);
  if (index === -1) {
    return [next, ...previous];
  }

  const updated = [...previous];
  updated[index] = next;
  return updated;
}

function getEmotionLabelsFromCall(call: CallRecord): string[] {
  return call.emotions.map((entry) => entry.emotion);
}

function Banner({ banner }: { banner: BannerState }) {
  if (banner.tone === 'idle' || !banner.message) {
    return null;
  }

  const isError = banner.tone === 'error';

  return (
    <div
      className={`banner banner-${banner.tone}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {banner.message}
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatDuration(seconds?: number): string {
  if (seconds == null) {
    return '—';
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

export default function App() {
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [restoringSession, setRestoringSession] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [emotionLoading, setEmotionLoading] = useState(false);

  const [sessionBanner, setSessionBanner] = useState<BannerState>({
    tone: 'loading',
    message: 'Checking for a saved call session…',
  });
  const [callBanner, setCallBanner] = useState<BannerState>(idleBanner());
  const [historyBanner, setHistoryBanner] = useState<BannerState>(idleBanner());
  const [emotionBanner, setEmotionBanner] = useState<BannerState>(idleBanner());

  const [emotion, setEmotion] = useState('');
  const [confidence, setConfidence] = useState('0.8');
  const [sentiment, setSentiment] = useState<Sentiment>('positive');
  const [emotionErrors, setEmotionErrors] = useState<EmotionErrors>({});

  const upsertCall = useCallback((call: CallRecord) => {
    setCalls((previous) => mergeCalls(previous, call));
  }, []);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryBanner({
      tone: 'loading',
      message: 'Refreshing call history…',
    });

    try {
      const data = await listCalls();
      setCalls(data);
      setHistoryBanner({
        tone: 'success',
        message: data.length === 0 ? 'No saved call history yet.' : `Loaded ${data.length} call${data.length === 1 ? '' : 's'}.`,
      });
    } catch (error) {
      setHistoryBanner({
        tone: 'error',
        message: `Unable to load call history. ${errorMessage(error, 'Please try again.')}`,
      });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const savedSid = window.localStorage.getItem(ACTIVE_CALL_STORAGE_KEY);
      if (!savedSid) {
        if (!cancelled) {
          setSessionBanner(idleBanner());
          setRestoringSession(false);
        }
        return;
      }

      setSessionBanner({
        tone: 'loading',
        message: 'Restoring your saved call session…',
      });

      try {
        const call = await getCall(savedSid);
        if (cancelled) return;

        setActiveCall(call);
        upsertCall(call);
        setSessionBanner({
          tone: 'success',
          message:
            call.status === 'active'
              ? `Restored active call ${call.sid}.`
              : `Restored completed call ${call.sid}.`,
        });
      } catch (error) {
        if (cancelled) return;

        window.localStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
        setSessionBanner({
          tone: 'error',
          message: `Saved session could not be restored. ${errorMessage(error, 'Start a new call to continue.')}`,
        });
      } finally {
        if (!cancelled) {
          setRestoringSession(false);
        }
      }
    };

    void restoreSession();
    void refreshHistory();

    return () => {
      cancelled = true;
    };
  }, [refreshHistory, upsertCall]);

  useEffect(() => {
    if (!activeCall || activeCall.status !== 'active') {
      window.localStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(ACTIVE_CALL_STORAGE_KEY, activeCall.sid);
  }, [activeCall]);

  const recentEmotionLabels = useMemo(() => {
    const candidates = [...calls.flatMap(getEmotionLabelsFromCall), ...(activeCall ? getEmotionLabelsFromCall(activeCall) : [])];

    const seen = new Set<string>();
    return candidates.filter((value) => {
      const key = value.trim().toLowerCase();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [activeCall, calls]);

  const emotionSuggestions = useMemo(() => {
    const candidates = [...DEFAULT_EMOTIONS, ...recentEmotionLabels];
    const seen = new Set<string>();
    return candidates.filter((value) => {
      const key = value.trim().toLowerCase();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [recentEmotionLabels]);

  const resetEmotionForm = useCallback(() => {
    setEmotion('');
    setConfidence('0.8');
    setSentiment('positive');
    setEmotionErrors({});
  }, []);

  const handleStartCall = useCallback(async () => {
    setCallBanner({
      tone: 'loading',
      message: 'Starting a new call session…',
    });

    try {
      const call = await startCall();
      setActiveCall(call);
      upsertCall(call);
      resetEmotionForm();
      setEmotionBanner(idleBanner());
      setSessionBanner(idleBanner());
      setCallBanner({
        tone: 'success',
        message: `Call ${call.sid} started.`,
      });
    } catch (error) {
      setCallBanner({
        tone: 'error',
        message: `Unable to start a call. ${errorMessage(error, 'Please try again.')}`,
      });
    }
  }, [resetEmotionForm, upsertCall]);

  const handleEndCall = useCallback(async () => {
    if (!activeCall || activeCall.status !== 'active') {
      return;
    }

    setCallBanner({
      tone: 'loading',
      message: `Ending call ${activeCall.sid}…`,
    });

    try {
      const endedCall = await endCall(activeCall.sid);
      setActiveCall(endedCall);
      upsertCall(endedCall);
      setEmotionBanner(idleBanner());
      setCallBanner({
        tone: 'success',
        message: `Call ${endedCall.sid} ended after ${formatDuration(endedCall.durationSeconds)}.`,
      });
    } catch (error) {
      setCallBanner({
        tone: 'error',
        message: `Unable to end the call. ${errorMessage(error, 'Please try again.')}`,
      });
    }
  }, [activeCall, upsertCall]);

  const handleEmotionSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!activeCall || activeCall.status !== 'active') {
        setEmotionBanner({
          tone: 'error',
          message: 'Start a call before logging emotions.',
        });
        return;
      }

      const nextErrors = validateEmotionForm(emotion, confidence, sentiment);
      if (Object.keys(nextErrors).length > 0) {
        setEmotionErrors(nextErrors);
        setEmotionBanner({
          tone: 'error',
          message: 'Fix the highlighted emotion fields and try again.',
        });
        return;
      }

      const normalizedEmotion = emotion.trim();
      const confidenceValue = Number(confidence);

      setEmotionLoading(true);
      setEmotionBanner({
        tone: 'loading',
        message: `Saving ${normalizedEmotion}…`,
      });

      try {
        const entry = await addEmotion(activeCall.sid, normalizedEmotion, confidenceValue, sentiment);
        const updatedCall = {
          ...activeCall,
          emotions: [...activeCall.emotions, entry],
        };

        setActiveCall(updatedCall);
        upsertCall(updatedCall);

        resetEmotionForm();
        setEmotionBanner({
          tone: 'success',
          message: `Saved ${entry.emotion} for call ${activeCall.sid}.`,
        });
      } catch (error) {
        setEmotionBanner({
          tone: 'error',
          message: `Unable to save emotion. ${errorMessage(error, 'Please try again.')}`,
        });
      } finally {
        setEmotionLoading(false);
      }
    },
    [activeCall, confidence, emotion, resetEmotionForm, sentiment, upsertCall],
  );

  const handleRefreshHistory = useCallback(async () => {
    await refreshHistory();
  }, [refreshHistory]);

  const activeState = activeCall ? activeCall.status : 'idle';

  return (
    <>
      <div className="app-shell">
        <header className="hero card">
          <div>
            <p className="eyebrow">AI-powered calling service</p>
            <h1>AI Thunderbolt Pro</h1>
            <p className="hero-copy">
              Start a call, log emotions during the session, and restore the current session after a refresh.
            </p>
          </div>

          <div className="hero-meta">
            <span className="hero-chip">Backend: {import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}</span>
            <span className="hero-chip">Session-aware UI</span>
          </div>
        </header>

        <Banner banner={sessionBanner} />

        <section className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Call control</p>
              <h2>{activeState === 'idle' ? 'No active call' : activeState === 'active' ? 'Live call' : 'Completed call'}</h2>
            </div>
            <span className={`status-pill status-${activeState}`}>{activeState}</span>
          </div>

          <Banner banner={callBanner} />

          {restoringSession ? (
            <p className="muted-copy">Checking for a saved session…</p>
          ) : activeCall ? (
            <div className="call-summary">
              <div className="call-summary-grid">
                <div>
                  <span className="field-label">Session ID</span>
                  <code className="sid-code">{activeCall.sid}</code>
                </div>
                <div>
                  <span className="field-label">Started</span>
                  <span>{formatDateTime(activeCall.startedAt)}</span>
                </div>
                <div>
                  <span className="field-label">Status</span>
                  <span>{activeCall.status}</span>
                </div>
                <div>
                  <span className="field-label">Duration</span>
                  <span>{formatDuration(activeCall.durationSeconds)}</span>
                </div>
                <div>
                  <span className="field-label">Emotion points</span>
                  <span>{activeCall.emotions.length}</span>
                </div>
                {activeCall.endedAt ? (
                  <div>
                    <span className="field-label">Ended</span>
                    <span>{formatDateTime(activeCall.endedAt)}</span>
                  </div>
                ) : null}
              </div>

              <div className="call-actions">
                {activeCall.status === 'active' ? (
                  <button className="btn-danger" onClick={handleEndCall} disabled={callBanner.tone === 'loading'}>
                    {callBanner.tone === 'loading' ? 'Ending…' : 'End call'}
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handleStartCall} disabled={callBanner.tone === 'loading'}>
                    {callBanner.tone === 'loading' ? 'Starting…' : 'Start a new call'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>There is no active call right now.</p>
              <button className="btn-primary" onClick={handleStartCall} disabled={callBanner.tone === 'loading'}>
                {callBanner.tone === 'loading' ? 'Starting…' : 'Start call'}
              </button>
            </div>
          )}
        </section>

        {activeCall?.status === 'active' ? (
          <section className="card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Emotion logging</p>
                <h2>Capture the current sentiment</h2>
              </div>
              <span className="status-pill status-active">active</span>
            </div>

            <Banner banner={emotionBanner} />

            <form className="emotion-form" onSubmit={handleEmotionSubmit}>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Emotion</span>
                  <input
                    list="emotion-suggestions"
                    type="text"
                    value={emotion}
                    onChange={(event) => {
                      setEmotion(event.target.value);
                      setEmotionErrors((previous) => ({ ...previous, emotion: undefined }));
                    }}
                    placeholder="e.g. calm, curious, frustrated"
                    aria-invalid={Boolean(emotionErrors.emotion)}
                    aria-describedby={emotionErrors.emotion ? 'emotion-error' : undefined}
                  />
                  {emotionErrors.emotion ? (
                    <span id="emotion-error" className="field-error">
                      {emotionErrors.emotion}
                    </span>
                  ) : null}
                </label>

                <label className="field">
                  <span className="field-label">Confidence</span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={confidence}
                    onChange={(event) => {
                      setConfidence(event.target.value);
                      setEmotionErrors((previous) => ({ ...previous, confidence: undefined }));
                    }}
                    aria-invalid={Boolean(emotionErrors.confidence)}
                    aria-describedby={emotionErrors.confidence ? 'confidence-error' : undefined}
                  />
                  {emotionErrors.confidence ? (
                    <span id="confidence-error" className="field-error">
                      {emotionErrors.confidence}
                    </span>
                  ) : (
                    <span className="field-hint">Use a value between 0 and 1.</span>
                  )}
                </label>

                <label className="field">
                  <span className="field-label">Sentiment</span>
                  <select
                    value={sentiment}
                    onChange={(event) => {
                      setSentiment(event.target.value as Sentiment);
                      setEmotionErrors((previous) => ({ ...previous, sentiment: undefined }));
                    }}
                    aria-invalid={Boolean(emotionErrors.sentiment)}
                    aria-describedby={emotionErrors.sentiment ? 'sentiment-error' : undefined}
                  >
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                  {emotionErrors.sentiment ? (
                    <span id="sentiment-error" className="field-error">
                      {emotionErrors.sentiment}
                    </span>
                  ) : null}
                </label>

                <button className="btn-primary emotion-submit" type="submit" disabled={emotionLoading}>
                  {emotionLoading ? 'Saving…' : 'Log emotion'}
                </button>
              </div>
            </form>

            <datalist id="emotion-suggestions">
              {emotionSuggestions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </section>
        ) : null}

        <section className="card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Call history</p>
              <h2>Recent sessions</h2>
            </div>
            <button className="btn-secondary" onClick={handleRefreshHistory} disabled={historyLoading}>
              {historyLoading ? 'Refreshing…' : 'Refresh history'}
            </button>
          </div>

          <Banner banner={historyBanner} />

          {calls.length === 0 ? (
            <div className="empty-state">
              <p>No call records yet. Start a session to populate history.</p>
            </div>
          ) : (
            <div className="history-list">
              {calls.map((call) => (
                <article key={call.sid} className="history-item">
                  <div className="history-item-header">
                    <span className={`status-pill status-${call.status}`}>{call.status}</span>
                    <code className="sid-code">{call.sid}</code>
                  </div>

                  <div className="history-meta">
                    <span>Started: {formatDateTime(call.startedAt)}</span>
                    {call.endedAt ? <span>Ended: {formatDateTime(call.endedAt)}</span> : null}
                    <span>Duration: {formatDuration(call.durationSeconds)}</span>
                    <span>{call.emotions.length} emotion{call.emotions.length === 1 ? '' : 's'}</span>
                  </div>

                  {call.emotions.length > 0 ? (
                    <div className="emotion-chip-row">
                      {call.emotions.map((entry) => (
                        <span key={entry.timestamp} className="emotion-chip">
                          {entry.emotion} · {Math.round(entry.confidence * 100)}% · {entry.sentiment}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <Analytics />
    </>
  );
}
