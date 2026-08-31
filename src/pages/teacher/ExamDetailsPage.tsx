import React, { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Clock, Users, BookOpen, AlertCircle, Loader, CheckCircle2, XCircle, Edit2, Save } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

interface ExamDetail {
  id: string;
  name: string;
  date: string;
  duration: number;
  totalMarks: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'grading' | 'published';
  subject?: string;
  description?: string;
  teacherId: string;
}

interface Props {
  examId: string;
  onNavigate: (path: string) => void;
  onBack: () => void;
}

export const ExamDetailsPage: React.FC<Props> = ({ examId, onNavigate, onBack }) => {
  const { user } = useAuth();
  const uid = user?.uid || '';

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'distribution' | 'attendance' | 'grading'>('overview');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ExamDetail>>({});

  const loadExamDetails = async () => {
    if (!uid || !supabase || !examId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .eq('teacher_id', uid)
        .single();

      if (error) throw error;

      if (data) {
        const transformedExam: ExamDetail = {
          id: data.id,
          name: data.name,
          date: data.date,
          duration: data.duration,
          totalMarks: data.total_marks,
          status: data.status,
          subject: data.subject,
          description: data.description,
          teacherId: data.teacher_id,
        };
        setExam(transformedExam);
        setEditData(transformedExam);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setAlert({ type: 'error', text: 'فشل تحميل تفاصيل الامتحان' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExamDetails();
  }, [uid, examId]);

  const handleSaveChanges = async () => {
    if (!exam) return;

    try {
      const { error } = await supabase
        .from('exams')
        .update({
          name: editData.name,
          subject: editData.subject,
          description: editData.description,
          duration: editData.duration,
          total_marks: editData.totalMarks,
        })
        .eq('id', examId)
        .eq('teacher_id', uid);

      if (error) throw error;

      setExam(editData as ExamDetail);
      setIsEditing(false);
      setAlert({ type: 'success', text: 'تم حفظ التغييرات بنجاح' });
    } catch (error: any) {
      setAlert({ type: 'error', text: error.message || 'فشل حفظ التغييرات' });
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
      scheduled: { color: 'warning', label: 'مجدول' },
      in_progress: { color: 'primary', label: 'جاري الآن' },
      completed: { color: 'neutral', label: 'مكتمل' },
      grading: { color: 'warning', label: 'قيد التصحيح' },
      published: { color: 'success', label: 'منشور' },
    };
    return statusMap[status] || { color: 'neutral', label: status };
  };

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          العودة
        </Button>
        <Card className="p-8">
          <Skeleton height={32} width="40%" className="mb-4" />
          <Skeleton height={20} width="60%" className="mb-8" />
          <div className="space-y-3">
            <Skeleton height={20} width="100%" />
            <Skeleton height={20} width="100%" />
            <Skeleton height={20} width="80%" />
          </div>
        </Card>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="space-y-6" dir="rtl">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          العودة
        </Button>
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-danger-300 mx-auto mb-4" />
          <p className="text-neutral-600 font-semibold">الامتحان غير موجود</p>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(exam.status);

  return (
    <div className="space-y-6" dir="rtl">
      <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
        <ArrowRight className="w-5 h-5" />
        العودة
      </Button>

      {alert && (
        <div
          className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${
            alert.type === 'success'
              ? 'bg-success-50 border-success-200 text-success-900'
              : 'bg-danger-50 border-danger-200 text-danger-900'
          }`}
        >
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)}>
            <AlertCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      <Card className="border-l-4 border-primary-600">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="text-3xl font-black text-neutral-900 w-full mb-2 px-2 py-1 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <h1 className="text-3xl font-black text-neutral-900">{exam.name}</h1>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge color={statusInfo.color} size="md">
                {statusInfo.label}
              </Badge>
              {exam.subject && (
                <span className="text-sm text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
                  {exam.subject}
                </span>
              )}
            </div>
          </div>
          {!isEditing && (
            <Button variant="secondary" onClick={() => setIsEditing(true)} size="sm" className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              تعديل
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-200">
          <div>
            <p className="text-xs text-neutral-600 font-semibold">التاريخ</p>
            <p className="text-sm font-bold text-neutral-900 mt-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(exam.date).toLocaleDateString('ar-EG')}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-600 font-semibold">الوقت</p>
            <p className="text-sm font-bold text-neutral-900 mt-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(exam.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-600 font-semibold">المدة</p>
            <p className="text-sm font-bold text-neutral-900 mt-1">{exam.duration} دقيقة</p>
          </div>
          <div>
            <p className="text-xs text-neutral-600 font-semibold">الدرجات</p>
            <p className="text-sm font-bold text-neutral-900 mt-1">{exam.totalMarks}</p>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 space-y-4 pt-6 border-t border-neutral-200">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">الوصف</label>
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleSaveChanges} className="flex-1 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                حفظ التغييرات
              </Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-4 border-b border-neutral-200">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'distribution', label: 'التوزيع', icon: <Users className="w-4 h-4" /> },
          { id: 'attendance', label: 'الحضور', icon: <CheckCircle2 className="w-4 h-4" /> },
          { id: 'grading', label: 'التصحيح', icon: <Edit2 className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <Card>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">نظرة عامة</h2>
          <div className="space-y-4">
            {exam.description ? (
              <div>
                <h3 className="font-semibold text-neutral-900 mb-2">الوصف</h3>
                <p className="text-neutral-600 leading-relaxed">{exam.description}</p>
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">لا يوجد وصف للامتحان</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              <StatBox label="إجمالي الطلاب" value="0" icon={<Users className="w-5 h-5" />} />
              <StatBox label="الحاضرون" value="0" icon={<CheckCircle2 className="w-5 h-5" />} />
              <StatBox label="الغائبون" value="0" icon={<XCircle className="w-5 h-5" />} />
              <StatBox label="المصححة" value="0" />
              <StatBox label="المتبقية" value="0" />
              <StatBox label="متوسط الدرجات" value="0" />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'distribution' && (
        <Card>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">توزيع الطلاب</h2>
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-semibold mb-4">
              اختر المجموعات والفترات الزمنية لتوزيع الطلاب على الامتحان
            </p>
            <Button variant="primary" size="lg" className="flex items-center gap-2 mx-auto">
              <Users className="w-5 h-5" />
              بدء التوزيع الذكي
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'attendance' && (
        <Card>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">حضور الامتحان</h2>
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-semibold mb-4">
              لا يوجد بيانات حضور حتى الآن
            </p>
            {exam.status === 'in_progress' && (
              <Button variant="primary" size="lg" className="flex items-center gap-2 mx-auto">
                <Loader className="w-5 h-5" />
                تسجيل الحضور
              </Button>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'grading' && (
        <Card>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">التصحيح والدرجات</h2>
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-semibold mb-4">
              لا توجد امتحانات قيد التصحيح حالياً
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string | number; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4 text-center">
    {icon && <div className="text-primary-600 mb-2 flex justify-center">{icon}</div>}
    <p className="text-2xl font-black text-neutral-900">{value}</p>
    <p className="text-xs text-neutral-600 font-semibold mt-1">{label}</p>
  </div>
);
