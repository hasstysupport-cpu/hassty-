/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useEffect, useState } from 'react';
import { useSEO } from '../lib/useSEO';
import {
  MapPin,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  HelpCircle,
  Code2,
  ArrowUpRight,
  Ticket,
  MessageSquare
} from 'lucide-react';
import { FAQ_ITEMS } from '../data/mockData';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../lib/AuthContext';
import { createSupportTicket, loadMySupportTickets, SupportTicket } from '../lib/supportTicketsService';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

const SUPPORT_CHANNELS = [
  { label: 'تليجرام', username: 'جروب الدعم الرسمي', href: 'https://t.me/+-gGdGyw60wA2MDRk' },
  { label: 'واتساب', username: 'جروب الدعم الرسمي', href: 'https://chat.whatsapp.com/DDU2o4jiLASAcVeEb6BnNu' },
];

const TICKET_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open: { label: 'مفتوحة', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'قيد المعالجة', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolved: { label: 'تم الحل', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'مغلقة', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [myTicketsLoading, setMyTicketsLoading] = useState(false);
  const [myTicketsError, setMyTicketsError] = useState('');

  /* تذاكري: تُحمّل للمسجلين فقط (سياسة owner read تمنع رؤية غيرها) وتُحدّث بعد كل إرسال */
  const refreshMyTickets = React.useCallback(() => {
    if (!user?.uid) return;
    setMyTicketsLoading(true);
    setMyTicketsError('');
    loadMySupportTickets(user.uid)
      .then((rows) => setMyTickets(rows))
      .catch(() => setMyTicketsError('تعذر تحميل تذاكرك حاليًا.'))
      .finally(() => setMyTicketsLoading(false));
  }, [user?.uid]);

  useEffect(() => { refreshMyTickets(); }, [refreshMyTickets]);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    subject: 'استفسار عام',
    message: '',
  });

  useSEO({
    title: 'اتصل بنا والدعم الفني',
    description: 'تواصل مع فريق الدعم الفني لمنصة حصتي للاستفسارات العامة، دعم المدرسين والطلاب، عبر جروبات الدعم الرسمية على تليجرام وواتساب.',
    canonicalPath: '/contact',
    breadcrumbs: ['اتصل بنا'],
    keywords: 'اتصل بنا حصتي, دعم منصة حصتي, خدمة العملاء, مساعدة أولياء الأمور والطلاب',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const ticket = await createSupportTicket({
        userId: user?.uid || null,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      setTicketNumber(ticket.ticketNumber || null);
      setFormSubmitted(true);
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        subject: 'استفسار عام',
        message: '',
      });
      refreshMyTickets();
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      setSubmitError('تعذر إرسال الرسالة حالياً. حاول مرة أخرى أو تواصل معنا مباشرة عبر واتساب أو تليجرام.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (id: string) => setOpenFaqId(openFaqId === id ? null : id);

  return (
    <div className="bg-[#F8FAFF] min-h-screen pb-16 text-right">
      <section className="bg-white border-b border-[#E5E7EB] py-12 sm:py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge variant="info">خدمة العملاء والدعم الفني</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1E3A8A] mt-3 mb-4">نحن هنا لمساعدتك في أي وقت</h1>
          <p className="text-sm sm:text-base text-[#6B7280] max-w-xl mx-auto leading-relaxed">فريق الدعم الفني لمنصة حصتي جاهز للإجابة عن استفساراتكم وحل أي مشكلة تقنية أو استفسار بخصوص الحسابات.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="bg-sky-500 text-white rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"><Send className="w-7 h-7" /></div>
              <div><span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md">أسرع وسيلة تواصل</span><h3 className="text-lg font-black mt-2 mb-1">دعم فوري — تليجرام وواتساب</h3><p className="text-xs text-sky-100 leading-relaxed">تواصل معنا مباشرة عبر جروبات الدعم الرسمية على تليجرام وواتساب.</p></div>
              <div className="space-y-2">{SUPPORT_CHANNELS.map((item) => <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className="w-full py-3 bg-white hover:bg-sky-50 text-sky-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"><span>{item.label}: {item.username}</span><Send className="w-3.5 h-3.5" /></a>)}</div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-4">
              <div className="flex items-start gap-3.5 pb-4"><div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0"><Send className="w-4 h-4" /></div><div><h4 className="text-xs font-bold text-[#6B7280]">تليجرام وواتساب</h4><div className="space-y-1 mt-1">{SUPPORT_CHANNELS.map((item) => <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className="block text-xs font-bold text-[#1E3A8A] hover:text-sky-700">{item.label}: {item.username}</a>)}</div></div></div>
              <div className="flex items-start gap-3.5 pt-4 border-t border-gray-100"><div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0"><Code2 className="w-4 h-4" /></div><div><h4 className="text-xs font-bold text-[#6B7280]">لوحة المطورين</h4><button type="button" onClick={() => onNavigate('/team')} className="text-xs font-bold text-[#1E3A8A] hover:text-sky-700 mt-0.5 flex items-center gap-1 group cursor-pointer">فريق تطوير منصة حِصّتي <ArrowUpRight className="w-3 h-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></button><p className="text-[11px] text-[#9CA3AF] mt-0.5">تعرّف على الفريق الذي بني المنصة</p></div></div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6"><div><h3 className="text-xl font-bold text-[#1E3A8A] mb-1">أرسل لنا رسالة وسنتواصل معك</h3><p className="text-xs text-[#6B7280]">رسالتك ستُحفظ كتذكرة دعم ويمكن لفريق الإدارة مراجعتها والرد عليها.</p></div><div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> تذكرة دعم</div></div>
            {formSubmitted ? <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-fadeIn"><div className="w-14 h-14 bg-[#10B981] text-white rounded-full flex items-center justify-center mx-auto shadow-xs"><CheckCircle2 className="w-8 h-8" /></div><h4 className="text-base font-bold text-emerald-900">تم إرسال رسالتك بنجاح! 🎉</h4><p className="text-xs text-emerald-700 max-w-sm mx-auto">{ticketNumber ? <>تم إنشاء تذكرة دعم برقم <strong dir="ltr">{ticketNumber}</strong> وسيقوم فريق الإدارة بمراجعتها والرد عليها.</> : 'وصلتنا رسالتك وسيقوم فريق الإدارة بمراجعتها والرد عليك على رقم الواتساب المُسجّل.'}</p><div className="flex items-center justify-center gap-2"><button type="button" onClick={() => setFormSubmitted(false)} className="px-5 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 hover:bg-emerald-100">إرسال تذكرة أخرى</button>{!user?.uid && <button type="button" onClick={() => onNavigate('/login')} className="px-5 py-2.5 bg-emerald-600 rounded-xl text-xs font-bold text-white hover:bg-emerald-700">سجّل دخولك لمتابعة تذاكرك</button>}</div></div> : <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-[#1F2937] mb-1.5">الاسم بالكامل <span className="text-[#EF4444]">*</span></label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]" /></div><div><label className="block text-xs font-bold text-[#1F2937] mb-1.5">رقم الهاتف (واتساب) <span className="text-[#EF4444]">*</span></label><input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]" /></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-[#1F2937] mb-1.5">البريد الإلكتروني (اختياري)</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]" /></div><div><label className="block text-xs font-bold text-[#1F2937] mb-1.5">نوع الاستفسار</label><select value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"><option value="استفسار عام">استفسار عام</option><option value="انضمام كمعلم">طلب انضمام كمعلم جديد</option><option value="مشكلة تقنية في الكود">مشكلة في مسح كود الـ QR</option><option value="اشتراكات ومدفوعات">استفسار عن المدفوعات والعمولات</option></select></div></div>
              <div><label className="block text-xs font-bold text-[#1F2937] mb-1.5">نص الرسالة أو الاستفسار <span className="text-[#EF4444]">*</span></label><textarea rows={5} required minLength={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="اكتب استفسارك بالتفصيل وسنرد عليك بأسرع وقت..." className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB] resize-y" /></div>
              {submitError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">{submitError}</div>}
              <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-8 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"><Send className="w-4 h-4 rotate-180" /><span>{isSubmitting ? 'جاري إرسال التذكرة...' : 'إرسال التذكرة الآن'}</span></button>
            </form>}
          </div>
        </div>

        {/* تذاكري وردود الدعم — للمسجلين فقط (owner read عبر RLS) */}
        {user?.uid && (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#1E3A8A] flex items-center gap-2"><Ticket className="w-5 h-5 text-[#2563EB]" /> تذاكري وردود الدعم</h3>
                <p className="text-xs text-[#6B7280] mt-1">تابع حالة تذاكرك واقرأ رد فريق الإدارة من هنا مباشرة.</p>
              </div>
              <button type="button" onClick={refreshMyTickets} disabled={myTicketsLoading} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer">{myTicketsLoading ? 'جاري التحديث...' : 'تحديث'}</button>
            </div>
            {myTicketsError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold mb-3">{myTicketsError}</div>}
            {!myTicketsLoading && !myTicketsError && myTickets.length === 0 && (
              <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center text-xs text-gray-400 font-bold">لا توجد تذاكر بعد — أرسل رسالتك من النموذج أعلاه وستظهر هنا مع ردود الدعم.</div>
            )}
            <div className="space-y-3">
              {myTickets.map((t) => {
                const st = TICKET_STATUS_LABELS[t.status] || TICKET_STATUS_LABELS.open;
                return (
                  <div key={t.id} className="border border-[#E5E7EB] rounded-2xl p-4 space-y-2 hover:border-blue-200 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-black text-[#2563EB] bg-[#EFF6FF] border border-blue-100 px-2 py-0.5 rounded-md" dir="ltr">{t.ticketNumber}</span>
                        <span className="text-[13px] font-black text-gray-900">{t.subject}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(t.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-6 whitespace-pre-wrap">{t.message}</p>
                    {t.adminReply && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <p className="text-[10px] font-black text-emerald-800 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> رد فريق الدعم{t.repliedAt ? ` — ${new Date(t.repliedAt).toLocaleDateString('ar-EG')}` : ''}</p>
                        <p className="text-xs text-emerald-900 leading-6 whitespace-pre-wrap">{t.adminReply}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10"><div className="text-center max-w-2xl mx-auto mb-8"><div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2"><HelpCircle className="w-3.5 h-3.5" /><span>إجابات فورية</span></div><h3 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">الأسئلة الأكثر شيوعاً</h3></div><div className="space-y-3 max-w-4xl mx-auto">{FAQ_ITEMS.map((item) => { const isOpen = openFaqId === item.id; return <div key={item.id} className="border border-[#E5E7EB] rounded-2xl overflow-hidden transition-all"><button onClick={() => toggleFaq(item.id)} className="w-full p-4 sm:p-5 flex items-center justify-between text-right bg-gray-50/60 hover:bg-[#F8FAFF] transition-colors"><span className="text-xs sm:text-sm font-bold text-[#1E3A8A]">{item.question}</span>{isOpen ? <ChevronUp className="w-4 h-4 text-[#2563EB] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#6B7280] shrink-0" />}</button>{isOpen && <div className="px-4 sm:px-5 pb-5 text-xs leading-relaxed text-[#6B7280] bg-white">{item.answer}</div>}</div>; })}</div></div>
      </div>
    </div>
  );
};
