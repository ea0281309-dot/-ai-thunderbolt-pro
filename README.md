# AI Thunderbolt Pro Launch Guide

AI-powered calling service with emotional intelligence, multilingual support, and CRM integrations.

## ✅ Project Status: Ready to Launch

Use this guide with GitHub Copilot to set up the repository, upload your project files, configure deployment, and connect your frontend and backend environments.

---

## Step 1: Create the GitHub Repository

**Copilot prompt**

```text
Create a new GitHub repository named "ai-thunderbolt-pro" with:
- Description: "AI-powered calling service with emotional intelligence, multilingual support, and CRM integrations"
- Public visibility
- Add README.md
- Add .gitignore for Node.js
- Add MIT License
```

---

## Step 2: Upload Project Files

**Copilot prompt**

```text
I have these files in my local project folder that need to be uploaded to GitHub:
- src/ (React frontend code)
- server/ (Node.js backend)
- package.json
- server/package.json
- tsconfig.json
- vite.config.ts
- tailwind.config.js
- README.md
- INSTALLATION_GUIDE.md
- QUICKSTART.md

Generate the git commands to:
1. Initialize git repository
2. Add all files
3. Commit with message "Initial commit: AI Thunderbolt Pro v1.0"
4. Push to origin main
```

**Expected commands**

```bash
# Navigate to your project folder
cd /path/to/ai-thunderbolt-pro

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: AI Thunderbolt Pro v1.0"

# Rename the default branch to main
git branch -M main

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/ai-thunderbolt-pro.git

# Push to GitHub
git push -u origin main
```

---

## Step 3: Set Up GitHub Actions for Auto-Deploy

**Copilot prompt**

```text
Create a GitHub Actions workflow file at .github/workflows/deploy.yml that:
1. Triggers on push to main branch
2. Sets up Node.js 18
3. Installs dependencies for both frontend and backend
4. Builds the application
5. Deploys to Vercel (frontend) and Railway (backend)

Include environment variables for:
- OPENAI_API_KEY
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- GHL_API_KEY
- HUBSPOT_API_KEY
```

**Expected workflow**

```yaml
name: Deploy AI Thunderbolt Pro

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install Frontend Dependencies
        run: npm ci

      - name: Install Backend Dependencies
        run: cd server && npm ci && cd ..

      - name: Build Frontend
        run: npm run build

      - name: Build Backend
        run: cd server && npm run build && cd ..

      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy Backend to Railway
        uses: railway/cli@latest
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Step 4: Create Environment Secrets

**Copilot prompt**

```text
Guide me through setting up GitHub Secrets for my AI Thunderbolt Pro repository.
I need to add these secrets:
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID
- RAILWAY_TOKEN
- OPENAI_API_KEY
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN

Provide step-by-step instructions for each.
```

Use the repository settings page in GitHub:

1. Open your repository.
2. Go to **Settings**.
3. Select **Secrets and variables** → **Actions**.
4. Choose **New repository secret**.
5. Add each secret name and value one at a time.

---

## Step 5: Deploy the Frontend to Vercel

**Copilot prompt**

```text
I want to deploy my React frontend to Vercel.
My project structure:
- /src (React code)
- /dist (build output)
- vite.config.ts (Vite config)
- package.json

Generate the complete deployment steps including:
1. Vercel CLI installation
2. Project linking
3. Build configuration
4. Environment variables
5. Deployment command
```

**Expected commands**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (run in project root)
vercel

# Deploy
vercel --prod
```

---

## Step 6: Deploy the Backend to Railway

**Copilot prompt**

```text
I need to deploy my Node.js backend to Railway.
My backend is in the /server folder with:
- server/src/index.ts (entry point)
- server/dist/ (compiled output)
- server/package.json

Generate:
1. Railway CLI commands
2. Required configuration files
3. Environment variable setup
4. Deployment steps
```

**Expected commands**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project (in server folder)
cd server
railway init

# Set environment variables
railway variables set PORT=3001
railway variables set NODE_ENV=production
railway variables set OPENAI_API_KEY=your_key

# Deploy
railway up

# Get domain
railway domain
```

---

## Step 7: Connect the Frontend to the Backend

**Copilot prompt**

```text
My frontend is deployed at: https://ai-thunderbolt-pro.vercel.app
My backend is deployed at: https://ai-thunderbolt-pro.up.railway.app

I need to update my frontend to use the production backend API.
The API calls are currently at localhost:3001.

Show me:
1. How to create environment variables in Vercel
2. How to update the API base URL
3. How to handle CORS in production
```

Recommended production approach:

- Store the frontend API URL in a Vercel environment variable such as `VITE_API_BASE_URL`.
- Update the frontend to use `import.meta.env.VITE_API_BASE_URL` instead of a hard-coded `localhost` URL.
- Configure backend CORS to allow requests from the deployed Vercel domain.

---

## Copilot Prompt Templates

### Add a New Feature

```text
Add a [FEATURE_NAME] feature to my AI Thunderbolt Pro that:
- [Description of what it should do]
- Should be accessible from the [LOCATION] tab
- Should integrate with existing [COMPONENT]

Generate the complete code including:
1. Frontend component
2. Backend API endpoint
3. Database schema (if needed)
4. Integration with existing code
```

### Fix a Bug

```text
I'm getting this error: [ERROR_MESSAGE]
In file: [FILE_PATH]
Around line: [LINE_NUMBER]

The code is:
`[CODE_SNIPPET]`

Fix this bug and explain what caused it.
```

### Optimize Performance

```text
Optimize this component for better performance:
`[CODE_SNIPPET]`

Current issues:
- [Describe performance problem]

Suggest improvements for:
1. Rendering optimization
2. State management
3. API calls
4. Memory usage
```

---

## Project Structure References for Copilot

When asking Copilot for help, reference files with explicit paths:

```text
In my project at /src/App.tsx, I need to...

In the backend at /server/src/routes/agents.ts, add...

Update the component in /src/components/AgentCard.tsx to...
```

---

## Copilot Rules for This Project

### Frontend (React + TypeScript)

- Use functional components.
- Prefer clear TypeScript types for props, state, and API payloads.
- Keep configuration in environment variables instead of hard-coded URLs or secrets.

### Backend (Node.js)

- Keep secrets in environment variables.
- Validate external API configuration before use.
- Separate route handling, service logic, and deployment configuration where possible.
