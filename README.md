# ⚡ GitHub Copilot Quickstart - Copy & Paste

Use this quickstart if you're launching AI Thunderbolt Pro from scratch or reusing the setup steps for a fresh project.

## 🚀 Launch in 6 Steps

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

## STEP 2: Clone Your Repository

**Copy this command (run in terminal):**

```bash
git clone https://github.com/ea0281309-dot/-ai-thunderbolt-pro.git ai-thunderbolt-pro
cd ai-thunderbolt-pro
```

If you created the repository under a different GitHub account, replace `ea0281309-dot` with your GitHub username.

If your generated project files are in another directory, copy them into `ai-thunderbolt-pro/` before continuing.

---

## STEP 3: Push Code to GitHub

**Copy these commands (run in terminal):**

Run these commands from inside the cloned `ai-thunderbolt-pro` directory after your project files are in place.

```bash
git add .
git commit -m "Initial commit: AI Thunderbolt Pro v1.0"
git push -u origin main
```

---

## STEP 4: Deploy Frontend (Vercel)

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

## STEP 5: Deploy Backend (Railway)

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

## STEP 6: Connect Everything

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
