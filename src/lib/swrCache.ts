/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * swrCache — كاش قراءات خفيف بنمط Stale-While-Revalidate
 * ------------------------------------------------------
 * لماذا: كل استدعاء لـ PostgREST تكلفته الشبكية ~300ms من مصر
 * (eu-west-1)، والبيانات العامة/النصف ثابتة (دليل المدرسين مثلاً)
 * لا تحتاج جلبًا كاملًا في كل زيارة.
 *
 * النمط: أول نداء يجلب من الشبكة. النداءات التالية (خلال TTL) تُخدم
 * فورًا من الكاش ويُحدّث الكاش في الخلفية (revalidate) بدون حظر.
 *
 * - dedup للنداءات المتزامنة (in-flight) حتى لا تتضاعف الطلبات
 * - تخزين في الذاكرة + sessionStorage ليبقى الكاش عبر إعادة التحميل
 * - إبطال يدوي متاح (invalidate) بعد عمليات الكتابة
 */

type Entry = { data: any; at: number };

const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<any>>();

const PREFIX = 'hassty:swr:';

function readStorage(key: string): Entry | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as Entry;
  } catch {
    return null;
  }
}

function writeStorage(key: string, entry: Entry) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    /* الحصة ممتلئة — الكاش في الذاكرة يكفي */
  }
}

/** جلب مع كاش SWR: يعيد البيانات فورًا إن كانت حديثة، ويعيد الحدث في الخلفية */
export async function swrFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  onUpdate?: (fresh: T) => void,
): Promise<T> {
  const cached = memory.get(key) ?? readStorage(key);
  const fresh = cached ? Date.now() - cached.at < ttlMs : false;

  if (cached) {
    // خدمة الكاش فورًا، وتحديث في الخلفية لو عتجز عن الـ TTL
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

/** إبطال يدوي بعد كتابة تغيّر البيانات المخزنة */
export function swrInvalidate(key?: string) {
  if (key) {
    memory.delete(key);
    try { sessionStorage.removeItem(PREFIX + key); } catch { /* noop */ }
  } else {
    memory.clear();
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch { /* noop */ }
  }
}
