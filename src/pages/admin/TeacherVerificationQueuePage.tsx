import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Eye,
  AlertCircle,
  Send,
  FileText,
  MapPin,
  Calendar,
  Sparkles,
  Award,
  X
} from 'lucide-react';
import { TeacherVerificationRequest } from '../../types';

interface TeacherVerificationQueuePageProps {
  requests: TeacherVerificationRequest[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string, reason: string) => void;
}

export const TeacherVerificationQueuePage: React.FC<TeacherVerificationQueuePageProps> = ({
  requests,
  onApproveRequest,
  onRejectRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reject modal state
  const [rejectingRequest, setRejectingRequest] = useState<TeacherVerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Preview ID Card image modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const historyRequests = requests.filter((r) => r.status !== 'pending');

  const displayedRequests = (activeTab === 'pending' ? pendingRequests : historyRequests).filter((r) =>
    r.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.governorate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.includes(searchTerm)
  );

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    onRejectRequest(rejectingRequest.id, rejectReason || 'بيانات البطاقة أو المؤهل غير مطابقة أو غير واضحة');
    setRejectingRequest(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6 text-right font-['Tajawal',sans-serif]">
      
      {/* 1. Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            طابور توثيق المدرسين (Teacher Verification Queue) 🛡️
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            تدقيق بطاقات الرقم القومي والشهادات المرفوعة عبر التليجرام/الواتساب لاعتماد ظهور المدرس رسمياً.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>الطلبات المعلقة ({pendingRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>سجل المعالجات ({historyRequests.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Info Bar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم المدرس، المادة، أو المحافظة..."
            className="w-full text-right pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
        </div>

        <div className="text-xs text-blue-900 font-bold bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>الموافقة تمنح المعلم الشارة الزرقاء ✅ وتفعل حسابه فوراً في محرك البحث</span>
        </div>
      </div>

      {/* 3. Requests List */}
      <div className="space-y-4">
        {displayedRequests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-400 space-y-2 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-gray-600">
              {activeTab === 'pending' ? 'لا توجد طلبات توثيق معلقة حالياً' : 'لا توجد سجلات مطابقة للبحث'}
            </p>
            <p className="text-xs text-gray-400">جميع طلبات المدرسين تم تدقيقها بالكامل</p>
          </div>
        ) : (
          displayedRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 hover:border-blue-300 rounded-3xl p-5 sm:p-6 shadow-xs transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                
                {/* Left (RTL Right): Teacher Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base font-black text-[#1E3A8A]">{request.teacherName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      {request.subject}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                      {request.stage}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      request.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      request.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'pending' ? '⏳ بانتظار الاعتماد' : request.status === 'approved' ? '✅ تم التوثيق' : '❌ تم الرفض'}
                    </span>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{request.governorate} — {request.area}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>📱 {request.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>خبرة {request.experienceYears} عاماً</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{request.submittedAt}</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-2xl leading-relaxed border border-gray-100">
                    {request.bio}
                  </p>

                  {/* Rejection / Action Note */}
                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-0.5">
                      <span className="font-bold">سبب الرفض المسجل:</span>
                      <p>{request.rejectionReason}</p>
                    </div>
                  )}

                  {request.actionedAt && (
                    <p className="text-[10px] text-gray-400">
                      تم الإجراء في {request.actionedAt} بواسطة {request.actionedBy || 'فريق الإدارة'}
                    </p>
                  )}
                </div>

                {/* Center / Right: Attached ID Card & Certificate Previews */}
                <div className="flex items-center gap-3 shrink-0">
                  
                  {/* National ID Card */}
                  <div
                    onClick={() => setPreviewImage({ url: request.idCardImageUrl, title: `بطاقة الرقم القومي — ${request.teacherName}` })}
                    className="group relative cursor-pointer border-2 border-gray-200 hover:border-blue-500 rounded-2xl overflow-hidden shadow-xs transition-all w-28 h-20 sm:w-36 sm:h-24 bg-gray-100 shrink-0"
                  >
                    <img
                      src={request.idCardImageUrl}
                      alt="National ID"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>تكبير البطاقة</span>
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      الرقم القومي
                    </div>
                  </div>

                  {/* Certificate if attached */}
                  {request.certificateImageUrl && (
                    <div
                      onClick={() => setPreviewImage({ url: request.certificateImageUrl!, title: `شهادة المؤهل — ${request.teacherName}` })}
                      className="group relative cursor-pointer border-2 border-gray-200 hover:border-blue-500 rounded-2xl overflow-hidden shadow-xs transition-all w-28 h-20 sm:w-36 sm:h-24 bg-gray-100 shrink-0"
                    >
                      <img
                        src={request.certificateImageUrl}
                        alt="Certificate"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>المؤهل</span>
                      </div>
                      <div className="absolute bottom-1 right-1 bg-blue-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                        الشهادة
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* Action Buttons for Pending items */}
              {request.status === 'pending' && (
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setRejectingRequest(request)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-300 hover:border-red-300 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>رفض الطلب ✗</span>
                  </button>

                  <button
                    onClick={() => onApproveRequest(request.id)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>توثيق الحساب وتفعيله ✓</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* =========================================================================
          MODAL: Reject Reason Modal
         ========================================================================= */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-red-200 text-right animate-scale-up"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <XCircle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-gray-900">رفض توثيق المعلم</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              يرجى تحديد سبب رفض توثيق حساب <strong className="text-gray-900 font-bold">{rejectingRequest.teacherName}</strong> (سيتم إرسال إشعار تليجرام/واتساب للمعلم لتصحيح المستندات):
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">سبب الرفض</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثال: صورة بطاقة الرقم القومي غير واضحة المعالم، يرجى رفع صورة واضحة لوجهي البطاقة..."
                rows={3}
                className="w-full text-right p-3 bg-gray-50 border border-gray-300 rounded-2xl text-xs focus:outline-none focus:border-red-500 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="submit"
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                تأكيد الرفض
              </button>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL: Image Fullscreen Preview
         ========================================================================= */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl text-right animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-sm font-black text-[#1E3A8A]">{previewImage.title}</h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center max-h-[70vh]">
              <img
                src={previewImage.url}
                alt="Full Preview"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
