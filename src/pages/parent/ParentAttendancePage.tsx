import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Filter,
  Users,
  Clock,
  MapPin,
  FileText,
  AlertTriangle,
  RotateCcw,
  X,
  Send,
  HelpCircle,
  Database
} from 'lucide-react';
import { MOCK_ATTENDANCE_RECORDS, MOCK_PARENT_CHILDREN } from '../../data/mockData';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { dbService } from '../../lib/supabaseService';
import { isSupabaseConfigured } from '../../lib/supabase';

export const ParentAttendancePage: React.FC = () => {
  const [selectedChildId, setSelectedChildId] = useState(MOCK_PARENT_CHILDREN[0].id);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [realRecords, setRealRecords] = useState<any[]>(MOCK_ATTENDANCE_RECORDS);
  
  // Modals for Dispute & Makeup Session
  const [disputeRecord, setDisputeRecord] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState('عطل فني في ماسح السنتر');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  const [makeupRecord, setMakeupRecord] = useState<any | null>(null);
  const [makeupGroup, setMakeupGroup] = useState('مجموعة الأحد والأربعاء 04:30 م');
  const [makeupSuccess, setMakeupSuccess] = useState(false);

  const currentChild = MOCK_PARENT_CHILDREN.find((c) => c.id === selectedChildId) || MOCK_PARENT_CHILDREN[0];

  // Fetch real records from Supabase if configured
  useEffect(() => {
    async function loadRealData() {
      if (isSupabaseConfigured) {
        const liveData = await dbService.getAttendanceRecords();
        if (liveData && liveData.length > 0) {
          setRealRecords([...liveData, ...MOCK_ATTENDANCE_RECORDS]);
        }
      }
    }
    loadRealData();
  }, [selectedChildId]);

  const filteredRecords = realRecords.filter((rec) => {
    if (filterSubject !== 'all' && rec.subject !== filterSubject) return false;
    if (filterStatus !== 'all' && rec.status !== filterStatus) return false;
    return true;
  });

  const presentCount = MOCK_ATTENDANCE_RECORDS.filter((r) => r.status === 'present').length;
  const absentCount = MOCK_ATTENDANCE_RECORDS.filter((r) => r.status === 'absent').length;

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeSuccess(true);
    setTimeout(() => {
      setDisputeSuccess(false);
      setDisputeRecord(null);
    }, 2000);
  };

  const handleMakeupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMakeupSuccess(true);
    setTimeout(() => {
      setMakeupSuccess(false);
      setMakeupRecord(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 text-right">
      
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200 mb-2">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>سجل الحضور والغياب الموثق</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            سجل حضور وغياب الطالب ({currentChild.name})
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            توثيق إلكتروني دقيق بالدقيقة ونافذة الحضور وموقع السنتر لكل حصة
          </p>
        </div>

        {/* Child Switcher */}
        <div className="flex items-center gap-2">
          {MOCK_PARENT_CHILDREN.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChildId(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                c.id === currentChild.id
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Stats Cards with Time Window */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">نسبة الالتزام الكلية</span>
          <p className="text-2xl font-black text-[#10B981]">{currentChild.attendanceRate}%</p>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#10B981] h-full rounded-full" style={{ width: `${currentChild.attendanceRate}%` }} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">حاضر بالموعد (0-15 د)</span>
          <p className="text-2xl font-black text-[#10B981]">{currentChild.presentOnTime} حصة</p>
          <span className="text-[11px] text-emerald-700 font-bold">أخضر ✅</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">حاضر متأخر (15-50%)</span>
          <p className="text-2xl font-black text-amber-600">{currentChild.presentLate} حصص</p>
          <span className="text-[11px] text-amber-700 font-bold">برتقالي ⏰</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">مرات الغياب المسجلة</span>
          <p className="text-2xl font-black text-[#EF4444]">{currentChild.absentCount} حصة</p>
          <span className="text-[11px] text-red-600 font-bold">متاح طلب تعويض</span>
        </div>
      </div>

      {/* Filterable Table */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-[#1E3A8A]">سجل الحصص التفصيلي وملاحظات المعلمين</h3>

          <div className="flex items-center gap-2">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="all">كل المواد</option>
              <option value="كيمياء">كيمياء</option>
              <option value="فيزياء">فيزياء</option>
              <option value="لغة عربية">لغة عربية</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="present">حاضر فقط</option>
              <option value="absent">غائب فقط</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-[#6B7280] font-bold">
                <th className="py-3 px-3">التاريخ والوقت</th>
                <th className="py-3 px-3">المادة والمعلم</th>
                <th className="py-3 px-3">السنتر / المقر</th>
                <th className="py-3 px-3">حالة الحضور والنافذة</th>
                <th className="py-3 px-3">ملاحظات وواجب المعلم</th>
                <th className="py-3 px-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-[#1F2937]">{rec.date}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{rec.time}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-[#1E3A8A]">{rec.subject}</div>
                    <div className="text-[11px] text-[#6B7280]">{rec.tutorName}</div>
                  </td>
                  <td className="py-3.5 px-3 text-[#4B5563]">
                    {rec.center}
                  </td>
                  <td className="py-3.5 px-3">
                    {rec.status === 'present' ? (
                      rec.timeWindowStatus === 'late' ? (
                        <Badge variant="warning" size="sm">حاضر متأخر ⏰</Badge>
                      ) : (
                        <Badge variant="success" size="sm">حاضر في الموعد ✅</Badge>
                      )
                    ) : (
                      <Badge variant="danger" size="sm">غائب ❌</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-3 max-w-xs">
                    {rec.teacherNotes ? (
                      <span className="text-[11px] text-[#1E3A8A] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 block">
                        {rec.teacherNotes}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {rec.status === 'absent' ? (
                        <button
                          onClick={() => setMakeupRecord(rec)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          طلب تعويض
                        </button>
                      ) : (
                        <button
                          onClick={() => setDisputeRecord(rec)}
                          className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          تظلم حضور
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL: Dispute Attendance Record */}
      <Modal
        isOpen={Boolean(disputeRecord)}
        onClose={() => setDisputeRecord(null)}
        title="تقديم تظلم على تسجيل الحضور"
        subtitle={disputeRecord ? `حصة ${disputeRecord.subject} (${disputeRecord.date})` : ''}
        icon={<HelpCircle className="w-6 h-6 text-amber-600" />}
        maxWidth="md"
      >
        {disputeSuccess ? (
          <div className="py-6 text-center text-xs text-emerald-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold">تم إرسال طلب التظلم للمعلم وإدارة السنتر للمراجعة!</p>
          </div>
        ) : (
          <form onSubmit={handleDisputeSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                سبب التظلم
              </label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              >
                <option value="عطل فني في ماسح السنتر">عطل فني في ماسح السنتر</option>
                <option value="الطالب حضر بالموعد ولكن الكود لم يُسجل">الطالب حضر بالموعد ولكن الكود لم يُسجل</option>
                <option value="تسجيل تأخير غير صحيح">تسجيل تأخير غير صحيح</option>
                <option value="أخرى">سبب آخر</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                ملاحظات إضافية
              </label>
              <textarea
                rows={3}
                placeholder="اكتب توضيحك..."
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              إرسال التظلم
            </button>
          </form>
        )}
      </Modal>

      {/* MODAL: Request Compensatory Session (Make-up) */}
      <Modal
        isOpen={Boolean(makeupRecord)}
        onClose={() => setMakeupRecord(null)}
        title="طلب حصة تعويضية"
        subtitle={makeupRecord ? `تعويض غياب حصة ${makeupRecord.subject} مع ${makeupRecord.tutorName}` : ''}
        icon={<RotateCcw className="w-6 h-6 text-[#2563EB]" />}
        maxWidth="md"
      >
        {makeupSuccess ? (
          <div className="py-6 text-center text-xs text-emerald-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold">تم إرسال طلب الحصة التعويضية للمعلم لاعتماده!</p>
          </div>
        ) : (
          <form onSubmit={handleMakeupSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] mb-1">
                اختر المجموعة البديلة لحضور الحصة التعويضية
              </label>
              <select
                value={makeupGroup}
                onChange={(e) => setMakeupGroup(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-right focus:bg-white focus:outline-none focus:border-[#2563EB]"
              >
                <option value="مجموعة الأحد والأربعاء 04:30 م (سنتر الأهرام)">
                  مجموعة الأحد والأربعاء 04:30 م (سنتر الأهرام)
                </option>
                <option value="مجموعة الجمعة 10:00 ص (سنتر النور)">
                  مجموعة الجمعة 10:00 ص (سنتر النور)
                </option>
                <option value="حصة أونلاين مسجلة عبر المنصة">
                  حصة أونلاين مسجلة عبر المنصة
                </option>
              </select>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
              يحق للطالب طلب حصة تعويضية واحدة شهرياً عند وجود عذر مقبول، دون أي رسوم إضافية.
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              تأكيد طلب التعويض
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
};
