import { useState } from 'react'
import CallPanel from './components/CallPanel.jsx'
import EmotionDashboard from './components/EmotionDashboard.jsx'
import CallHistory from './components/CallHistory.jsx'
import './App.css'

function App() {
  const [activeCall, setActiveCall] = useState(null)
  const [emotionData, setEmotionData] = useState(null)
  const [callHistory, setCallHistory] = useState([])

  const handleCallStart = (callInfo) => {
    setActiveCall(callInfo)
    setEmotionData({ sentiment: 'neutral', confidence: 0, emotion: 'calm' })
  }

  const handleCallEnd = (callInfo) => {
    if (activeCall) {
      setCallHistory((prev) => [
        {
          ...activeCall,
          ...callInfo,
          endTime: new Date().toISOString(),
        },
        ...prev,
      ])
    }
    setActiveCall(null)
    setEmotionData(null)
  }

  const handleEmotionUpdate = (data) => {
    setEmotionData(data)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <h1>AI Thunderbolt Pro</h1>
        </div>
        <p className="tagline">AI-powered calling with emotional intelligence</p>
      </header>

      <main className="app-main">
        <div className="panel-grid">
          <CallPanel
            activeCall={activeCall}
            onCallStart={handleCallStart}
            onCallEnd={handleCallEnd}
          />
          <EmotionDashboard
            emotionData={emotionData}
            onEmotionUpdate={handleEmotionUpdate}
          />
        </div>
        <CallHistory history={callHistory} />
      </main>

      <footer className="app-footer">
        <p>AI Thunderbolt Pro &copy; {new Date().getFullYear()} — Powered by Emotional Intelligence</p>
      </footer>
    </div>
  )
}

export default App
