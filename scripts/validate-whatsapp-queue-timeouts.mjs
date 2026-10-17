import fs from 'node:fs';

const api = fs.readFileSync('api/_lib/whatsapp/queue-worker.js', 'utf8');
const worker = fs.readFileSync('whatsapp-queue-worker/index.js', 'utf8');

function capture(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) throw new Error(`Could not determine ${label}; refusing to skip the timeout guard.`);
  return Number(match[1]);
}

const rpcDefaultMs = capture(api, /async function rpc\(name, body, timeoutMs = (\d+)\)/, 'default RPC timeout');
const claimMs = capture(api, /rpc\('claim_parent_whatsapp_job', \{\}, (\d+)\)/, 'claim timeout');
const notifyMs = capture(api, /\/api\/whatsapp\/notify[\s\S]*?signal: AbortSignal\.timeout\((\d+)\)/, 'notify timeout');
const workerDefaultMs = capture(worker, /WHATSAPP_QUEUE_REQUEST_TIMEOUT_MS \|\| (\d+)/, 'Railway request timeout default');
const workerMaxMs = capture(worker, /Math\.min\((\d+), Math\.max/, 'Railway request timeout cap');
const handlerBudgetMs = claimMs + notifyMs + rpcDefaultMs;

const checks = [
  ['queue handler budget leaves at least 10 seconds before Vercel’s 60-second limit', handlerBudgetMs <= 50000],
  ['Railway request timeout cap stays below 55 seconds', workerMaxMs <= 55000],
  ['Railway request timeout leaves at least 5 seconds beyond the bounded handler budget', workerMaxMs >= handlerBudgetMs + 5000],
  ['Railway default request timeout does not exceed its cap', workerDefaultMs <= workerMaxMs],
];

for (const [name, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${name}`);
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('WhatsApp queue timeout validation failed; build blocked.');
  process.exit(1);
}
console.log(`WhatsApp queue timeout validation passed (handler budget: ${handlerBudgetMs}ms; Railway cap: ${workerMaxMs}ms).`);
