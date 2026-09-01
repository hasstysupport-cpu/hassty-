import { supabase } from './supabase';

export type NotificationType = 'system' | 'booking' | 'attendance' | 'payment' | 'support' | 'verification' | 'announcement';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export function subscribeToNotifications(userId: string, onChange: (items: AppNotification[]) => void, onError?: (error: any) => void) {
  if (!supabase) return () => {};
  let disposed = false;
  const load = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('id,user_id,title,message,type,link,read_at,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { if (!disposed) onError?.(error); return; }
    if (!disposed) onChange((data || []) as AppNotification[]);
  };
  void load();
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => void load())
    .subscribe((status) => {
      if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !disposed) onError?.(new Error(`Notifications realtime: ${status}`));
    });
  return () => { disposed = true; void supabase.removeChannel(channel); };
}

export async function markNotificationRead(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null);
  if (error) throw error;
}

export function notificationTime(value: string) {
  const date = new Date(value);
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  return date.toLocaleDateString('ar-EG');
}
