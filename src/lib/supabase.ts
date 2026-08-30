import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // This is a client-only Vite SPA. Keep the browser session durable and
        // let supabase-js consume OAuth tokens returned in the URL fragment.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
        storageKey: 'hassty-supabase-auth',
      },
    })
  : null;

export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string; missingTables?: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      message: 'لم يتم إضافة VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY في إعدادات Vercel بعد.',
    };
  }

  try {
    const checks = ['profiles', 'tutor_profiles', 'student_groups', 'attendance_records', 'booking_requests', 'safety_reports', 'teacher_verification_requests', 'commission_tracking'];
    for (const table of checks) {
      const { error } = await supabase.from(table).select('id', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
          return {
            ok: false,
            missingTables: true,
            message: `الاتصال بـSupabase موجود، لكن جدول ${table} غير موجود أو لم يتم تطبيق الـschema بالكامل.`,
          };
        }
        throw error;
      }
    }

    return {
      ok: true,
      message: 'تم الاتصال بقاعدة بيانات HASSTY في Supabase والجداول الأساسية تعمل.',
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || 'حدث خطأ أثناء محاولة الاتصال بـ Supabase.',
    };
  }
}
