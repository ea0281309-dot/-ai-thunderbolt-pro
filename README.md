# AI Thunderbolt Pro

AI-powered calling service with emotional intelligence.

## Launch in 5 Steps

Use this guide to create the repo, push the code, deploy the frontend and backend, and wire the final production URLs together.

### 1. Create the GitHub repository

Create a new empty GitHub repository, then copy the HTTPS URL.

**Placeholder format used below**

- `YOUR_GITHUB_USERNAME`
- `YOUR_REPOSITORY_NAME`
- `YOUR_VERCEL_URL`
- `YOUR_RAILWAY_URL`

### 2. Push this project to GitHub

```bash
cd /mnt/okcomputer/output/app

git init
git add .
git commit -m "Initial commit: AI Thunderbolt Pro v1.0"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

### 3. Deploy the frontend on Vercel

1. Import the GitHub repository into Vercel.
2. Accept the default Node build settings if prompted.
3. Deploy and copy the production URL.

```text
https://YOUR_VERCEL_URL
```

### 4. Deploy the backend on Railway

1. Create a new Railway project from the same GitHub repository.
2. Configure the required environment variables for the backend.
3. Deploy and copy the public service URL.

```text
https://YOUR_RAILWAY_URL
```

### 5. Wire production URLs together

Update the frontend environment variables to point at Railway, and update the backend configuration to allow requests from Vercel.

```text
Frontend API base URL: https://YOUR_RAILWAY_URL
Backend allowed origin: https://YOUR_VERCEL_URL
```

## Copilot prompt templates

Use these copy/paste prompts to keep follow-up work consistent:

```text
Build the next production-ready feature for AI Thunderbolt Pro.
```

```text
Review this repository and suggest the smallest safe improvements for launch readiness.
```
