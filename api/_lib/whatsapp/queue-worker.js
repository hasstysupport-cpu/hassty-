/**
 * Internal worker endpoint for durable per-teacher WhatsApp attendance delivery.
 * Called only by the Railway queue worker using WHATSAPP_QUEUE_WORKER_SECRET.
 */
import { SUPABASE_URL, SERVICE_KEY, SITE_URL, jsonOk, jsonErr } from '../config.js';

const QUEUE_WORKER_SECRET = String(process.env.WHATSAPP_QUEUE_WORKER_SECRET || '');

function isAuthorized(req) {
  const supplied = String(req.headers['x-whatsapp-internal-secret'] || '');
  return Boolean(QUEUE_WORKER_SECRET && supplied && supplied === QUEUE_WORKER_SECRET);
}

async function rpc(name, body) {
  if (!SERVICE_KEY) throw new Error('Supabase service key is not configured.');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body || {}),
    signal: AbortSignal.timeout(15000),
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { message: raw.slice(0, 300) }; }
  if (!response.ok) {
    const message = data?.message || data?.error || `Supabase RPC ${name} failed (HTTP ${response.status})`;
    throw new Error(message);
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonErr(res, 'Method not allowed.', 405);
  if (!isAuthorized(req)) return jsonErr(res, 'Unauthorized.', 401);
  if (!SERVICE_KEY || !QUEUE_WORKER_SECRET) return jsonErr(res, 'Queue worker is not configured.', 503);

  try {
    const claimed = await rpc('claim_parent_whatsapp_job', {});
    const job = Array.isArray(claimed) ? claimed[0] : claimed;
    if (!job || !job.id) return jsonOk(res, { processed: false });

    let sent = false;
    let failure = '';
    let providerMessageId = null;

    try {
      if (!job.payload || typeof job.payload !== 'object') throw new Error('Queued notification payload is invalid.');

      const response = await fetch(`${SITE_URL.replace(/\/$/, '')}/api/whatsapp/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-whatsapp-internal-secret': QUEUE_WORKER_SECRET,
        },
        body: JSON.stringify(job.payload),
        signal: AbortSignal.timeout(25000),
      });
      const raw = await response.text();
      let result = null;
      try { result = raw ? JSON.parse(raw) : null; } catch { result = null; }

      sent = response.ok && result?.whatsapp?.ok === true;
      if (!sent) {
        failure = String(
          result?.whatsapp?.error ||
          result?.error ||
          `WhatsApp delivery failed (HTTP ${response.status})`
        ).slice(0, 1000);
      } else {
        const sentData = result?.sent || result?.data || {};
        providerMessageId = sentData?.idMessage || sentData?.messageId || sentData?.key?.id || sentData?.id || null;
      }
    } catch (err) {
      failure = String(err?.message || 'Unknown WhatsApp delivery error').slice(0, 1000);
    }

    const completed = await rpc('complete_parent_whatsapp_job', {
      p_job_id: job.id,
      p_success: sent,
      p_error: sent ? null : (failure || 'WhatsApp delivery failed.'),
      p_provider_message_id: sent ? providerMessageId : null,
    });

    const outcome = typeof completed === 'string' ? completed : completed?.status;
    return jsonOk(res, {
      processed: true,
      jobId: job.id,
      status: sent ? 'sent' : (outcome || 'retry_scheduled'),
    });
  } catch (err) {
    console.error('[whatsapp/queue-worker]', err?.message || 'Worker request failed.');
    return jsonErr(res, 'Queue processing failed; the job will be recovered safely.', 500);
  }
}
