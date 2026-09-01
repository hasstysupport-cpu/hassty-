import { supabase } from './supabase';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  adminReply: string | null;
  repliedBy: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function mapTicket(row: any): SupportTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    userId: row.user_id ?? null,
    name: row.name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? null,
    subject: row.subject ?? 'استفسار عام',
    message: row.message ?? '',
    status: row.status ?? 'open',
    adminReply: row.admin_reply ?? null,
    repliedBy: row.replied_by ?? null,
    repliedAt: row.replied_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSupportTicket(input: {
  userId?: string | null;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
}): Promise<SupportTicket> {
  const { data, error } = await client()
    .from('support_tickets')
    .insert({
      user_id: input.userId || null,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      subject: input.subject.trim() || 'استفسار عام',
      message: input.message.trim(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapTicket(data);
}

export async function loadSupportTickets(): Promise<SupportTicket[]> {
  const { data, error } = await client()
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapTicket);
}

export async function updateSupportTicket(ticketId: string, patch: {
  status?: SupportTicketStatus;
  adminReply?: string | null;
  repliedBy?: string | null;
  repliedAt?: string | null;
}): Promise<void> {
  const payload: Record<string, any> = {};
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.adminReply !== undefined) payload.admin_reply = patch.adminReply;
  if (patch.repliedBy !== undefined) payload.replied_by = patch.repliedBy;
  if (patch.repliedAt !== undefined) payload.replied_at = patch.repliedAt;

  const { error } = await client()
    .from('support_tickets')
    .update(payload)
    .eq('id', ticketId);
  if (error) throw error;
}

export function subscribeToSupportTickets(
  callback: (tickets: SupportTicket[]) => void,
  onError?: (error: any) => void,
) {
  const sb = client();
  let disposed = false;

  const load = async () => {
    try {
      const tickets = await loadSupportTickets();
      if (!disposed) callback(tickets);
    } catch (error) {
      if (!disposed) onError?.(error);
    }
  };

  void load();
  const channel = sb
    .channel('admin:support-tickets')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => void load())
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(new Error(`Realtime channel admin:support-tickets: ${status}`));
      }
    });

  return () => {
    disposed = true;
    void sb.removeChannel(channel);
  };
}
