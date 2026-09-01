import { supabase, isSupabaseConfigured } from './supabase';

export const db: any = {};

export type SupabaseDoc = { id: string; data: () => any; exists: () => boolean; ref?: any };
export type SupabaseQuery = {
  collectionName: string;
  filters: Array<{ field: string; op: string; value: any }>;
  orderings: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limitCount?: number;
};

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
export const writeBatch = () => {
  const operations: Array<() => Promise<void>> = [];
  return {
    set: (ref: any, data: any) => operations.push(() => setDoc(ref, data)),
    update: (ref: any, data: any) => operations.push(() => updateDoc(ref, data)),
    delete: (ref: any) => operations.push(() => deleteDoc(ref)),
    commit: async () => { for (const operation of operations) await operation(); },
  };
};

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

const missingDoc = (id: string): SupabaseDoc => ({ id, data: () => ({}), exists: () => false });

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function profileToData(profile: any) {
  return {
    id: profile.id,
    uid: profile.id,
    name: profile.full_name || 'مستخدم حِصّتي',
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    email: profile.email || '',
    role: profile.role || 'student',
    avatarUrl: profile.avatar_url || '',
    qrCode: profile.qr_code || '',
    governorate: profile.governorate || 'القاهرة',
    area: profile.city || '',
    grade: profile.grade || '',
    accountStatus: profile.account_status || 'active',
    status: profile.account_status || 'active',
    badge: profile.badge || 'none',
    isVerified: profile.badge === 'verified',
    emailVerified: Boolean(profile.metadata?.emailVerified),
    parentPhone: profile.metadata?.parentPhone || '',
    nationalId: profile.metadata?.nationalId || '',
    profileData: profile.metadata?.profileData || {},
    ...((profile.metadata || {}) as Record<string, any>),
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

function tutorToData(tutor: any, profile?: any) {
  return {
    id: tutor.user_id,
    uid: tutor.user_id,
    name: profile?.full_name || tutor.title || 'مدرس حِصّتي',
    title: tutor.title || '',
    headline: tutor.headline || '',
    subject: tutor.subjects?.[0] || '',
    subjects: tutor.subjects || [],
    levels: tutor.grades || [],
    grades: tutor.grades || [],
    governorate: tutor.governorate || profile?.governorate || 'القاهرة',
    area: tutor.city || profile?.city || '',
    rating: Number(tutor.rating || 0),
    reviewsCount: Number(tutor.reviews_count || 0),
    studentsCount: 0,
    pricePerSession: Number(tutor.price_per_session || 0),
    pricePerMonth: Number(tutor.price_per_month || 0),
    monthlySubscriptionPrice: Number(tutor.price_per_month || 0),
    isVerified: Boolean(tutor.is_verified),
    verificationStatus: tutor.verification_status || 'pending',
    experienceYears: tutor.experience_years_text || tutor.experience_years || '',
    centers: tutor.center_names || [],
    bio: tutor.bio || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    avatarUrl: profile?.avatar_url || '',
    ...((tutor.metadata || {}) as Record<string, any>),
  };
}

async function getFromAppDocuments(collectionName: string, docId?: string): Promise<any> {
  const client = requireSupabase();
  if (docId) {
    return client.from('app_documents').select('*').eq('collection_name', collectionName).eq('document_id', docId).maybeSingle();
  }
  return client.from('app_documents').select('*').eq('collection_name', collectionName);
}

export async function getDoc(ref: any): Promise<SupabaseDoc> {
  const collName = ref.collectionName;
  const docId = ref.id;
  const client = requireSupabase();

  if (collName === 'users') {
    const { data, error } = await client.from('profiles').select('*').eq('id', docId).maybeSingle();
    if (error) throw error;
    return data ? makeDoc({ document_id: data.id, data: profileToData(data) }) : missingDoc(docId);
  }

  if (collName === 'tutors') {
    const [{ data: tutor, error: tutorError }, { data: profile, error: profileError }] = await Promise.all([
      client.from('tutor_profiles').select('*').eq('user_id', docId).maybeSingle(),
      client.from('profiles').select('*').eq('id', docId).maybeSingle(),
    ]);
    if (tutorError) throw tutorError;
    if (profileError) throw profileError;
    return tutor ? makeDoc({ document_id: docId, data: tutorToData(tutor, profile) }) : missingDoc(docId);
  }

  const { data, error } = await getFromAppDocuments(collName, docId);
  if (error) throw error;
  return data ? makeDoc(data) : missingDoc(docId);
}

async function fetchCollectionRows(collName: string) {
  const client = requireSupabase();

  if (collName === 'users') {
    const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({ document_id: row.id, data: profileToData(row), created_at: row.created_at }));
  }

  if (collName === 'tutors') {
    const [{ data: tutors, error: tutorError }, { data: profiles, error: profileError }] = await Promise.all([
      client.from('tutor_profiles').select('*').order('created_at', { ascending: false }),
      client.from('profiles').select('id,full_name,phone,email,avatar_url,governorate,city'),
    ]);
    if (tutorError) throw tutorError;
    if (profileError) throw profileError;
    const profileById = new Map((profiles || []).map((p: any) => [p.id, p]));
    return (tutors || []).map((row: any) => ({ document_id: row.user_id, data: tutorToData(row, profileById.get(row.user_id)), created_at: row.created_at }));
  }

  const tableMap: Record<string, string> = {
    groups: 'student_groups',
    attendance: 'attendance_records',
    booking_requests: 'booking_requests',
    parent_children: 'parent_children',
    makeup_requests: 'makeup_requests',
    safety_reports: 'safety_reports',
    attendance_disputes: 'attendance_disputes',
    commissions: 'commission_tracking',
  };

  if (tableMap[collName]) {
    const { data, error } = await client.from(tableMap[collName]).select('*');
    if (error) throw error;
    return (data || []).map((row: any) => ({ document_id: row.id, data: row, created_at: row.created_at }));
  }

  const { data, error } = await getFromAppDocuments(collName);
  if (error) throw error;
  return (data || []).map((row: any) => ({ document_id: row.document_id, data: row.data || {}, created_at: row.created_at }));
}

function applyQuery(rows: any[], queryObj: SupabaseQuery) {
  let result = [...rows];
  for (const f of queryObj.filters) {
    result = result.filter((r: any) => {
      const val = r.data?.[f.field];
      if (f.op === '==') return val === f.value;
      if (f.op === '!=') return val !== f.value;
      return true;
    });
  }
  for (const o of [...queryObj.orderings].reverse()) {
    result.sort((a: any, b: any) => String(a.data?.[o.field] ?? a.created_at ?? '').localeCompare(String(b.data?.[o.field] ?? b.created_at ?? '')) * (o.direction === 'asc' ? 1 : -1));
  }
  if (queryObj.limitCount) result = result.slice(0, queryObj.limitCount);
  return result;
}

export async function getDocs(q: any): Promise<{ docs: SupabaseDoc[]; empty: boolean; forEach: (fn: (d: SupabaseDoc) => void) => void }> {
  const queryObj: SupabaseQuery = q.collectionName ? q : emptyQuery(q.collectionName || q.collection_name);
  const rows = applyQuery(await fetchCollectionRows(queryObj.collectionName), queryObj);
  const docs = rows.map(makeDoc);
  return { docs, empty: docs.length === 0, forEach: (fn) => docs.forEach(fn) };
}

async function upsertUser(docId: string, data: any) {
  const client = requireSupabase();
  const { data: existing, error: readError } = await client.from('profiles').select('metadata').eq('id', docId).maybeSingle();
  if (readError) throw readError;
  const metadata = { ...(existing?.metadata || {}), ...(data.profileData || {}), ...data };
  const payload = {
    id: docId,
    full_name: data.name || data.full_name || 'مستخدم حِصّتي',
    phone: data.phone || '00000000000',
    email: data.email || null,
    role: data.role || 'student',
    avatar_url: data.avatarUrl || data.avatar_url || null,
    qr_code: data.qrCode || data.qr_code || null,
    governorate: data.governorate || null,
    city: data.area || data.city || null,
    grade: data.grade || null,
    account_status: data.accountStatus || data.status || 'active',
    badge: data.badge || (data.isVerified ? 'verified' : existing ? undefined : 'none'),
    metadata,
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

async function upsertTutor(docId: string, data: any) {
  const client = requireSupabase();
  const { data: existing } = await client.from('tutor_profiles').select('*').eq('user_id', docId).maybeSingle();
  const metadata = { ...(existing?.metadata || {}), ...data.metadata };
  const payload: any = {
    user_id: docId,
    title: data.title || `معلم ${data.subject || 'المادة'}`,
    headline: data.headline || null,
    bio: data.bio || null,
    subjects: data.subjects || (data.subject ? [data.subject] : []),
    grades: data.grades || data.levels || [],
    experience_years: Number.parseInt(String(data.experienceYears || '').replace(/[^0-9]/g, ''), 10) || 1,
    experience_years_text: data.experienceYears ? String(data.experienceYears) : null,
    rating: Number(data.rating || 5),
    reviews_count: Number(data.reviewsCount || 0),
    governorate: data.governorate || null,
    city: data.area || data.city || null,
    center_names: data.centers || data.center_names || [],
    price_per_month: Number(data.pricePerMonth || data.monthlySubscriptionPrice || 0),
    price_per_session: Number(data.pricePerSession || 0),
    punctuality_rate: Number(data.punctualityRate || 100),
    metadata: { ...metadata, joinCode: data.joinCode || metadata.joinCode },
    // Client-created teachers are never auto-verified.
    is_verified: Boolean(existing?.is_verified),
    verification_status: existing?.verification_status || 'pending',
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from('tutor_profiles').upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

async function upsertRelationalCollection(collName: string, docId: string, data: any) {
  const client = requireSupabase();
  const map: Record<string, { table: string; payload: any }> = {
    groups: {
      table: 'student_groups',
      payload: {
        id: docId,
        tutor_id: data.tutorId || data.teacherId,
        name: data.name || 'مجموعة جديدة',
        grade: data.grade || '',
        schedule: data.schedule || data.timing || '',
        location: data.location || '',
        center_name: data.centerName || data.location || '',
        max_students: Number(data.maxCapacity || data.maxStudents || 30),
        current_count: Number(data.currentStudents || 0),
        monthly_fee: Number(data.monthlyPrice || data.priceAmount || 0),
        is_active: data.isPaused !== true,
        updated_at: new Date().toISOString(),
      },
    },
    booking_requests: {
      table: 'booking_requests',
      payload: {
        id: docId,
        tutor_id: data.tutorId,
        student_id: data.studentId || null,
        student_name: data.studentName || '',
        student_phone: data.studentPhone || '',
        parent_phone: data.parentPhone || null,
        grade: data.studentGrade || data.grade || '',
        group_id: data.groupId || null,
        notes: data.notes || null,
        status: data.status || 'pending',
        updated_at: new Date().toISOString(),
      },
    },
    attendance: {
      table: 'attendance_records',
      payload: {
        id: docId,
        group_id: data.groupId,
        student_id: data.studentId || null,
        student_name: data.studentName || '',
        qr_code: data.qrCode || '',
        date: data.date || new Date().toISOString().slice(0, 10),
        time: data.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        status: data.status || 'present',
        homework_status: data.homeworkStatus || 'pending',
        notes: data.notes || null,
        is_makeup: Boolean(data.isMakeup),
        scanned_via_qr: data.scannedViaQr !== false,
        updated_at: new Date().toISOString(),
      },
    },
    safety_reports: {
      table: 'safety_reports',
      payload: {
        id: docId,
        ticket_number: data.ticketNumber || `HST-${Date.now()}`,
        reporter_id: data.reporterId || null,
        target_teacher_id: data.targetTeacherId || null,
        report_type: data.reportType || data.category || 'other',
        category: data.category || data.reportType || 'other',
        details: data.details || data.description || '',
        status: data.status === 'in_review' ? 'under_investigation' : data.status === 'resolved' ? 'resolved' : 'open',
        updated_at: new Date().toISOString(),
      },
    },
  };
  const entry = map[collName];
  if (!entry) return false;
  const { error } = await client.from(entry.table).upsert(entry.payload, { onConflict: 'id' });
  if (error) throw error;
  return true;
}

export async function setDoc(ref: any, payload: any, options?: { merge?: boolean }) {
  const collName = ref.collectionName;
  const docId = ref.id;
  const client = requireSupabase();

  if (collName === 'users') {
    let data = payload;
    if (options?.merge) {
      const current = await getDoc(ref);
      data = current.exists() ? { ...current.data(), ...payload } : payload;
    }
    await upsertUser(docId, data);
    return;
  }

  if (collName === 'tutors') {
    let data = payload;
    if (options?.merge) {
      const current = await getDoc(ref);
      data = current.exists() ? { ...current.data(), ...payload } : payload;
    }
    await upsertTutor(docId, data);
    return;
  }

  if (['groups', 'booking_requests', 'attendance', 'safety_reports'].includes(collName)) {
    const handled = await upsertRelationalCollection(collName, docId, payload);
    if (handled) return;
  }

  const current = options?.merge ? (await getDoc(ref)).data() : {};
  const data = options?.merge ? { ...current, ...payload } : payload;
  const { error } = await client.from('app_documents').upsert({
    collection_name: collName,
    document_id: docId,
    data,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'collection_name,document_id' });
  if (error) throw error;
}

export async function updateDoc(ref: any, patch: any) { return setDoc(ref, patch, { merge: true }); }

export async function deleteDoc(ref: any) {
  const collName = ref.collectionName;
  const docId = ref.id;
  const client = requireSupabase();
  const tableMap: Record<string, string> = {
    users: 'profiles',
    groups: 'student_groups',
    booking_requests: 'booking_requests',
    attendance: 'attendance_records',
    safety_reports: 'safety_reports',
    parent_children: 'parent_children',
    makeup_requests: 'makeup_requests',
    attendance_disputes: 'attendance_disputes',
    commissions: 'commission_tracking',
  };
  const table = tableMap[collName];
  if (table) {
    const { error } = await client.from(table).delete().eq('id', docId);
    if (error) throw error;
    return;
  }
  const { error } = await client.from('app_documents').delete().eq('collection_name', collName).eq('document_id', docId);
  if (error) throw error;
}

export async function addDoc(collectionRef: any, payload: any) {
  const ref = doc(collectionRef);
  await setDoc(ref, payload);
  return ref;
}

export function onSnapshot(q: any, callback: (snap: any) => void, onError?: (e: any) => void) {
  let cancelled = false;
  const load = async () => {
    try {
      const snap = await getDocs(q);
      if (!cancelled) callback(snap);
    } catch (e) {
      if (!cancelled) onError?.(e);
    }
  };
  void load();

  if (!isSupabaseConfigured || !supabase) return () => { cancelled = true; };
  const collName = q.collectionName || q;
  const tableMap: Record<string, string[]> = {
    users: ['profiles'],
    tutors: ['tutor_profiles', 'profiles'],
    groups: ['student_groups'],
    attendance: ['attendance_records'],
    booking_requests: ['booking_requests'],
    safety_reports: ['safety_reports'],
    parent_children: ['parent_children'],
    makeup_requests: ['makeup_requests'],
    attendance_disputes: ['attendance_disputes'],
    commissions: ['commission_tracking'],
  };
  const tables = tableMap[collName] || ['app_documents'];
  const channel = supabase.channel(`compat:${collName}:${Date.now()}`);
  tables.forEach((table) => channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => void load()));
  channel.subscribe();
  return () => {
    cancelled = true;
    void supabase.removeChannel(channel);
  };
}

export const Timestamp = { now: () => ({ toDate: () => new Date() }) };