# Hassty — Supabase setup

The project now uses Supabase Auth and Supabase PostgreSQL. Firebase dependencies/configuration have been removed.

## Environment
Copy `.env.example` to `.env` (or configure the same variables in Vercel).

Required for the browser:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (publishable key)

## Email verification
Supabase Auth handles signup confirmation. The confirmation redirect is `/verify-email`. The project verifies Supabase `token_hash` callbacks and also supports resend through Supabase Auth.

In Supabase Dashboard, set the Site URL and Redirect URLs to your deployed origin and `/verify-email`.

## Google login
Enable Google under Supabase Auth Providers and add the OAuth client redirect URI shown by Supabase. The app uses Supabase OAuth with a redirect back to `/`.

## Database
`supabase_schema.sql` contains the application schema plus `app_documents`, the Supabase replacement for the old Firestore collections used throughout the UI.

Never expose a Supabase service-role/secret key in the frontend.
