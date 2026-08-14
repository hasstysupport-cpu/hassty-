import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { FAQ_ITEMS } from '../data/mockData';
import { Badge } from '../components/common/Badge';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'استفسار عام',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) return;
    setFormSubmitted(true);
    setTimeout(() => {
      setFormData({
        name: '',
        phone: '',
        email: '',
        subject: 'استفسار عام',
        message: '',
      });
    }, 4000);
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="bg-[#F8FAFF] min-h-screen pb-16 text-right">
      
      {/* Header Banner */}
      <section className="bg-white border-b border-[#E5E7EB] py-12 sm:py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge variant="info">خدمة العملاء والدعم الفني</Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1E3A8A] mt-3 mb-4">
            نحن هنا لمساعدتك في أي وقت
          </h1>
          <p className="text-sm sm:text-base text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            فريق الدعم الفني لمنصة حصتي جاهز للإجابة عن استفساراتكم وحل أي مشكلة تقنية أو استفسار بخصوص الحسابات.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        
        {/* Contact Grid: Form (Right) + Direct Info (Left) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Direct Contact Info Box (Left col on lg) */}
          <div className="space-y-4">
            
            {/* WhatsApp Highlight Box */}
            <div className="bg-emerald-500 text-white rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md">أسرع وسيلة تواصل</span>
                <h3 className="text-lg font-black mt-2 mb-1">دعم واتساب الفوري</h3>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  تواصل معنا مباشرة عبر محادثة واتساب للرد على استفسارات التسجيل أو الانضمام كمعلم.
                </p>
              </div>
              <a
                href="https://wa.me/201012345678"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>محادثة واتساب مباشرة</span>
                <Send className="w-3.5 h-3.5 rotate-180" />
              </a>
            </div>

            {/* Email and Phone info */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-4">
              <div className="flex items-start gap-3.5 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#6B7280]">الهاتف المباشر</h4>
                  <p className="text-sm font-bold text-[#1E3A8A] font-mono mt-0.5">01012345678</p>
                  <p className="text-[11px] text-gray-400">متاح يومياً من 9:00 ص إلى 10:00 م</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#6B7280]">البريد الإلكتروني</h4>
                  <p className="text-xs font-bold text-[#1E3A8A] font-mono mt-0.5">hasstysupport@gmail.com</p>
                  <p className="text-[11px] text-gray-400">الرد خلال ساعتين بحد أقصى</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#6B7280]">المقر الرئيسي</h4>
                  <p className="text-xs font-bold text-[#1E3A8A] mt-0.5">القاهرة الجديدة — التجمع الخامس، مصر</p>
                </div>
              </div>
            </div>

          </div>

          {/* Contact Form (2 Cols on lg) */}
          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-xl font-bold text-[#1E3A8A] mb-1">أرسل لنا رسالة وسنتواصل معك</h3>
            <p className="text-xs text-[#6B7280] mb-6">
              املأ البيانات وسيقوم ممثل الدعم بالاتصال بك أو الرد عبر البريد والواتساب فوراً.
            </p>

            {formSubmitted ? (
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-fadeIn">
                <div className="w-14 h-14 bg-[#10B981] text-white rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-emerald-900">تم إرسال رسالتك بنجاح!</h4>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  شكراً لتواصلك مع حصتي. سيتم الرد على استفسارك خلال دقائق على هاتفك أو بريدك الإلكتروني.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                      الاسم بالكامل <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد محمود"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                      رقم الهاتف (واتساب) <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01012345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                      البريد الإلكتروني (اختياري)
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                      نوع الاستفسار
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
                    >
                      <option value="استفسار عام">استفسار عام</option>
                      <option value="انضمام كمعلم">طلب انضمام كمعلم جديد</option>
                      <option value="مشكلة تقنية في الكود">مشكلة في مسح كود الـ QR</option>
                      <option value="اشتراكات ومدفوعات">استفسار عن المدفوعات والعمولات</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                    نص الرسالة أو الاستفسار <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="اكتب استفسارك بالتفصيل وسنرد عليك بأسرع وقت..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 rotate-180" />
                  <span>إرسال الرسالة الآن</span>
                </button>
              </form>
            )}
          </div>

        </div>

        {/* FAQ Accordion Section */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>إجابات فورية</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
              الأسئلة الأكثر شيوعاً
            </h3>
          </div>

          <div className="space-y-3 max-w-4xl mx-auto">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div
                  key={item.id}
                  className="border border-[#E5E7EB] rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(item.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-right bg-gray-50/60 hover:bg-[#F8FAFF] transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#1E3A8A]">
                      {item.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#2563EB] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-4 sm:p-5 bg-white text-xs sm:text-sm text-[#4B5563] leading-relaxed border-t border-gray-100">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
