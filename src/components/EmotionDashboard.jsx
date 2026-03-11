import { useEffect, useState } from 'react'
import './EmotionDashboard.css'

const EMOTION_COLORS = {
  happy: '#4ade80',
  excited: '#fbbf24',
  calm: '#60a5fa',
  neutral: '#94a3b8',
  concerned: '#fb923c',
  sad: '#818cf8',
  angry: '#f87171',
}

const EMOTION_ICONS = {
  happy: '😊',
  excited: '🤩',
  calm: '😌',
  neutral: '😐',
  concerned: '😟',
  sad: '😢',
  angry: '😠',
}

function EmotionDashboard({ emotionData, onEmotionUpdate }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!emotionData) return
    setHistory((prev) => {
      const next = [{ ...emotionData, time: Date.now() }, ...prev].slice(0, 10)
      return next
    })
  }, [emotionData])

  const emotion = emotionData?.emotion || 'neutral'
  const sentiment = emotionData?.sentiment || 'neutral'
  const confidence = Math.round((emotionData?.confidence || 0) * 100)
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral
  const icon = EMOTION_ICONS[emotion] || '😐'

  // TODO: Replace with real-time emotion analysis API calls in production.
  // This simulation generates random emotion data for demonstration purposes only.
  useEffect(() => {
    if (!emotionData) return
    const interval = setInterval(() => {
      const emotions = Object.keys(EMOTION_COLORS)
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
      const sentiments = ['positive', 'neutral', 'negative']
      const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
      onEmotionUpdate({
        emotion: randomEmotion,
        sentiment: randomSentiment,
        confidence: Math.random(),
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [emotionData, onEmotionUpdate])

  return (
    <div className="card emotion-dashboard">
      <h2>🧠 Emotional Intelligence</h2>

      {!emotionData ? (
        <div className="no-call-state">
          <p>Start a call to activate emotional analysis</p>
          <div className="idle-animation">
            <span>⚡</span>
          </div>
        </div>
      ) : (
        <>
          <div className="emotion-display" style={{ '--emotion-color': color }}>
            <div className="emotion-icon">{icon}</div>
            <div className="emotion-label">{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</div>
            <div className="sentiment-badge" data-sentiment={sentiment}>
              {sentiment}
            </div>
          </div>

          <div className="confidence-bar">
            <div className="confidence-label">
              <span>Confidence</span>
              <span>{confidence}%</span>
            </div>
            <div className="confidence-track">
              <div
                className="confidence-fill"
                style={{ width: `${confidence}%`, background: color }}
              />
            </div>
          </div>

          <div className="emotion-history">
            <p className="history-label">Recent emotions</p>
            <div className="history-dots">
              {history.map((item, i) => (
                <span
                  key={item.time}
                  className="history-dot"
                  title={item.emotion}
                  style={{
                    background: EMOTION_COLORS[item.emotion] || EMOTION_COLORS.neutral,
                    opacity: 1 - i * 0.08,
                  }}
                >
                  {EMOTION_ICONS[item.emotion] || '😐'}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default EmotionDashboard
