export const db: any = {}
import { supabase } from './supabase';

export type SupabaseDoc = { id: string; data: () => any; exists: () => boolean; ref?: any };
export type SupabaseQuery = { collectionName: string; filters: Array<{field:string; op:string; value:any}>; orderings: Array<{field:string; direction:'asc'|'desc'}>; limitCount?: number };

const emptyQuery = (collectionName: string): SupabaseQuery => ({ collectionName, filters: [], orderings: [] });

export const collection = (_db: any, collectionName: string) => ({ collectionName });
export const doc = (arg1: any, arg2?: string, arg3?: string) => {
  const collectionName = arg3 !== undefined ? arg2 : (arg1?.collectionName || arg1);
  const id = arg3 !== undefined ? arg3 : (arg2 || crypto.randomUUID());
  return { collectionName, id };
};
export const where = (field: string, op: string, value: any) => ({ field, op, value });
export const orderBy = (field: string, direction: 'asc'|'desc' = 'asc') => ({ field, direction });
export const limit = (count: number) => ({ count });
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

const makeDoc = (row: any): SupabaseDoc => ({ id: row.document_id, data: () => row.data || {}, exists: () => true });
const missingDoc = (id: string): SupabaseDoc => ({ id, data: () => ({}), exists: () => false });

function normalizeConstraintFilter(q: SupabaseQuery, builder: any) {
  for (const f of q.filters) {
    if (f.op === '==') builder = builder.eq(`data->>${f.field}`, String(f.value));
    else if (f.op === '!=') builder = builder.neq(`data->>${f.field}`, String(f.value));
  }
  for (const o of q.orderings) builder = builder.order('created_at', { ascending: o.direction === 'asc' });
  if (q.limitCount) builder = builder.limit(q.limitCount);
  return builder;
}

export async function getDoc(ref: any): Promise<SupabaseDoc> {
  if (!supabase) return missingDoc(ref.id);
  const { data, error } = await supabase.from('app_documents').select('*').eq('collection_name', ref.collectionName).eq('document_id', ref.id).maybeSingle();
  if (error || !data) return missingDoc(ref.id);
  return makeDoc(data);
}

export async function getDocs(q: any): Promise<{ docs: SupabaseDoc[]; empty: boolean; forEach: (fn:(d:SupabaseDoc)=>void)=>void }> {
  if (!supabase) return { docs: [], empty: true, forEach: () => {} };
  const queryObj: SupabaseQuery = q.collectionName ? q : emptyQuery(q.collectionName || q.collection_name);
  let builder = supabase.from('app_documents').select('*').eq('collection_name', queryObj.collectionName);
  // JSON path filters via PostgREST are unreliable for nested legacy values; fetch collection then filter locally.
  const { data, error } = await builder;
  let rows = error ? [] : (data || []);
  for (const f of queryObj.filters) {
    rows = rows.filter((r:any) => {
      const val = r.data?.[f.field];
      return f.op === '==' ? val === f.value : f.op === '!=' ? val !== f.value : true;
    });
  }
  for (const o of [...queryObj.orderings].reverse()) {
    rows.sort((a:any,b:any) => String(a.created_at||'').localeCompare(String(b.created_at||'')) * (o.direction === 'asc' ? 1 : -1));
  }
  if (queryObj.limitCount) rows = rows.slice(0, queryObj.limitCount);
  const docs = rows.map(makeDoc);
  return { docs, empty: docs.length === 0, forEach: (fn) => docs.forEach(fn) };
}

export async function setDoc(ref: any, payload: any, options?: { merge?: boolean }) {
  if (!supabase) throw new Error('Supabase is not configured');
  const existing = options?.merge ? await getDoc(ref) : null;
  const data = existing && existing.exists() ? { ...existing.data(), ...payload } : payload;
  const { error } = await supabase.from('app_documents').upsert({ collection_name: ref.collectionName, document_id: ref.id, data }, { onConflict: 'collection_name,document_id' });
  if (error) throw error;
}

export async function updateDoc(ref: any, patch: any) { return setDoc(ref, patch, { merge: true }); }
export async function deleteDoc(ref: any) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('app_documents').delete().eq('collection_name', ref.collectionName).eq('document_id', ref.id);
  if (error) throw error;
}
export async function addDoc(collectionRef: any, payload: any) { const ref = doc(collectionRef); await setDoc(ref, payload); return ref; }

export function onSnapshot(q: any, callback: (snap:any)=>void, onError?: (e:any)=>void) {
  let cancelled = false;
  const load = async () => { try { const snap = await getDocs(q); if (!cancelled) callback(snap); } catch(e) { onError?.(e); } };
  load();
  const channel = supabase?.channel(`compat:${q.collectionName || q}`).on('postgres_changes', { event: '*', schema: 'public', table: 'app_documents' }, load).subscribe();
  return () => { cancelled = true; if (channel && supabase) supabase.removeChannel(channel); };
}

export const Timestamp = { now: () => ({ toDate: () => new Date() }) };
