/**
 * Patch web-push 3.6.7 to avoid Node 24 DEP0169 from legacy url.parse().
 * Kept intentionally small and idempotent: fail the build if upstream
 * changes unexpectedly so the warning is not silently reintroduced.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const entry = require.resolve('web-push');
const libraryPath = path.join(path.dirname(entry), 'web-push-lib.js');

if (!fs.existsSync(libraryPath)) {
  throw new Error('Cannot locate web-push/src/web-push-lib.js for URL modernization patch.');
}

let source = fs.readFileSync(libraryPath, 'utf8');
const replacements = [
  ['url.parse(subscription.endpoint)', 'new URL(subscription.endpoint)'],
  ['url.parse(requestDetails.endpoint)', 'new URL(requestDetails.endpoint)'],
  ['httpsOptions.port = urlParts.port;', 'httpsOptions.port = urlParts.port || undefined;'],
  ['httpsOptions.path = urlParts.path;', 'httpsOptions.path = urlParts.pathname + urlParts.search;'],
];

let changed = 0;
for (const [legacy, modern] of replacements) {
  if (source.includes(modern)) continue;
  if (!source.includes(legacy)) {
    throw new Error('Unexpected web-push source; cannot safely replace: ' + legacy);
  }
  source = source.replace(legacy, modern);
  changed++;
}

if (source.includes('url.parse(')) {
  throw new Error('Legacy url.parse() calls remain in web-push source after patch.');
}
if (changed > 0) {
  fs.writeFileSync(libraryPath, source, 'utf8');
  console.log('Patched web-push URL parsing to use the WHATWG URL API.');
} else {
  console.log('web-push URL parsing is already modernized; no patch needed.');
}
