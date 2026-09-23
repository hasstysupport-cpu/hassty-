/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * swrCache — كاش قراءات مركزي بنمط Stale-While-Revalidate (نسخة مطوّرة)
 * ---------------------------------------------------------------------
 * لماذا: كل استدعاء لـ PostgREST تكلفته الشبكية ~300ms من مصر
 * (eu-west-1)، والبيانات العامة/النصف ثابتة (دليل المدرسين مثلاً)
 * لا تحتاج جلبًا كاملًا في كل زيارة — الهدف أن معظم الطلبات تُخدم
 * من الكاش ولا تلمس قاعدة البيانات إلا عند الانتهاء من الـ TTL.
 *
 * النمط: أول نداء يجلب من الشبكة. النداءات التالية (خلال TTL) تُخدم
 * فورًا من الكاش ويُحدّث الكاش في الخلفية (revalidate) بدون حظر.
 *
 * الميزات:
 * - طبقتا تخزين: ذاكرة (سريعة) + localStorage (يبقى الكاش عبر
 *   إعادة التحميل وإغلاق المتصفح — أقوى من sessionStorage السابق)
 * - dedup للنداءات المتزامنة (in-flight) حتى لا تتضاعف الطلبات
 * - حد أقصى لعدد مفاتيح الكاش (LRU) لحماية التخزين
 * - إبطال يدوي متاح (invalidate) بعد عمليات الكتابة
 * - ready state آمن للـ SSR/البيئات بدون تخزين
 */

type Entry = { data: any; at: number };

const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<any>>();

const PREFIX = 'hassty:swr:';
/** الحد الأقصى لعدد الإدخالات في localStorage (LRU) */
const MAX_STORAGE_KEYS = 120;

function storageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function readStorage(key: string): Entry | null {
  if (!storageAvailable()) return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry;
    if (!parsed || typeof parsed.at !== 'number') return null;
    // إعادة تعيين موضع الإدخال في الذاكرة (LRU)
    memory.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(key: string, entry: Entry) {
  if (!storageAvailable()) return;
  try {
    // إزالة أقدم إدخال عند تجاوز الحد (LRU بسيط بالترتيب)
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    if (keys.length >= MAX_STORAGE_KEYS && !keys.includes(PREFIX + key)) {
      // الأقدم أولًا حسب at المحفوظ
      let oldestKey = '';
      let oldestAt = Infinity;
      for (const k of keys) {
        try {
          const e = JSON.parse(localStorage.getItem(k) || '') as Entry;
          if (e.at < oldestAt) { oldestAt = e.at; oldestKey = k; }
        } catch { oldestKey = k; break; }
      }
      if (oldestKey) localStorage.removeItem(oldestKey);
    }
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    /* الحصة ممتلئة — الكاش في الذاكرة يكفي */
  }
}

/** جلب مع كاش SWR: يعيد البيانات فورًا إن كانت حديثة، ويحدّث في الخلفية لو عتق */
export async function swrFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  onUpdate?: (fresh: T) => void,
): Promise<T> {
  const cached = memory.get(key) ?? readStorage(key);
  const fresh = cached ? Date.now() - cached.at < ttlMs : false;

  if (cached) {
    // خدمة الكاش فورًا، وتحديث في الخلفية لو تجاوز الـ TTL
    if (!fresh) {
      void revalidate(key, fetcher, onUpdate);
    }
    return cached.data as T;
  }

  // لا كاش إطلاقًا — انتظر الجلب الأول (مع dedup للمتزامنين)
  return revalidate(key, fetcher, onUpdate);
}

/** إعادة الجلب مع دمج النداءات المتزامنة */
export function revalidate<T>(key: string, fetcher: () => Promise<T>, onUpdate?: (fresh: T) => void): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const p = fetcher()
    .then((data) => {
      const entry: Entry = { data, at: Date.now() };
      memory.set(key, entry);
      writeStorage(key, entry);
      inflight.delete(key);
      onUpdate?.(data);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, p);
  return p;
}

/** فرض جلب جديد (تخطي الكاش) ثم تخزينه — للاستخدام بعد عمليات كتابة حرجة */
export function forceRevalidate<T>(key: string, fetcher: () => Promise<T>, onUpdate?: (fresh: T) => void): Promise<T> {
  return revalidate(key, fetcher, onUpdate);
}

/** إبطال يدوي بعد كتابة تغيّر البيانات المخزنة */
export function swrInvalidate(key?: string) {
  if (key) {
    memory.delete(key);
    if (storageAvailable()) {
      try { localStorage.removeItem(PREFIX + key); } catch { /* noop */ }
    }
  } else {
    memory.clear();
    if (storageAvailable()) {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(PREFIX))
          .forEach((k) => localStorage.removeItem(k));
      } catch { /* noop */ }
    }
  }
}

/** TTL presets موحدة — قيم مدروسة حسب طبيعة كل بيانات */
export const SWR_TTL = {
  /** ثابت تقريبًا (قوائم المحافظات، إعدادات عامة) */
  STATIC: 30 * 60 * 1000,
  /** بيانات نصف ثابتة (دليل المدرسين العام) */
  DIRECTORY: 5 * 60 * 1000,
  /** صفحة مدرس مفردة */
  PROFILE: 2 * 60 * 1000,
  /** قوائم لوحة الأدمن (المصدر الحقيقي realtime — الكاش للفتح الفوري فقط) */
  ADMIN_SNAPSHOT: 60 * 1000,
} as const;
