import { useState, useCallback } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import {
  startCall,
  endCall,
  addEmotion,
  listCalls,
  type CallRecord,
} from './api'

type Sentiment = 'positive' | 'negative' | 'neutral'

export default function App() {
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null)
  const [calls, setCalls] = useState<CallRecord[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Emotion form state
  const [emotion, setEmotion] = useState('')
  const [confidence, setConfidence] = useState(0.8)
  const [sentiment, setSentiment] = useState<Sentiment>('positive')
  const [emotionLoading, setEmotionLoading] = useState(false)
  const [emotionSuccess, setEmotionSuccess] = useState(false)

  const setErrorMessage = (err: unknown) =>
    setError(err instanceof Error ? err.message : String(err))

  const handleStartCall = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const call = await startCall()
      setActiveCall(call)
    } catch (err) {
      setErrorMessage(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleEndCall = useCallback(async () => {
    if (!activeCall) return
    setError(null)
    setLoading(true)
    try {
      const updated = await endCall(activeCall.sid)
      setActiveCall(null)
      // Update in the calls list if it's loaded
      setCalls(prev =>
        prev ? prev.map(c => (c.sid === updated.sid ? updated : c)) : prev,
      )
    } catch (err) {
      setErrorMessage(err)
    } finally {
      setLoading(false)
    }
  }, [activeCall])

  const handleAddEmotion = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!activeCall || !emotion.trim()) return
      setError(null)
      setEmotionLoading(true)
      setEmotionSuccess(false)
      try {
        await addEmotion(activeCall.sid, emotion.trim(), confidence, sentiment)
        setEmotion('')
        setConfidence(0.8)
        setSentiment('positive')
        setEmotionSuccess(true)
        setTimeout(() => setEmotionSuccess(false), 2000)
      } catch (err) {
        setErrorMessage(err)
      } finally {
        setEmotionLoading(false)
      }
    },
    [activeCall, emotion, confidence, sentiment],
  )

  const handleLoadCalls = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await listCalls()
      setCalls(data)
    } catch (err) {
      setErrorMessage(err)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <>
      {/* Header */}
      <div className="header">
        <span className="header-icon">⚡</span>
        <div>
          <h1>AI Thunderbolt Pro</h1>
          <div className="header-sub">AI-powered calling with emotional intelligence</div>
        </div>
      </div>

      {error && <div className="alert-error">⚠ {error}</div>}

      {/* Call Control */}
      <div className="card">
        <h2>Call Control</h2>

        {!activeCall ? (
          <button
            className="btn-primary"
            onClick={handleStartCall}
            disabled={loading}
          >
            {loading ? 'Starting…' : '📞 Start Call'}
          </button>
        ) : (
          <div className="active-call">
            <div className="active-call-info">
              <div className="pulse" />
              <span className="badge badge-active">Live</span>
              <span className="sid-label">{activeCall.sid}</span>
            </div>
            <button
              className="btn-danger"
              onClick={handleEndCall}
              disabled={loading}
            >
              {loading ? 'Ending…' : '🔴 End Call'}
            </button>
          </div>
        )}
      </div>

      {/* Emotion Tracking */}
      {activeCall && (
        <div className="card">
          <h2>Log Emotion</h2>
          <form onSubmit={handleAddEmotion}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="emotion">Emotion</label>
                <input
                  id="emotion"
                  type="text"
                  placeholder="e.g. joy, anger, calm"
                  value={emotion}
                  onChange={e => setEmotion(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: '0 1 120px' }}>
                <label htmlFor="confidence">Confidence</label>
                <input
                  id="confidence"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={confidence}
                  onChange={e => setConfidence(parseFloat(e.target.value))}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: '0 1 140px' }}>
                <label htmlFor="sentiment">Sentiment</label>
                <select
                  id="sentiment"
                  value={sentiment}
                  onChange={e => setSentiment(e.target.value as Sentiment)}
                >
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={emotionLoading || !emotion.trim()}
                style={{ flexShrink: 0 }}
              >
                {emotionLoading ? 'Saving…' : emotionSuccess ? '✓ Saved!' : 'Log'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calls List */}
      <div className="card">
        <div className="section-actions">
          <button
            className="btn-secondary"
            onClick={handleLoadCalls}
            disabled={loading}
          >
            {loading ? 'Loading…' : '🔄 Load Calls'}
          </button>
        </div>
        <h2>Call History</h2>

        {calls === null ? (
          <div className="empty-state">Click "Load Calls" to fetch records.</div>
        ) : calls.length === 0 ? (
          <div className="empty-state">No call records found.</div>
        ) : (
          <div className="calls-list">
            {calls.map(call => (
              <div key={call.sid} className="call-item">
                <div className="call-item-header">
                  <span
                    className={`badge ${call.status === 'active' ? 'badge-active' : 'badge-ended'}`}
                  >
                    {call.status}
                  </span>
                  <span className="sid-label">{call.sid}</span>
                </div>
                <div className="call-item-meta">
                  <span>Started: {new Date(call.startedAt).toLocaleString()}</span>
                  {call.endedAt && (
                    <span>Ended: {new Date(call.endedAt).toLocaleString()}</span>
                  )}
                  {call.durationSeconds != null && (
                    <span>Duration: {call.durationSeconds}s</span>
                  )}
                  <span>{call.emotions.length} emotion{call.emotions.length !== 1 ? 's' : ''}</span>
                </div>
                {call.emotions.length > 0 && (
                  <div className="emotions-summary">
                    {call.emotions.map((e, i) => (
                      <span key={i} className="emotion-chip">
                        {e.emotion} · {Math.round(e.confidence * 100)}% · {e.sentiment}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <SpeedInsights />
    </>
  )
}
