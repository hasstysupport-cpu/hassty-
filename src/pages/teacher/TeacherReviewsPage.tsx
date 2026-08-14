import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  ThumbsUp,
  X,
  Send,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { SAMPLE_REVIEWS } from '../../data/mockData';
import { ReviewItem } from '../../types';
import { Badge } from '../../components/common/Badge';

export const TeacherReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>(SAMPLE_REVIEWS);
  const [activeReplyReviewId, setActiveReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);

  const handleSendReply = (reviewId: string) => {
    if (!replyText) return;

    setReviews(
      reviews.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            reply: {
              author: 'أ. حسام إبراهيم',
              content: replyText,
              date: 'اليوم',
            },
          };
        }
        return r;
      })
    );

    setReplySuccess(true);
    setTimeout(() => {
      setReplySuccess(false);
      setActiveReplyReviewId(null);
      setReplyText('');
    }, 1500);
  };

  return (
    <div className="space-y-8 text-right max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
          <Star className="w-3.5 h-3.5" />
          <span>آراء وتقييمات الطلاب</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
          تقييمات الطلاب وأولياء الأمور الموثقين
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          جميع التقييمات صادرة حصرياً من طلاب حضروا معك بالفعل وسجلوا حضورهم عبر نظام الـ QR
        </p>
      </div>

      {/* Rating Breakdown Header Box */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
        
        {/* Left Column: Overall Score */}
        <div className="text-center sm:text-right space-y-2">
          <span className="text-4xl sm:text-5xl font-black text-[#1E3A8A]">4.9</span>
          <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-xs text-[#6B7280]">بناءً على 128 تقييم موثق</p>
        </div>

        {/* Right 2 Columns: Bars */}
        <div className="sm:col-span-2 space-y-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-12 font-bold text-[#1E3A8A]">5 نجوم</span>
            <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '92%' }} />
            </div>
            <span className="w-8 font-mono text-gray-500 text-left">92%</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-12 font-bold text-[#1E3A8A]">4 نجوم</span>
            <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '6%' }} />
            </div>
            <span className="w-8 font-mono text-gray-500 text-left">6%</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-12 font-bold text-[#1E3A8A]">3 نجوم</span>
            <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '2%' }} />
            </div>
            <span className="w-8 font-mono text-gray-500 text-left">2%</span>
          </div>
        </div>

      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[#1E3A8A]">أحدث التقييمات</h3>

        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.studentAvatar}
                    alt={rev.studentName}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#1E3A8A]">{rev.studentName}</h4>
                      {rev.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                          <span>طالب موثق بالحضور</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400">{rev.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-[#4B5563] leading-relaxed bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                "{rev.comment}"
              </p>

              {/* Teacher Reply Section */}
              {rev.reply ? (
                <div className="bg-[#EFF6FF] border border-blue-200 rounded-2xl p-4 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2563EB]">{rev.reply.author} (رد المعلم):</span>
                    <span className="text-[10px] text-gray-400">{rev.reply.date}</span>
                  </div>
                  <p className="text-[#1E3A8A]">{rev.reply.content}</p>
                </div>
              ) : activeReplyReviewId === rev.id ? (
                <div className="bg-gray-50 border border-[#E5E7EB] rounded-2xl p-4 space-y-3 animate-fadeIn">
                  <h5 className="text-xs font-bold text-[#1E3A8A]">كتابة رد عام على الطالب:</h5>
                  <textarea
                    rows={2}
                    placeholder="شكراً لك يا بطل، بالتوفيق دائماً..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-right focus:outline-none focus:border-[#2563EB]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setActiveReplyReviewId(null)}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded-lg cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={() => handleSendReply(rev.id)}
                      className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 rotate-180" />
                      <span>نشر الرد</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setActiveReplyReviewId(rev.id);
                      setReplyText('');
                    }}
                    className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>الرد على التقييم</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
