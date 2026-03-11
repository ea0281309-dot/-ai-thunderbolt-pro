# ⚡ AI Thunderbolt Pro

AI-powered calling service with emotional intelligence, multilingual support, voice cloning, and CRM integrations.

---

## 🎙 Voice Cloning & Pitch Scanning

### Overview

AI Thunderbolt Pro includes an advanced voice cloning system powered by the [ElevenLabs API](https://elevenlabs.io). The system features enhanced **pitch scanning** that captures voice nuances – pitch contour, intonation, and emotional tonality – and uses them to improve cloning accuracy.

### How It Works

1. **Pitch Scanner** (`server/src/voice/pitchScanner.ts`)
   - Runs a Normalized Autocorrelation Function (NACF) analysis on uploaded PCM audio.
   - Produces per-frame fundamental frequency estimates, confidence scores, voiced/unvoiced classification, pitch statistics, inferred emotional tonality (`calm`, `happy`, `excited`, `sad`, `anxious`, `neutral`), and modulation patterns (rising, falling, sustained, tremolo).
   - The `accuracyLevel` parameter (0–1) controls analysis density: higher values use a denser frame grid and stricter voiced/unvoiced thresholds for more precise scanning.

2. **Voice Cloning** (`server/src/voice/voiceClone.ts`)
   - Submits audio samples to the ElevenLabs Instant Voice Cloning endpoint.
   - Embeds the pitch profile from the scanner into the stored voice record.
   - Maps the user-defined `accuracyLevel` to ElevenLabs `stability` and `similarity_boost` parameters for optimal synthesis quality.
   - Applies post-processing smoothing to reduce artefacts in synthesized audio.

3. **REST API** (`server/src/routes/voices.ts`)
   - `GET /api/voices` – list all cloned voices.
   - `POST /api/voices/clone` – clone a voice; optionally supply `pcmSamples` + `sampleRate` for pitch pre-scanning.
   - `POST /api/voices/:id/preview` – synthesize a text preview with configurable `accuracyLevel` and `smoothingFactor`.
   - `DELETE /api/voices/:id` – remove a cloned voice from ElevenLabs and the local store.

### Environment Variables

| Variable | Description |
|---|---|
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key |
| `PORT` | Backend server port (default: 3001) |

### Frontend Components

| Component | File | Purpose |
|---|---|---|
| `VoicePreview` | `src/components/VoicePreview.tsx` | Plays a voice preview; includes **Calibrate Accuracy** and **Post-processing Smoothing** sliders |
| `VoiceManager` | `src/components/VoiceManager.tsx` | Full voice library dashboard: upload, clone, preview, delete |

#### Calibrate Accuracy Slider

The `VoicePreview` component exposes a **Calibrate Accuracy** slider (0–100%) that maps directly to the `accuracyLevel` parameter sent to the backend:

- **Low (0–30%)** – faster synthesis, slightly less faithful to the original voice.
- **Medium (50–70%)** – balanced quality and speed.
- **High (80–100%)** – maximum similarity boost and stylistic fidelity; uses the ElevenLabs `eleven_multilingual_v2` model (default: 80%).

#### Post-processing Smoothing Slider

A second slider controls `smoothingFactor` (0–100%), which raises `stability` and reduces `style` exaggeration in the synthesized audio – useful for smoothing artefacts in highly expressive voices.

### Running Tests

```bash
cd server
npm test
```

55 tests cover pitch detection, scanning pipeline, emotional tonality inference, modulation detection, ElevenLabs parameter mapping, smoothing, and TTS payload construction.

---

## 🚀 GitHub Copilot Quickstart - Copy & Paste

Use this quickstart if you're launching AI Thunderbolt Pro from scratch or reusing the setup steps for a fresh project.

## 🚀 Launch in 5 Steps

---

## STEP 1: Create GitHub Repo

**Copy this into Copilot Chat:**

```text
Create a GitHub repository for my AI Thunderbolt Pro project with:
- Name: ai-thunderbolt-pro
- Description: AI-powered calling service with emotional intelligence
- Public repo
- Add README, .gitignore (Node), MIT license
```

---

## STEP 2: Push Code to GitHub

**Copy these commands (run in terminal):**

Replace the ALL_CAPS placeholders with your actual GitHub username before running these commands.

```bash
cd /mnt/okcomputer/output/app

git init
git add .
git commit -m "Initial commit: AI Thunderbolt Pro v1.0"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ai-thunderbolt-pro.git
git push -u origin main
```

---

## STEP 3: Deploy Frontend (Vercel)

**Copy this into Copilot Chat:**

```text
Deploy my React frontend to Vercel:
- Build command: npm run build
- Output directory: dist
- Install command: npm install
- Framework: Vite

Generate the complete vercel.json and deployment steps.
```

**Then run:**

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## STEP 4: Deploy Backend (Railway)

**Copy this into Copilot Chat:**

```text
Deploy my Node.js backend to Railway:
- Entry point: server/dist/index.js
- Port: 3001
- Build command: cd server && npm run build
- Start command: node dist/index.js

Generate the railway.json configuration.
```

**Then run:**

```bash
npm i -g @railway/cli
railway login
cd server
railway init
railway up
```

---

## STEP 5: Connect Everything

Replace the ALL_CAPS placeholders `YOUR_VERCEL_URL` and `YOUR_RAILWAY_URL` with your deployed app URLs, for example `https://your-app.vercel.app` and `https://your-service.up.railway.app`.

**Copy this into Copilot Chat:**

```text
My frontend is at: YOUR_VERCEL_URL
My backend is at: YOUR_RAILWAY_URL

Update my frontend API calls from localhost:3001 to the production backend.
Show me which files to update and what changes to make.
```

---

## ✅ DONE!

Your AI Thunderbolt Pro is now live on:
- **Frontend**: YOUR_VERCEL_URL
- **Backend**: YOUR_RAILWAY_URL

---

## 🎯 Common Copilot Prompts

### Add Feature

```text
Add FEATURE to my AI Thunderbolt Pro that does DESCRIPTION.
Generate complete code for frontend, backend, and integration.
```

### Fix Bug

```text
Fix this error: ERROR_MESSAGE
File: FILE_PATH
Code:
PASTE_CODE_HERE
```

### Optimize

```text
Optimize this code for better performance:
PASTE_CODE_HERE
```

### Deploy

```text
Deploy my FRONTEND_OR_BACKEND to PLATFORM with these settings: SETTINGS
```

---

**Just copy, paste, and launch! 🚀**
