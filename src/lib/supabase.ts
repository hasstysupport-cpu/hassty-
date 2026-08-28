import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to check connection status
export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string; missingTables?: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      message: 'لم يتم إضافة VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY في الإعدادات بعد.',
    };
  }

  try {
    const { error } = await supabase.from('app_documents').select('count', { count: 'exact', head: true });
    if (error) {
      // Check if table missing (error code 42P01 in Postgres or PGRST204)
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
        return {
          ok: false,
          missingTables: true,
          message: 'تم الاتصال بخادم Supabase، ولكن جداول قاعدة البيانات لم يتم إنشاؤها بعد. يرجى نسخ كود SQL وتشغيله في SQL Editor.',
        };
      }
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
