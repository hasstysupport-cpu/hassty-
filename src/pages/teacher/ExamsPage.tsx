import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Calendar, Clock, Users, BookOpen, CheckCircle2, AlertCircle, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

interface Exam {
  id: string;
  name: string;
  date: string;
  duration: number;
  totalMarks: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'grading' | 'published';
  studentCount: number;
  gradedCount: number;
  subject?: string;
  description?: string;
  createdAt: string;
}

interface Props {
  onNavigate: (path: string) => void;
}

export const ExamsPage: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const uid = user?.uid || '';
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    duration: 60,
    totalMarks: 100,
    subject: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadExams = async () => {
    if (!uid || !supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          id,
          name,
          date,
          duration,
          total_marks,
          status,
          subject,
          description,
          created_at,
          teacher_id
        `)
        .eq('teacher_id', uid)
        .order('date', { ascending: false });

      if (examsError) {
        console.error('Error loading exams:', examsError);
        setAlert({ type: 'error', text: 'فشل تحميل الامتحانات' });
        setLoading(false);
        return;
      }

      if (examsData && examsData.length > 0) {
        const transformedExams = await Promise.all(
          examsData.map(async (exam: any) => {
            const { count: studentCount } = await supabase
              .from('exam_attendance')
              .select('id', { count: 'exact', head: true })
              .eq('exam_id', exam.id);

            const { count: gradedCount } = await supabase
              .from('exam_grades')
              .select('id', { count: 'exact', head: true })
              .eq('exam_id', exam.id);

            return {
              id: exam.id,
              name: exam.name,
              date: exam.date,
              duration: exam.duration,
              totalMarks: exam.total_marks,
              status: exam.status,
              subject: exam.subject,
              description: exam.description,
              createdAt: exam.created_at,
              studentCount: studentCount || 0,
              gradedCount: gradedCount || 0,
            };
          })
        );
        setExams(transformedExams);
      } else {
        setExams([]);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setAlert({ type: 'error', text: error.message || 'حدث خطأ أثناء تحميل الامتحانات' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExams();
  }, [uid]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !supabase) return;

    if (!formData.name || !formData.date) {
      setAlert({ type: 'error', text: 'الرجاء ملء جميع الحقول المطلوبة' });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert({
          teacher_id: uid,
          name: formData.name,
          date: formData.date,
          duration: formData.duration,
          total_marks: formData.totalMarks,
          subject: formData.subject,
          description: formData.description,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;

      setAlert({ type: 'success', text: 'تم إنشاء الامتحان بنجاح' });
      setShowCreateModal(false);
      setFormData({
        name: '',
        date: '',
        duration: 60,
        totalMarks: 100,
        subject: '',
        description: '',
      });
      await loadExams();
    } catch (error: any) {
      setAlert({ type: 'error', text: error.message || 'فشل إنشاء الامتحان' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('هل تريد حذف هذا الامتحان بالفعل؟')) return;

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId)
        .eq('teacher_id', uid);

      if (error) throw error;

      setAlert({ type: 'success', text: 'تم حذف الامتحان بنجاح' });
      await loadExams();
    } catch (error: any) {
      setAlert({ type: 'error', text: error.message || 'فشل حذف الامتحان' });
    }
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exam.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'warning';
      case 'in_progress':
        return 'primary';
      case 'grading':
        return 'warning';
      case 'completed':
        return 'neutral';
      case 'published':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'مجدول';
      case 'in_progress':
        return 'جاري';
      case 'grading':
        return 'تصحيح';
      case 'completed':
        return 'مكتمل';
      case 'published':
        return 'منشور';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">الامتحانات</h1>
          <p className="text-neutral-600 text-sm mt-1">إدارة والتحكم في الامتحانات والتقييمات</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          امتحان جديد
        </Button>
      </div>

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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-neutral-900">امتحان جديد</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1">
                  اسم الامتحان *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: امتحان الفصل الأول"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1">
                  المادة
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="الرياضيات"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1">
                  تاريخ الامتحان *
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1">
                    المدة (دقيقة)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1">
                    إجمالي الدرجات
                  </label>
                  <input
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف الامتحان والمنهج المغطى..."
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={creating}
                  isLoading={creating}
                  className="flex-1"
                >
                  إنشاء
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="ابحث عن امتحان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">جميع الحالات</option>
          <option value="scheduled">مجدول</option>
          <option value="in_progress">جاري</option>
          <option value="grading">تصحيح</option>
          <option value="completed">مكتمل</option>
          <option value="published">منشور</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton height={24} width="60%" />
                <Skeleton height={20} width="40%" />
                <Skeleton height={16} width="30%" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600 font-semibold mb-4">
            {searchQuery ? 'لا توجد امتحانات تطابق البحث' : 'لا توجد امتحانات حتى الآن'}
          </p>
          {!searchQuery && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              إنشاء امتحان أول
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredExams.map((exam) => (
            <Card key={exam.id} variant="default" className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-neutral-900">{exam.name}</h3>
                    {exam.subject && (
                      <p className="text-sm text-neutral-600 mt-1">{exam.subject}</p>
                    )}
                  </div>
                  <Badge color={getStatusColor(exam.status) as any} size="sm">
                    {getStatusLabel(exam.status)}
                  </Badge>
                </div>

                <div className="space-y-2 my-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(exam.date).toLocaleDateString('ar-EG')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Clock className="w-4 h-4" />
                    {exam.duration} دقيقة
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Users className="w-4 h-4" />
                    {exam.studentCount} طالب
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {exam.gradedCount}/{exam.studentCount} مصحح
                  </div>
                </div>

                {exam.description && (
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{exam.description}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-200">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate(`/teacher/exams/${exam.id}`)}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  عرض
                </Button>
                {exam.status === 'scheduled' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteExam(exam.id)}
                    className="flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
