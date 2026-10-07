import fs from 'node:fs';
import path from 'node:path';

const src = fs.readFileSync(path.resolve('api/_lib/evolution.js'), 'utf8');

const checks = [
  ['Baileys integration constant', /EVOLUTION_WHATSAPP_INTEGRATION\s*=\s*['"]WHATSAPP-BAILEYS['"]/.test(src)],
  ['create uses the integration constant', /integration:\s*EVOLUTION_WHATSAPP_INTEGRATION/.test(src)],
  ['number normalization', /replace\(\/\\D\/g, ['"]['"]\)/.test(src)],
  ['send uses text field', /number:\s*String\(number\)[\s\S]*text:\s*String\(text\)/.test(src)],
  ['legacy integration absent', !/integration:\s*['"]WHATSAPP['"]/.test(src)],
];

for (const [name, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${name}`);
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('WhatsApp integration validation failed; deployment blocked.');
  process.exit(1);
}
console.log('WhatsApp integration validation passed.');