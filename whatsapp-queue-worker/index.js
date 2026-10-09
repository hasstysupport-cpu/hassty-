/**
 * Hassty per-teacher WhatsApp attendance queue worker.
 * The durable queue and retry counters live in Supabase; this process is stateless.
 */
const apiBaseUrl = String(process.env.HASSTY_API_BASE_URL || 'https://hassty.site').replace(/\/$/, '');
const secret = String(process.env.WHATSAPP_INTERNAL_SECRET || '');
const pollMs = Math.max(3000, Number(process.env.WHATSAPP_QUEUE_POLL_MS || 5000));
const requestTimeoutMs = Math.max(15000, Number(process.env.WHATSAPP_QUEUE_REQUEST_TIMEOUT_MS || 40000));

if (!secret) {
  console.error('[hassty-wa-queue] Missing WHATSAPP_INTERNAL_SECRET; worker will not start.');
  process.exit(1);
}

let stopping = false;
let activeController = null;

process.on('SIGTERM', () => { stopping = true; activeController?.abort(); });
process.on('SIGINT', () => { stopping = true; activeController?.abort(); });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processOne() {
  activeController = new AbortController();
  const timeout = setTimeout(() => activeController?.abort(), requestTimeoutMs);
  try {
    const response = await fetch(`${apiBaseUrl}/api/whatsapp/queue-worker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whatsapp-internal-secret': secret,
      },
      body: '{}',
      signal: activeController.signal,
    });
    const raw = await response.text();
    let result = null;
    try { result = raw ? JSON.parse(raw) : null; } catch { result = null; }

    if (!response.ok || result?.ok === false) {
      console.error(`[hassty-wa-queue] worker API returned HTTP ${response.status}; next poll will retry.`);
      return;
    }
    if (result?.processed === true) {
      console.log(`[hassty-wa-queue] job ${result.jobId || 'unknown'}: ${result.status || 'processed'}`);
    }
  } catch (error) {
    if (!stopping) console.error(`[hassty-wa-queue] request failed: ${error?.name === 'AbortError' ? 'timeout' : 'network error'}`);
  } finally {
    clearTimeout(timeout);
    activeController = null;
  }
}

console.log(`[hassty-wa-queue] started; poll interval ${pollMs}ms.`);
while (!stopping) {
  const start = Date.now();
  await processOne();
  if (!stopping) await sleep(Math.max(250, pollMs - (Date.now() - start)));
}
console.log('[hassty-wa-queue] stopped.');
