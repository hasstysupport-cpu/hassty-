import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  HelpCircle,
  RefreshCw,
  Users,
  Clock
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

export const ParentAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const parentId = user?.uid || '';
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals for Dispute & Makeup Session
  const [disputeRecord, setDisputeRecord] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState('عطل فني في ماسح السنتر');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  const [makeupRecord, setMakeupRecord] = useState<any | null>(null);
  const [makeupGroup, setMakeupGroup] = useState('مجموعة الأحد والأربعاء 04:30 م');
  const [makeupSuccess, setMakeupSuccess] = useState(false);

  // Load linked children
  const loadChildren = useCallback(async () => {
    if (!supabase || !parentId) {
      setLoading(false);
      return;
    }
    setRefreshing(true);
    try {
      const { data: links, error: lerr } = await supabase
        .from('parent_children')
        .select('id,child_id,child_name,child_qr_code')
        .eq('parent_id', parentId);
      if (lerr) throw lerr;

      const childIds = (links || []).map((x: any) => x.child_id);
      let profs: any[] = [];
      if (childIds.length > 0) {
        const { data: pData } = await supabase.from('profiles').select('id,full_name,grade,qr_code').in('id', childIds);
        profs = pData || [];
      }
      const pmap = new Map(profs.map(p => [p.id, p]));

      const mapped = (links || []).map((x: any) => {
        const p = pmap.get(x.child_id) || {};
        return {
          id: x.child_id,
          name: p.full_name || x.child_name || 'الطالب',
          grade: p.grade || 'غير محدد',
          qrCode: p.qr_code || x.child_qr_code || '',
        };
      });

      setChildren(mapped);
      if (mapped.length > 0 && !selectedChildId) {
        setSelectedChildId(mapped[0].id);
      }
    } catch (e: any) {
      console.warn('Error loading children:', e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [parentId, selectedChildId]);

  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);

  // Load attendance records for current child
  const loadRecords = useCallback(async () => {
    if (!supabase || !selectedChildId) {
      setRecords([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', selectedChildId)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(100);
      if (error) throw error;
      setRecords(data || []);
    } catch (e: any) {
      console.warn('Error loading attendance records:', e);
    }
  }, [selectedChildId]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const currentChild = children.find((c) => c.id === selectedChildId) || children[0] || {
    id: '',
    name: 'الطالب',
    grade: '',
  };

  const stats = useMemo(() => {
    const total = records.length;
    const presentOnTime = records.filter(r => r.status === 'present').length;
    const presentLate = records.filter(r => r.status === 'late').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const attendanceRate = total > 0 ? Math.round(((presentOnTime + presentLate) / total) * 100) : 100;
    return { total, presentOnTime, presentLate, absentCount, attendanceRate };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (filterStatus !== 'all' && rec.status !== filterStatus) return false;
      return true;
    });
  }, [records, filterStatus]);

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !disputeRecord) return;
    try {
      await supabase.from('attendance_disputes').insert({
        attendance_id: disputeRecord.id,
        parent_id: parentId,
        student_id: selectedChildId,
        reason: disputeReason,
        notes: disputeNotes,
        status: 'pending',
      });
      setDisputeSuccess(true);
      setTimeout(() => {
        setDisputeSuccess(false);
        setDisputeRecord(null);
        setDisputeNotes('');
      }, 2000);
    } catch (err) {
      console.warn('Dispute error:', err);
    }
  };

  const handleMakeupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !makeupRecord) return;
    try {
      await supabase.from('makeup_requests').insert({
        attendance_id: makeupRecord.id,
        parent_id: parentId,
        student_id: selectedChildId,
        target_group: makeupGroup,
        status: 'pending',
      });
      setMakeupSuccess(true);
      setTimeout(() => {
        setMakeupSuccess(false);
        setMakeupRecord(null);
      }, 2000);
    } catch (err) {
      console.warn('Makeup error:', err);
    }
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
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
            توثيق إلكتروني دقيق بالدقيقة ومسح رمز QR للحصص.
          </p>
        </div>

        {/* Child Switcher */}
        {children.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChildId(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  c.id === selectedChildId
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => { void loadChildren(); void loadRecords(); }}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">نسبة الالتزام الكلية</span>
          <p className="text-2xl font-black text-[#10B981]">{stats.attendanceRate}%</p>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#10B981] h-full rounded-full" style={{ width: `${stats.attendanceRate}%` }} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">حاضر بالموعد</span>
          <p className="text-2xl font-black text-[#10B981]">{stats.presentOnTime} حصة</p>
          <span className="text-[11px] text-emerald-700 font-bold">أخضر ✅</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">حاضر متأخر</span>
          <p className="text-2xl font-black text-amber-600">{stats.presentLate} حصص</p>
          <span className="text-[11px] text-amber-700 font-bold">برتقالي ⏰</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold text-[#6B7280]">مرات الغياب المسجلة</span>
          <p className="text-2xl font-black text-[#EF4444]">{stats.absentCount} حصة</p>
          <span className="text-[11px] text-red-600 font-bold">متاح طلب تعويض</span>
        </div>
      </div>

      {/* Filterable Table */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-[#1E3A8A]">سجل الحصص التفصيلي</h3>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1F2937] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="all">كل الحالات ({records.length})</option>
              <option value="present">حاضر فقط</option>
              <option value="late">متأخر فقط</option>
              <option value="absent">غائب فقط</option>
            </select>
          </div>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[#6B7280] font-bold">
                  <th className="py-3 px-3">التاريخ والوقت</th>
                  <th className="py-3 px-3">الطالب</th>
                  <th className="py-3 px-3">حالة الحضور</th>
                  <th className="py-3 px-3">الملاحظات</th>
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
                      <div className="font-bold text-[#1E3A8A]">{rec.student_name || currentChild.name}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      {rec.status === 'present' ? (
                        <Badge variant="success" size="sm">حاضر في الموعد ✅</Badge>
                      ) : rec.status === 'late' ? (
                        <Badge variant="warning" size="sm">متأخر ({rec.late_minutes || 0} د) ⏰</Badge>
                      ) : (
                        <Badge variant="danger" size="sm">غائب ❌</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-3 max-w-xs">
                      {rec.notes ? (
                        <span className="text-[11px] text-[#1E3A8A] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 block">
                          {rec.notes}
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
        ) : (
          <div className="text-center py-12 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-600">لا توجد حصص مسجلة في هذا السجل حالياً</p>
            <p className="text-[11px] text-gray-400">سيتم تسجيل الحضور تلقائياً فور مسح كود الطالب بالسنتر</p>
          </div>
        )}
      </div>

      {/* MODAL: Dispute Attendance Record */}
      <Modal
        isOpen={Boolean(disputeRecord)}
        onClose={() => setDisputeRecord(null)}
        title="تقديم تظلم على تسجيل الحضور"
        subtitle={disputeRecord ? `حصة بتاريخ (${disputeRecord.date})` : ''}
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
        subtitle={makeupRecord ? `تعويض غياب حصة بتاريخ ${makeupRecord.date}` : ''}
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
              يحق للطالب طلب حصة تعويضية عند وجود عذر مقبول، دون أي رسوم إضافية.
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
