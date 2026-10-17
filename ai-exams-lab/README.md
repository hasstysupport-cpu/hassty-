# Hassty AI Exams Lab

Independent test app for the Hassty AI exam workflow. Deploy this directory as a separate Vercel project; it does not alter Hassty production routes or databases.

## Required Vercel environment variables
- \`EXAMS_ACCESS_CODE\`: shared tester code. Keep it encrypted/sensitive.
- \`EXAMS_SESSION_SECRET\`: long random secret used to sign 12-hour HttpOnly session cookies.

The public landing page is \`index.html\`. The application HTML is delivered only by \`api/app.js\` after server-side cookie verification. The initial prototype stores drafts in the browser's localStorage and uses labeled demo question templates; it does not yet read official ministry books or call a live AI model.

## Next integration steps
1. Add verified Supabase Auth and server-side approved-user allow-list.
2. Add private storage and a vetted ingestion pipeline for official Ministry books.
3. Connect a server-side AI generation/review pipeline with question citations.
4. Replace browser-only draft storage with an isolated test database and RLS.
5. Add a real test suite for generation, export, permissions and scoring.
