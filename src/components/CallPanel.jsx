import { useState, useEffect, useRef } from 'react'
import './CallPanel.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

function CallPanel({ activeCall, onCallStart, onCallEnd }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callerId, setCallerId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (activeCall) {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
      setDuration(0)
    }
    return () => clearInterval(timerRef.current)
  }, [activeCall])

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleStartCall = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/calls/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, callerId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to start call')
      }
      const data = await res.json()
      onCallStart({ ...data, phoneNumber, startTime: new Date().toISOString() })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndCall = async () => {
    if (!activeCall) return
    setIsLoading(true)
    try {
      await fetch(`${BACKEND_URL}/api/calls/${activeCall.callSid}/end`, {
        method: 'POST',
      })
    } catch {
      // ignore end-call errors
    } finally {
      setIsLoading(false)
      onCallEnd({ duration })
    }
  }

  return (
    <div className="card call-panel">
      <h2>📞 Call Control</h2>

      {!activeCall ? (
        <div className="call-form">
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartCall()}
            />
          </div>
          <div className="form-group">
            <label>Caller ID (optional)</label>
            <input
              type="text"
              placeholder="Your name or number"
              value={callerId}
              onChange={(e) => setCallerId(e.target.value)}
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button
            className="btn-primary"
            onClick={handleStartCall}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : '⚡ Start AI Call'}
          </button>
        </div>
      ) : (
        <div className="active-call">
          <div className="call-status">
            <span className="status-dot" />
            <span>Connected</span>
          </div>
          <div className="call-info">
            <p className="call-number">{activeCall.phoneNumber}</p>
            <p className="call-duration">{formatDuration(duration)}</p>
          </div>
          <button
            className="btn-danger"
            onClick={handleEndCall}
            disabled={isLoading}
          >
            {isLoading ? 'Ending...' : '🔴 End Call'}
          </button>
        </div>
      )}
    </div>
  )
}

export default CallPanel
