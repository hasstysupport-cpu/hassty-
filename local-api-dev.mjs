#!/usr/bin/env node
/* Local harness that mounts the Vercel serverless auth handlers on Express
   (Vercel's req/res are Express-compatible), for real integration testing. */
import express from 'express';

const ROOT = '/home/z/my-project/hassty/merge/repo/api';

const app = express();
// NOTE: no express.json() — the handlers read the raw stream exactly
// like Vercel serverless functions do.

app.post('/api/auth/register', (await import(`${ROOT}/auth/register.js`)).default);
app.post('/api/auth/verify-code', (await import(`${ROOT}/auth/verify-code.js`)).default);
app.post('/api/auth/send-code', (await import(`${ROOT}/auth/send-code.js`)).default);
app.post('/api/auth/login-check', (await import(`${ROOT}/auth/login-check.js`)).default);
app.post('/api/auth/reset-password', (await import(`${ROOT}/auth/reset-password.js`)).default);
app.post('/api/auth/profile-complete', (await import(`${ROOT}/auth/profile-complete.js`)).default);

app.listen(8787, () => console.log('local auth API (express) on :8787'));
