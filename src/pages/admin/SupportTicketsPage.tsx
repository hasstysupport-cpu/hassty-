import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, MessageCircle, RefreshCw, Search, Send, Ticket, XCircle } from 'lucide-react';
import { SupportTicket, SupportTicketStatus, subscribeToSupportTickets, updateSupportTicket } from '../../lib/supportTicketsService';

export const SupportTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicketStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSupportTickets(setTickets, (err) => {
      console.error('Support tickets realtime error:', err);
      setError('تعذر تحميل تذاكر الدعم. تأكد من اتصال قاعدة البيانات وصلاحيات الأدمن.');
    });
    return unsubscribe;
  }, []);

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q || [ticket.ticketNumber, ticket.name, ticket.phone, ticket.email || '', ticket.subject, ticket.message].some((v) => v.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  }), [tickets, statusFilter, searchTerm]);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) || filteredTickets[0] || null;

  useEffect(() => {
    if (selectedTicket?.id !== selectedId) {
      setSelectedId(selectedTicket?.id || null);
      setReply(selectedTicket?.adminReply || '');
    }
  }, [selectedTicket?.id, selectedId, selectedTicket?.adminReply]);

  const saveTicket = async (status: SupportTicketStatus) => {
    if (!selectedTicket) return;
    setIsSaving(true);
    setError(null);
    try {
      const hasReply = reply.trim().length > 0;
      await updateSupportTicket(selectedTicket.id, {
        status,
        adminReply: hasReply ? reply.trim() : selectedTicket.adminReply,
        repliedBy: hasReply ? 'دعم حصتي' : selectedTicket.repliedBy,
        repliedAt: hasReply ? new Date().toISOString() : selectedTicket.repliedAt,
      });
      setTickets((prev) => prev.map((ticket) => ticket.id === selectedTicket.id ? {
        ...ticket,
        status,
        adminReply: hasReply ? reply.trim() : ticket.adminReply,
        repliedBy: hasReply ? 'دعم حصتي' : ticket.repliedBy,
        repliedAt: hasReply ? new Date().toISOString() : ticket.repliedAt,
      } : ticket));
    } catch (err: any) {
      console.error('Failed to update support ticket:', err);
      setError('تعذر حفظ الرد. تحقق من صلاحيات حساب الأدمن في Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusLabel = (status: SupportTicketStatus) => ({
    open: 'مفتوحة',
    in_progress: 'قيد المتابعة',
    resolved: 'تم الحل',
    closed: 'مغلقة',
  }[status]);

  const statusClass = (status: SupportTicketStatus) => ({
    open: 'bg-red-50 text-red-700 border-red-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-gray-100 text-gray-600 border-gray-200',
  }[status]);

  return (
    <div className="space-y-6 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center"><Ticket className="w-5 h-5" /></div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">تذاكر دعم العملاء 🎫</h2>
              <p className="text-xs text-gray-500 mt-0.5">مراجعة رسائل «اتصل بنا» والرد عليها وتغيير حالة التذكرة.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="px-4 py-2 bg-white border rounded-2xl"><p className="text-[10px] text-gray-500">مفتوحة</p><p className="text-lg font-black text-red-600">{tickets.filter(t => t.status === 'open').length}</p></div>
          <div className="px-4 py-2 bg-white border rounded-2xl"><p className="text-[10px] text-gray-500">قيد المتابعة</p><p className="text-lg font-black text-amber-600">{tickets.filter(t => t.status === 'in_progress').length}</p></div>
          <div className="px-4 py-2 bg-white border rounded-2xl"><p className="text-[10px] text-gray-500">تم الحل</p><p className="text-lg font-black text-emerald-600">{tickets.filter(t => t.status === 'resolved').length}</p></div>
        </div>
      </div>

      {error && <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-3xl p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full"><Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث برقم التذكرة أو الاسم أو الهاتف..." className="w-full pr-9 pl-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-blue-500" /></div>
        <div className="flex flex-wrap gap-2">
          {(['all','open','in_progress','resolved','closed'] as const).map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${statusFilter === status ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{status === 'all' ? 'الكل' : statusLabel(status)}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5 space-y-3">
          {filteredTickets.length === 0 ? <div className="bg-white border rounded-3xl p-12 text-center text-gray-400"><Ticket className="w-10 h-10 mx-auto mb-3" /><p className="text-sm font-bold">لا توجد تذاكر مطابقة</p></div> : filteredTickets.map((ticket) => (
            <button key={ticket.id} onClick={() => { setSelectedId(ticket.id); setReply(ticket.adminReply || ''); }} className={`w-full text-right bg-white border rounded-3xl p-4 transition-all ${selectedTicket?.id === ticket.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'}`}>
              <div className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-black text-blue-700">{ticket.ticketNumber}</span><span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${statusClass(ticket.status)}`}>{statusLabel(ticket.status)}</span></div>
              <h3 className="mt-3 text-sm font-black text-gray-900 line-clamp-1">{ticket.subject}</h3>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{ticket.message}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-400"><span>{ticket.name}</span><span dir="ltr">{ticket.phone}</span><span>{new Date(ticket.createdAt).toLocaleString('ar-EG')}</span></div>
            </button>
          ))}
        </div>

        <div className="xl:col-span-7">
          {!selectedTicket ? <div className="h-full min-h-[360px] bg-white border rounded-3xl flex items-center justify-center text-gray-400"><p className="text-sm font-bold">اختر تذكرة لعرض تفاصيلها</p></div> : (
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden sticky top-4">
              <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><span className="font-mono text-xs font-black text-blue-700">{selectedTicket.ticketNumber}</span><h3 className="text-lg font-black text-gray-900 mt-1">{selectedTicket.subject}</h3></div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusClass(selectedTicket.status)}`}>{statusLabel(selectedTicket.status)}</span>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-gray-50 border"><p className="text-[10px] text-gray-500">الاسم</p><p className="text-xs font-bold mt-1">{selectedTicket.name}</p></div>
                  <div className="p-3 rounded-2xl bg-gray-50 border"><p className="text-[10px] text-gray-500">الهاتف</p><p className="text-xs font-bold mt-1 font-mono" dir="ltr">{selectedTicket.phone}</p></div>
                  <div className="p-3 rounded-2xl bg-gray-50 border"><p className="text-[10px] text-gray-500">البريد</p><p className="text-xs font-bold mt-1 break-all">{selectedTicket.email || 'غير مضاف'}</p></div>
                </div>
                <div><p className="text-xs font-black text-[#1E3A8A] mb-2">رسالة العميل</p><div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm leading-7 text-gray-800 whitespace-pre-wrap">{selectedTicket.message}</div></div>
                <div><p className="text-xs font-black text-[#1E3A8A] mb-2">الرد على التذكرة</p><textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={6} placeholder="اكتب رد فريق الدعم هنا..." className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 resize-y" /></div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={isSaving} onClick={() => saveTicket('in_progress')} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-2 disabled:opacity-60"><Clock3 className="w-4 h-4" /> حفظ ومتابعة</button>
                  <button disabled={isSaving || !reply.trim()} onClick={() => saveTicket('resolved')} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 disabled:opacity-60"><CheckCircle2 className="w-4 h-4" /> إرسال الرد وحل التذكرة</button>
                  <button disabled={isSaving} onClick={() => saveTicket('closed')} className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-xs font-black flex items-center gap-2 disabled:opacity-60"><XCircle className="w-4 h-4" /> إغلاق</button>
                  <button disabled={isSaving} onClick={() => setReply(selectedTicket.adminReply || '')} className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4" /> إعادة</button>
                </div>
                {selectedTicket.adminReply && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl"><p className="text-xs font-black text-emerald-900 mb-1">آخر رد من الدعم</p><p className="text-xs text-emerald-800 leading-6 whitespace-pre-wrap">{selectedTicket.adminReply}</p>{selectedTicket.repliedAt && <p className="text-[10px] text-emerald-600 mt-2">{new Date(selectedTicket.repliedAt).toLocaleString('ar-EG')}</p>}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
