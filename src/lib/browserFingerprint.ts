/**
 * Client-Side Browser Fingerprinting Utility
 * Creates a unique, non-invasive digital fingerprint of the browser device to enforce rate limits
 * and protect against automated bot OTP spamming and file scrapers.
 */

export interface BrowserFingerprint {
  visitorId: string;
  userAgent: string;
  language: string;
  screenResolution: string;
  colorDepth: number;
  timezoneOffset: number;
  timezone: string;
  hardwareConcurrency: number;
  platform: string;
}

/**
 * Generates a consistent 64-bit hash from string
 */
function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/**
 * Computes the client fingerprint
 */
export async function getBrowserFingerprint(): Promise<BrowserFingerprint> {
  if (typeof window === 'undefined') {
    return {
      visitorId: 'server-rendered',
      userAgent: 'unknown',
      language: 'ar-EG',
      screenResolution: '0x0',
      colorDepth: 24,
      timezoneOffset: 0,
      timezone: 'Africa/Cairo',
      hardwareConcurrency: 4,
      platform: 'unknown',
    };
  }

  const nav = window.navigator;
  const screen = window.screen;
  const userAgent = nav.userAgent || '';
  const language = nav.language || 'ar';
  const screenResolution = `${screen.width || 0}x${screen.height || 0}x${screen.availWidth || 0}x${screen.availHeight || 0}`;
  const colorDepth = screen.colorDepth || 24;
  const timezoneOffset = new Date().getTimezoneOffset();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo';
  const hardwareConcurrency = nav.hardwareConcurrency || 2;
  const platform = (nav as any).userAgentData?.platform || nav.platform || 'unknown';

  // Canvas fingerprint component for extra entropy
  let canvasEntropy = '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(10, 5, 60, 20);
      ctx.fillStyle = '#1E3A8A';
      ctx.fillText('HasstySecurity#2026', 15, 15);
      canvasEntropy = canvas.toDataURL().slice(-40);
    }
  } catch {
    canvasEntropy = 'canvas-blocked';
  }

  const rawEntropy = [
    userAgent,
    language,
    screenResolution,
    colorDepth,
    timezoneOffset,
    timezone,
    hardwareConcurrency,
    platform,
    canvasEntropy,
  ].join('###');

  const visitorId = cyrb53(rawEntropy);

  return {
    visitorId,
    userAgent,
    language,
    screenResolution,
    colorDepth,
    timezoneOffset,
    timezone,
    hardwareConcurrency,
    platform,
  };
}
