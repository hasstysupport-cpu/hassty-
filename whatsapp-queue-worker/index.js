/**
 * Hassty per-teacher WhatsApp attendance queue worker.
 * Supabase owns durable jobs and atomic per-teacher send reservations.
 * One idle poller keeps idle API usage low; when it finds work, it fills a
 * small parallel batch so separate teachers' senders do not block each other.
 */
const apiBaseUrl = String(process.env.HASSTY_API_BASE_URL || 'https://hassty.site').replace(/\/$/, '');
const secret = String(process.env.WHATSAPP_QUEUE_WORKER_SECRET || '');
const pollMs = Math.max(3000, Number(process.env.WHATSAPP_QUEUE_POLL_MS || 5000));
const requestTimeoutMs = Math.max(15000, Number(process.env.WHATSAPP_QUEUE_REQUEST_TIMEOUT_MS || 40000));
const maxConcurrency = Math.min(10, Math.max(1, Number(process.env.WHATSAPP_QUEUE_CONCURRENCY || 5)));

if (!secret) {
  console.error('[hassty-wa-queue] Missing WHATSAPP_QUEUE_WORKER_SECRET; worker will not start.');
  process.exit(1);
}

let stopping = false;
const activeControllers = new Set();

function stop() {
  stopping = true;
  for (const controller of activeControllers) controller.abort();
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processOne() {
  const controller = new AbortController();
  activeControllers.add(controller);
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(`${apiBaseUrl}/api/whatsapp/queue-worker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whatsapp-internal-secret': secret,
      },
      body: '{}',
      signal: controller.signal,
    });
    const raw = await response.text();
    let result = null;
    try { result = raw ? JSON.parse(raw) : null; } catch { result = null; }

    if (!response.ok || result?.ok === false) {
      console.error(`[hassty-wa-queue] worker API returned HTTP ${response.status}; it will retry.`);
      return false;
    }
    if (result?.processed === true) {
      console.log(`[hassty-wa-queue] job ${result.jobId || 'unknown'}: ${result.status || 'processed'}`);
      return true;
    }
    return false;
  } catch (error) {
    if (!stopping) console.error(`[hassty-wa-queue] request failed: ${error?.name === 'AbortError' ? 'timeout' : 'network error'}`);
    return false;
  } finally {
    clearTimeout(timeout);
    activeControllers.delete(controller);
  }
}

console.log(`[hassty-wa-queue] started; idle poll ${pollMs}ms; parallel batch up to ${maxConcurrency}.`);
while (!stopping) {
  const foundWork = await processOne();
  if (!foundWork) {
    if (!stopping) await sleep(pollMs);
    continue;
  }

  // The DB claim RPC locks/reserves a sender's next slot atomically. Therefore
  // extra concurrent claims pick other teachers while the same teacher's next
  // message remains ineligible until its own interval expires.
  if (maxConcurrency > 1 && !stopping) {
    const batch = await Promise.all(
      Array.from({ length: maxConcurrency - 1 }, () => processOne())
    );
    // If any work was found, immediately attempt the next batch. If these were
    // just probes, the next loop will quickly find no work and sleep normally.
  }
}
console.log('[hassty-wa-queue] stopped.');
