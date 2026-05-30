# Medulate Sync — Dashboard

Educator dashboard for the Medulate platform. Medulate provides AI-powered
central line training and evaluation proven to reduce clinical complications
and improve patient safety. This web app lets institution administrators
track trainee progress, review cases, and manage access for their cohort.

It talks to the Medulate API (`medulate-api`) over JWT-authenticated REST.

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Local development

Requires Node.js. (Install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) if needed.)

```sh
# 1. Install dependencies
npm install

# 2. Configure the API URL
cp .env.example .env   # edit if pointing at a non-default API

# 3. Start the dev server
npm run dev
```

## Environment

The only required variable is the API base URL:

```
VITE_API_URL="https://medulate-api.onrender.com/api"
```

For local dev, set it in `.env`. In production it is configured in the Vercel
project's Environment Variables (not committed to git).

## Routes

- `/login` — administrator sign-in (admins only).
- `/signup?code=XXXX` — public self-registration for trainees, using an
  institution registration code. This page does not grant dashboard access.
- everything else — the protected admin dashboard.

## Deployment

Deployed on Vercel. `vercel.json` rewrites all routes to `index.html` so the
client-side router handles deep links (e.g. cold loads of `/signup?code=...`).
Set `VITE_API_URL` in the Vercel project settings.
