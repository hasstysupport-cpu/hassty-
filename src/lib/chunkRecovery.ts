/**
 * chunkRecovery — الاسترداد الذاتي عند فشل تحميل حزم JS (dynamic imports).
 *
 * المشكلة التي يعالجها هذا الملف:
 * 1) «Failed to fetch dynamically imported module» تحدث لسببين:
 *    أ) فشل شبكة عابر (ضعف/انقطاع لحظة فتح الصفحة) — الملف موجود على الخادم.
 *    ب) متصفح يفتح نسخة قديمة من الموقع ويطلب حزمة حُذفت بعد deploy جديد (404).
 * 2) أخطاء React.lazy لا تصِل أبدًا إلى window.onerror / unhandledrejection —
 *    React يبتلع رفض الوعد ويسلّمه للـ ErrorBoundary. لذلك أي معالج على مستوى
 *    window وحده لا يعمل مع صفحات lazy-loaded (وهو ما كان يحدث سابقًا).
 *
 * الحل:
 * - «بصمة إصدار» (buildId) تُدمج في الحزمة وفي ملف /version.json عند كل build.
 * - عند فشل استيراد نسأل الخادم: هل نحن offline؟ هل هناك إصدار أحدث؟
 *   - offline → لا نُعيد التحميل (كي لا نفقد الصفحة)، لكن نُسجّل مستمعًا
 *     يعيد التحميل تلقائيًا أول ما يعود الاتصال (حدث online + تحقق حقيقي).
 *   - online → إعادة تحميل واحدة (حارس زمني يمنع الحلقات اللانهائية).
 *     إعادة التحميل تصلح الحالتين معًا: تحصل على HTML جديد ثم حزم جديدة،
 *     وتصفير module-map المتصفح الذي يخزّن فشل الاستيراد.
 */

const RELOAD_TS_KEY = 'hassty_chunk_reload_at';
const RELOAD_COOLDOWN_MS = 10_000;

/** أنماط رسائل فشل الاستيراد الديناميكي عبر المتصفحات المختلفة (Chrome/Firefox/Safari + Vite) */
const IMPORT_FAIL_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \d+ failed|ChunkLoadError|Failed to load module script|Unable to preload CSS|dynamically imported module/i;

/** هل هذا الخطأ (أو رسالته) فشلَ تحميل حزمة/وحدة؟ */
export function isImportFailure(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : String((err as { message?: unknown })?.message ?? err);
  try {
    return IMPORT_FAIL_RE.test(msg);
  } catch {
    return false;
  }
}

/** نتيجة فحص الخادم: هل نصل للخادم؟ وهل المتصفح يشغّل إصدارًا أقدم من المنشور؟ */
interface ServerProbe {
  online: boolean;
  stale: boolean;
}

async function probeServer(): Promise<ServerProbe> {
  // محاكاة للاختبار المحلي فقط — لا تُفعَّل إلا بوجود البارامتر في الرابط
  try {
    if (window.location.search.includes('__simoff=1')) return { online: false, stale: false };
    if (window.location.search.includes('__simstale=1')) return { online: true, stale: true };
  } catch {
    /* ignore */
  }
  try {
    const res = await fetch(`/version.json?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return { online: true, stale: false };
    const data = (await res.json().catch(() => null)) as { buildId?: unknown } | null;
    const serverId = String(data?.buildId ?? '');
    const localId = typeof __BUILD_ID__ !== 'undefined' ? String(__BUILD_ID__) : '';
    return { online: true, stale: Boolean(serverId && localId && serverId !== localId) };
  } catch {
    return { online: false, stale: false };
  }
}

let onlineListenerArmed = false;

/** عند غياب الاتصال: أعد التحميل تلقائيًا أول ما يعود الإنترنت فعلًا (وليس مجرد واجهة الشبكة) */
function armOnlineAutoRecovery(): void {
  if (onlineListenerArmed) return;
  onlineListenerArmed = true;
  const onOnline = async () => {
    try {
      const { online } = await probeServer();
      if (online) {
        window.location.reload();
        return;
      }
      // واجهة الشبكة عادت لكن الإنترنت الفعلي لا يزال مقطوعًا — واصل الاستماع
      onlineListenerArmed = false;
      armOnlineAutoRecovery();
    } catch {
      /* ignore */
    }
  };
  window.addEventListener('online', onOnline);
}

export type RecoveryOutcome = 'reload' | 'offline' | 'cooldown';

/**
 * الاسترداد الذكي بعد فشل استيراد:
 * 'reload'   → أعدنا تحميل الصفحة (يصلح فشل الشبكة والنسخة القديمة معًا).
 * 'offline'  → لا اتصال حاليًا؛ سلّحنا مستمع online وستتحدث الصفحة تلقائيًا.
 * 'cooldown' → أعدنا التحميل منذ أقل من 10 ثوانٍ — نتجنب الحلقة اللانهائية.
 */
export async function smartChunkReload(opts: { force?: boolean } = {}): Promise<RecoveryOutcome> {
  const now = Date.now();
  if (!opts.force) {
    let last = 0;
    try {
      last = Number(sessionStorage.getItem(RELOAD_TS_KEY)) || 0;
    } catch {
      /* ignore */
    }
    if (now - last < RELOAD_COOLDOWN_MS) return 'cooldown';
  }
  try {
    sessionStorage.setItem(RELOAD_TS_KEY, String(now));
  } catch {
    /* ignore */
  }

  const probe = await probeServer();
  if (!probe.online) {
    armOnlineAutoRecovery();
    return 'offline';
  }
  // online (وبصمة أحدث أو نفس الإصدار): إعادة التحميل هي الحل الصحيح في الحالتين —
  // نسخة قديمة → HTML جديد، وفشل شبكة عابر → إعادة جلب الحزمة وتصفير الـ module-map.
  window.location.reload();
  return 'reload';
}
