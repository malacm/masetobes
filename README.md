# masetobes

Personal portfolio for Mason Tobia. SvelteKit + TypeScript front-end, Sanity CMS embedded at `/studio`, Resend-powered contact form.

## Setup

1. Use the right Node version: `nvm use` (or `nvm install` if you don't have it).
2. Install deps: `npm install`
3. Copy env template: `cp .env.example .env` and fill in:
   - `PUBLIC_SANITY_PROJECT_ID` — from sanity.io/manage
   - `PUBLIC_SANITY_DATASET` — usually `production`
   - `RESEND_API_KEY` — from resend.com/api-keys
   - `RESEND_FROM_EMAIL` — a verified sender on Resend (the `onboarding@resend.dev` sandbox works for testing)
   - `CONTACT_TO_EMAIL` — Mason's email address (where contact-form messages get delivered)
4. Optional: add the dev server origin to Sanity CORS in sanity.io/manage → API → CORS origins (e.g. `http://localhost:5173`). Content is fetched server-side so this is not required for pages to load; it only enables the theme-icon morph, which fetches the icon SVGs from Sanity’s CDN in the browser and falls back to a cross-fade without it.
5. Run dev: `npm run dev`. The site lives at `/`, the CMS at `/studio`.

## Routes

- `/` — homepage (no scroll, central icon, music player)
- `/work` — gallery of projects
- `/work/[slug]` — individual project page
- `/personal` — personal gallery
- `/studio` — embedded Sanity Studio

## Theme

Two color themes (default / alt). Toggled by clicking the central icon on the homepage or the small icon in the footer. Persists in `localStorage`.

## Design source

Original Figma exports live in `Portfolio — Web/` (gitignored due to file size).
