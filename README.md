# Dispatch Hub

Dispatch Hub is a Vite + React + Supabase dispatch workspace with DSP-specific modules, legacy phone-list migration support, and Apple-style typography updates across the UI.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key
```

3. Start the app:

```bash
npm run dev
```

## Railway deployment

This repo is configured for Railway with [railway.json](/c:/Users/Main User/Desktop/PROJECTS (V)/Dispatch Hub/railway.json).

Railway should work with:

- Node runtime: `20`
- Install/build flow: Nixpacks reads `nixpacks.toml`, runs `npm install`, then `npm run build`
- Start command: `npm run start`

Set these Railway environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Supabase

Database changes live in [`supabase/migrations`](/c:/Users/Main User/Desktop/PROJECTS (V)/Dispatch Hub/supabase/migrations). Make sure those migrations are applied to the Supabase project used by Railway before you use the new DSP data features.
