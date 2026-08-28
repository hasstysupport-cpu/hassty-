export const db: any = {};
import { supabase, isSupabaseConfigured } from './supabase';

export type SupabaseDoc = { id: string; data: () => any; exists: () => boolean; ref?: any };
export type SupabaseQuery = {
  collectionName: string;
  filters: Array<{ field: string; op: string; value: any }>;
  orderings: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limitCount?: number;
};

const STORAGE_PREFIX = 'hassty_db_compat_';

function getLocalCollection(collectionName: string): Record<string, any> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${collectionName}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalCollection(collectionName: string, data: Record<string, any>) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${collectionName}`, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

const emptyQuery = (collectionName: string): SupabaseQuery => ({ collectionName, filters: [], orderings: [] });

export const collection = (_db: any, collectionName: string) => ({ collectionName });
export const doc = (arg1: any, arg2?: string, arg3?: string) => {
  const collectionName = arg3 !== undefined ? arg2 : (arg1?.collectionName || arg1);
  const id = arg3 !== undefined ? arg3 : (arg2 || crypto.randomUUID());
  return { collectionName, id };
};
export const where = (field: string, op: string, value: any) => ({ field, op, value });
export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => ({ field, direction });
export const limit = (count: number) => ({ count });
export const writeBatch = () => ({
  set: (ref: any, data: any) => setDoc(ref, data),
  update: (ref: any, data: any) => updateDoc(ref, data),
  delete: (ref: any) => deleteDoc(ref),
  commit: async () => {},
});

export const query = (ref: any, ...constraints: any[]): SupabaseQuery => {
  const q = emptyQuery(ref.collectionName || ref);
  for (const c of constraints) {
    if (!c) continue;
    if (c.field) q.filters.push({ field: c.field, op: c.op, value: c.value });
    else if (c.direction) q.orderings.push(c);
    else if (c.count) q.limitCount = c.count;
  }
  return q;
};

const makeDoc = (row: any): SupabaseDoc => ({
  id: row.document_id || row.id,
  data: () => row.data || {},
  exists: () => true,
});

const missingDoc = (id: string): SupabaseDoc => ({
  id,
  data: () => ({}),
  exists: () => false,
});

export async function getDoc(ref: any): Promise<SupabaseDoc> {
  const collName = ref.collectionName;
  const docId = ref.id;

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try app_documents
      const { data, error } = await supabase
        .from('app_documents')
        .select('*')
        .eq('collection_name', collName)
        .eq('document_id', docId)
        .maybeSingle();

      if (!error && data && data.data) {
        const local = getLocalCollection(collName);
        local[docId] = data.data;
        saveLocalCollection(collName, local);
        return makeDoc(data);
      }

      // 2. If 'users', try 'profiles' table directly
      if (collName === 'users') {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', docId)
          .maybeSingle();

        if (!profErr && prof) {
          const mappedUser = {
            id: prof.id,
            name: prof.full_name || prof.name || 'مستخدم حِصّتي',
            phone: prof.phone || '',
            email: prof.email || '',
            role: prof.role || 'student',
            governorate: prof.governorate || 'القاهرة',
            area: prof.city || prof.area || '',
            grade: prof.grade || '',
            qrCode: prof.qr_code || '',
            avatarUrl: prof.avatar_url || '',
            createdAt: prof.created_at,
          };
          const local = getLocalCollection(collName);
          local[docId] = mappedUser;
          saveLocalCollection(collName, local);
          return makeDoc({ document_id: prof.id, data: mappedUser });
        }
      }
    } catch (e) {
      console.warn('Supabase getDoc fallback to local cache:', e);
    }
  }

  const local = getLocalCollection(collName);
  if (local[docId]) {
    return {
      id: docId,
      data: () => local[docId],
      exists: () => true,
    };
  }
  return missingDoc(docId);
}

export async function getDocs(
  q: any
): Promise<{ docs: SupabaseDoc[]; empty: boolean; forEach: (fn: (d: SupabaseDoc) => void) => void }> {
  const queryObj: SupabaseQuery = q.collectionName ? q : emptyQuery(q.collectionName || q.collection_name);
  const collName = queryObj.collectionName;
  let rowsMap = new Map<string, any>();

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Fetch from app_documents
      const { data, error } = await supabase
        .from('app_documents')
        .select('*')
        .eq('collection_name', collName);

      if (!error && data && data.length > 0) {
        for (const row of data) {
          if (row.document_id) {
            rowsMap.set(row.document_id, {
              document_id: row.document_id,
              collection_name: collName,
              data: row.data || {},
              created_at: row.created_at,
            });
          }
        }
      }

      // 2. Fetch from native relational table if applicable
      if (collName === 'users') {
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('*');

        if (!profErr && profs && profs.length > 0) {
          for (const p of profs) {
            const existing = rowsMap.get(p.id);
            const mapped = {
              id: p.id,
              name: p.full_name || p.name || existing?.data?.name || 'مستخدم',
              phone: p.phone || existing?.data?.phone || '',
              email: p.email || existing?.data?.email || '',
              role: p.role || existing?.data?.role || 'student',
              grade: p.grade || existing?.data?.grade || '',
              governorate: p.governorate || existing?.data?.governorate || 'القاهرة',
              area: p.city || p.area || existing?.data?.area || '',
              qrCode: p.qr_code || existing?.data?.qrCode || '',
              avatarUrl: p.avatar_url || existing?.data?.avatarUrl || '',
              createdAt: p.created_at || existing?.data?.createdAt || new Date().toISOString(),
              status: existing?.data?.status || 'active',
              badge: existing?.data?.badge || 'none',
              studentsCount: existing?.data?.studentsCount || 0,
              totalRevenue: existing?.data?.totalRevenue || 0,
              parentPhone: existing?.data?.parentPhone || '',
            };
            rowsMap.set(p.id, {
              document_id: p.id,
              collection_name: 'users',
              data: mapped,
              created_at: p.created_at,
            });
          }
        }
      }

      // Sync local cache
      const local: Record<string, any> = {};
      rowsMap.forEach((v, k) => {
        local[k] = v.data;
      });
      if (Object.keys(local).length > 0) {
        saveLocalCollection(collName, local);
      }
    } catch (e) {
      console.warn('Supabase getDocs exception, using local:', e);
    }
  }

  // If no rows from Supabase, merge local cache
  if (rowsMap.size === 0) {
    const local = getLocalCollection(collName);
    Object.entries(local).forEach(([id, val]) => {
      rowsMap.set(id, {
        document_id: id,
        collection_name: collName,
        data: val,
      });
    });
  }

  let rows = Array.from(rowsMap.values());

  for (const f of queryObj.filters) {
    rows = rows.filter((r: any) => {
      const val = r.data?.[f.field];
      return f.op === '==' ? val === f.value : f.op === '!=' ? val !== f.value : true;
    });
  }

  for (const o of [...queryObj.orderings].reverse()) {
    rows.sort(
      (a: any, b: any) =>
        String(a.created_at || '').localeCompare(String(b.created_at || '')) *
        (o.direction === 'asc' ? 1 : -1)
    );
  }

  if (queryObj.limitCount) rows = rows.slice(0, queryObj.limitCount);
  const docs = rows.map(makeDoc);
  return { docs, empty: docs.length === 0, forEach: (fn) => docs.forEach(fn) };
}

export async function setDoc(ref: any, payload: any, options?: { merge?: boolean }) {
  const collName = ref.collectionName;
  const docId = ref.id;

  // 1. Update local cache immediately
  const local = getLocalCollection(collName);
  const existing = local[docId] || {};
  const data = options?.merge ? { ...existing, ...payload } : payload;
  local[docId] = data;
  saveLocalCollection(collName, local);

  // 2. Sync to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      // Upsert into app_documents
      await supabase.from('app_documents').upsert(
        {
          collection_name: collName,
          document_id: docId,
          data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'collection_name,document_id' }
      );

      // If 'users', also sync to 'profiles' table
      if (collName === 'users') {
        const phone = data.phone || `010${Math.floor(10000000 + Math.random() * 90000000)}`;
        await supabase.from('profiles').upsert(
          {
            id: docId,
            full_name: data.name || 'مستخدم',
            phone,
            email: data.email || null,
            role: data.role || 'student',
            governorate: data.governorate || 'القاهرة',
            city: data.area || '',
            grade: data.grade || null,
            qr_code: data.qrCode || null,
            avatar_url: data.avatarUrl || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
    } catch (e) {
      console.warn('Supabase setDoc sync error, local copy saved:', e);
    }
  }
}

export async function updateDoc(ref: any, patch: any) {
  return setDoc(ref, patch, { merge: true });
}

export async function deleteDoc(ref: any) {
  const collName = ref.collectionName;
  const docId = ref.id;

  // 1. Remove from local cache
  const local = getLocalCollection(collName);
  delete local[docId];
  saveLocalCollection(collName, local);

  // 2. Remove from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('app_documents')
        .delete()
        .eq('collection_name', collName)
        .eq('document_id', docId);
    } catch (e) {
      console.warn('Supabase deleteDoc error:', e);
    }
  }
}

export async function addDoc(collectionRef: any, payload: any) {
  const ref = doc(collectionRef);
  await setDoc(ref, payload);
  return ref;
}

export function onSnapshot(
  q: any,
  callback: (snap: any) => void,
  onError?: (e: any) => void
) {
  let cancelled = false;

  const load = async () => {
    try {
      const snap = await getDocs(q);
      if (!cancelled) callback(snap);
    } catch (e) {
      if (onError) onError(e);
    }
  };

  load();

  if (isSupabaseConfigured && supabase) {
    const collName = q.collectionName || q;
    try {
      const channel = supabase
        .channel(`compat:${collName}:${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_documents' },
          () => {
            load();
          }
        )
        .subscribe();

      let profilesChannel: any = null;
      if (collName === 'users') {
        profilesChannel = supabase
          .channel(`compat_profiles:${Date.now()}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles' },
            () => {
              load();
            }
          )
          .subscribe();
      }

      return () => {
        cancelled = true;
        if (channel && supabase) supabase.removeChannel(channel);
        if (profilesChannel && supabase) supabase.removeChannel(profilesChannel);
      };
    } catch (e) {
      console.warn('Realtime channel creation warning:', e);
    }
  }

  return () => {
    cancelled = true;
  };
}

export const Timestamp = {
  now: () => ({ toDate: () => new Date() }),
};
