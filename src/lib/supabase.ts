import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to check connection status
export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      message: 'لم يتم إضافة VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY في الإعدادات بعد.',
    };
  }

  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      return {
        ok: false,
        message: `تم الاتصال بالسيرفر لكن الجداول غير منشأة بعد (${error.message}). يرجى تشغيل كود الـ SQL.`,
      };
    }
    return {
      ok: true,
      message: 'تم الاتصال بقاعدة بيانات Supabase بنجاح!',
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || 'حدث خطأ أثناء محاولة الاتصال بـ Supabase.',
    };
  }
}
