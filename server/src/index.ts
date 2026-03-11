import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}))
app.use(express.json())

// In-memory call store (replace with a database in production)
interface CallRecord {
  callSid: string
  phoneNumber: string
  callerId: string
  status: 'active' | 'completed' | 'failed'
  startTime: string
  endTime?: string
  emotionAnalysis?: EmotionData
}

interface EmotionData {
  emotion: string
  sentiment: string
  confidence: number
  timestamp: string
}

const activeCalls = new Map<string, CallRecord>()

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AI Thunderbolt Pro', version: '1.0.0' })
})

// Start a call
app.post('/api/calls/start', (req, res) => {
  const { phoneNumber, callerId } = req.body

  if (!phoneNumber) {
    return res.status(400).json({ error: 'phoneNumber is required' })
  }

  const callSid = uuidv4()
  const call: CallRecord = {
    callSid,
    phoneNumber,
    callerId: callerId || 'AI Thunderbolt Pro',
    status: 'active',
    startTime: new Date().toISOString(),
  }

  activeCalls.set(callSid, call)

  // In production, integrate with Twilio, Vonage, or similar telephony API here
  console.log(`[CALL START] ${callSid} -> ${phoneNumber}`)

  res.json({
    callSid,
    status: 'active',
    message: `Call initiated to ${phoneNumber}`,
  })
})

// End a call
app.post('/api/calls/:callSid/end', (req, res) => {
  const { callSid } = req.params
  const call = activeCalls.get(callSid)

  if (!call) {
    return res.status(404).json({ error: 'Call not found' })
  }

  call.status = 'completed'
  call.endTime = new Date().toISOString()
  activeCalls.set(callSid, call)

  console.log(`[CALL END] ${callSid}`)

  res.json({
    callSid,
    status: 'completed',
    duration: Math.round(
      (new Date(call.endTime).getTime() - new Date(call.startTime).getTime()) / 1000
    ),
  })
})

// Get call status
app.get('/api/calls/:callSid', (req, res) => {
  const { callSid } = req.params
  const call = activeCalls.get(callSid)

  if (!call) {
    return res.status(404).json({ error: 'Call not found' })
  }

  res.json(call)
})

// Emotion analysis endpoint
app.post('/api/calls/:callSid/emotion', (req, res) => {
  const { callSid } = req.params
  const call = activeCalls.get(callSid)

  if (!call) {
    return res.status(404).json({ error: 'Call not found' })
  }

  // TODO: Replace with real emotion/sentiment AI API (e.g., Azure Cognitive Services, AWS Comprehend)
  // In production, integrate with an emotion/sentiment AI API (e.g., Azure Cognitive Services, AWS Comprehend)
  const emotions = ['happy', 'calm', 'excited', 'neutral', 'concerned']
  const sentiments = ['positive', 'neutral', 'negative']
  const mockEmotion: EmotionData = {
    emotion: emotions[Math.floor(Math.random() * emotions.length)],
    sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
    confidence: Math.random(),
    timestamp: new Date().toISOString(),
  }

  call.emotionAnalysis = mockEmotion
  activeCalls.set(callSid, call)

  res.json(mockEmotion)
})

// List all calls
app.get('/api/calls', (_req, res) => {
  res.json(Array.from(activeCalls.values()))
})

// Start server
app.listen(PORT, () => {
  console.log(`⚡ AI Thunderbolt Pro server running on port ${PORT}`)
})

export default app
