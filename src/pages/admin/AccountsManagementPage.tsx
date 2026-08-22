import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Trash2,
  Award,
  MoreVertical,
  ChevronDown,
  Eye,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Phone,
  Calendar,
  Sparkles,
  UserCheck,
  UserX,
  X,
  Edit3,
  Camera,
  UploadCloud,
  Save,
  RefreshCw,
  Mail,
  GraduationCap,
  MapPin,
  BookOpen
} from 'lucide-react';
import { AdminUserAccount, AccountRole, AccountBadgeType } from '../../types';
import { AccountBadge } from '../../components/admin/AccountBadge';
import { getCleanAvatarUrl, optimizeProfileImage } from '../../lib/avatarHelper';
import { LocationSelector } from '../../components/common/LocationSelector';
import { dbUpdateAccountFullProfile } from '../../lib/adminFirestoreService';

interface AccountsManagementPageProps {
  accounts: AdminUserAccount[];
  onUpdateAccountBadge: (accountId: string, newBadge: AccountBadgeType) => void;
  onToggleAccountStatus: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
  onUpdateAccountFullProfile?: (accountId: string, updates: Partial<AdminUserAccount>) => Promise<void>;
}

export const AccountsManagementPage: React.FC<AccountsManagementPageProps> = ({
  accounts,
  onUpdateAccountBadge,
  onToggleAccountStatus,
  onDeleteAccount,
  onUpdateAccountFullProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AccountRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [badgeFilter, setBadgeFilter] = useState<'all' | AccountBadgeType>('all');

  // Modals state
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<AdminUserAccount | null>(null);
  const [badgeModalAccount, setBadgeModalAccount] = useState<AdminUserAccount | null>(null);
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<AdminUserAccount | null>(null);
  const [editModalAccount, setEditModalAccount] = useState<AdminUserAccount | null>(null);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<AccountRole | 'admin'>('student');
  const [editGovernorate, setEditGovernorate] = useState('القاهرة');
  const [editArea, setEditArea] = useState('مدينة نصر');
  const [editGrade, setEditGrade] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBadge, setEditBadge] = useState<AccountBadgeType>('none');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [isUploadingEditPhoto, setIsUploadingEditPhoto] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Open Edit Modal with initialized data
  const handleOpenEditModal = (account: AdminUserAccount) => {
    setEditModalAccount(account);
    setEditName(account.name || '');
    setEditPhone(account.phone || '');
    setEditEmail(account.email || '');
    setEditRole(account.role || 'student');
    setEditGovernorate(account.governorate || 'القاهرة');
    setEditArea(account.area || 'مدينة نصر');
    setEditGrade(account.grade || '');
    setEditSubject(account.subject || '');
    setEditBadge(account.badge || 'none');
    setEditStatus(account.status || 'active');
    setEditAvatarUrl(account.avatarUrl || '');
    setEditParentPhone(account.parentPhone || '');
    setEditMessage(null);
  };

  // Upload Photo inside Admin Edit Modal
  const handleEditPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEditPhoto(true);
    setEditMessage(null);

    try {
      const compressed = await optimizeProfileImage(file, 400);
      setEditAvatarUrl(compressed);
      setIsUploadingEditPhoto(false);
    } catch (err: any) {
      setIsUploadingEditPhoto(false);
      setEditMessage({ type: 'error', text: err.message || 'فشل معالجة الصورة.' });
    }
  };

  // Save Comprehensive Edit
  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalAccount) return;

    if (!editName.trim()) {
      setEditMessage({ type: 'error', text: 'الاسم مطلوب.' });
      return;
    }

    setIsSavingEdit(true);
    setEditMessage(null);

    const updates: Partial<AdminUserAccount> = {
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      role: editRole,
      governorate: editGovernorate,
      area: editArea,
      grade: editGrade.trim(),
      subject: editSubject.trim(),
      badge: editBadge,
      status: editStatus,
      avatarUrl: editAvatarUrl.trim(),
      parentPhone: editParentPhone.trim(),
    };

    try {
      if (onUpdateAccountFullProfile) {
        await onUpdateAccountFullProfile(editModalAccount.id, updates);
      } else {
        await dbUpdateAccountFullProfile(editModalAccount.id, updates);
      }

      setIsSavingEdit(false);
      setEditMessage({ type: 'success', text: 'تم تحديث بيانات الحساب بنجاح في قاعدة البيانات! ✅' });
      setTimeout(() => {
        setEditModalAccount(null);
      }, 1500);
    } catch (err: any) {
      setIsSavingEdit(false);
      setEditMessage({ type: 'error', text: err.message || 'فشل حفظ التعديلات.' });
    }
  };

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchSearch =
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.phone.includes(searchTerm) ||
        (acc.subject && acc.subject.includes(searchTerm)) ||
        (acc.email && acc.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === 'all' || acc.role === roleFilter;
      const matchStatus = statusFilter === 'all' || acc.status === statusFilter;
      const matchBadge = badgeFilter === 'all' || acc.badge === badgeFilter;

      return matchSearch && matchRole && matchStatus && matchBadge;
    });
  }, [accounts, searchTerm, roleFilter, statusFilter, badgeFilter]);

  return (
    <div className="space-y-6 text-right font-['Tajawal',sans-serif]">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            إدارة الحسابات وتعديل الملفات (Accounts Management) 👥
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            التحكم الشامل في حسابات الطلاب، أولياء الأمور، والمدرسين، وتعديل البروفايل والصور والشارات.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white px-3.5 py-2 rounded-2xl border border-gray-200 shadow-xs">
          <span>إجمالي الحسابات المسجلة:</span>
          <span className="text-[#2563EB] font-black">{accounts.length}</span>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، الموبايل، أو المادة..."
              className="w-full text-right pr-9 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full text-right px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="all">كل الرتب (طالب / مدرس / ولي أمر)</option>
              <option value="student">الطلاب فقط</option>
              <option value="teacher">المدرسين فقط</option>
              <option value="parent">أولياء الأمور فقط</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-right px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="all">كل الحالات (نشط / موقوف)</option>
              <option value="active">الحسابات النشطة فقط</option>
              <option value="suspended">الحسابات الموقوفة فقط</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
          </div>

          {/* Badge Filter */}
          <div className="relative">
            <select
              value={badgeFilter}
              onChange={(e) => setBadgeFilter(e.target.value as any)}
              className="w-full text-right px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="all">كل الشارات (Badge)</option>
              <option value="verified">موثّق رسمياً (Verified)</option>
              <option value="suspicious">مشتبه فيه (Suspicious)</option>
              <option value="fraudulent">محتال / خطر (Fraudulent)</option>
              <option value="none">بدون شارة</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
          </div>

        </div>

        {/* Active Filters count summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>نتائج البحث والتصفية: <strong className="text-gray-900">{filteredAccounts.length}</strong> حساب</span>
          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || badgeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
                setBadgeFilter('all');
              }}
              className="text-blue-600 hover:underline font-bold cursor-pointer"
            >
              إلغاء جميع الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* 3. Accounts Table */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                <th className="py-3.5 px-4">المستخدم</th>
                <th className="py-3.5 px-4">النوع</th>
                <th className="py-3.5 px-4">الموبايل</th>
                <th className="py-3.5 px-4">تاريخ الانضمام</th>
                <th className="py-3.5 px-4">الشارة (Badge)</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-bold">لم يتم العثور على أي حسابات مطابقة للبحث</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50/70 transition-colors">
                    
                    {/* User info with Clean Avatar */}
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={getCleanAvatarUrl(account.avatarUrl, account.role, account.name)}
                          alt={account.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-gray-200 shrink-0 bg-gray-50"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="hover:underline cursor-pointer" onClick={() => setSelectedAccountForDetail(account)}>
                            {account.name}
                          </p>
                          {account.subject && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              {account.subject} • {account.governorate || 'القاهرة'}
                            </span>
                          )}
                          {account.grade && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              {account.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        account.role === 'teacher' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        account.role === 'student' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {account.role === 'teacher' ? 'مدرس' : account.role === 'student' ? 'طالب' : account.role === 'parent' ? 'ولي أمر' : 'مشرف'}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono text-gray-700 font-medium dir-ltr text-right">
                      {account.phone || '—'}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                      {account.createdAt ? account.createdAt.substring(0, 10) : '—'}
                    </td>

                    {/* Badge Column with quick action */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setBadgeModalAccount(account)}
                        className="hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                        title="انقر لتعديل الشارة"
                      >
                        <AccountBadge badge={account.badge} />
                        <span className="text-[10px] text-blue-600 underline font-bold">تغيير</span>
                      </button>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onToggleAccountStatus(account.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                          account.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                        }`}
                        title="انقر لتبديل حالة الحساب"
                      >
                        {account.status === 'active' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>نشط</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>موقوف</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Edit Button (Comprehensive profile editor) */}
                        <button
                          onClick={() => handleOpenEditModal(account)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl transition-colors cursor-pointer"
                          title="تعديل شامل للبروفايل والبيانات"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setSelectedAccountForDetail(account)}
                          className="p-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-xl transition-colors cursor-pointer"
                          title="عرض بطاقة التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setBadgeModalAccount(account)}
                          className="p-1.5 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-800 rounded-xl transition-colors cursor-pointer"
                          title="تعديل الشارة (Badge)"
                        >
                          <Award className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmAccount(account)}
                          className="p-1.5 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 rounded-xl transition-colors cursor-pointer"
                          title="حذف الحساب نهائياً"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: Comprehensive Profile Editor for Admin
         ========================================================================= */}
      {editModalAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-200 text-right animate-scale-up my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1E3A8A]">تعديل شامل لبروفايل الحساب</h3>
                  <span className="text-[11px] text-gray-400 font-mono">UID: {editModalAccount.id}</span>
                </div>
              </div>
              <button
                onClick={() => setEditModalAccount(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editMessage && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                editMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {editMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span>{editMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveFullEdit} className="space-y-4 text-xs">
              
              {/* Photo Upload & Preview */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={getCleanAvatarUrl(editAvatarUrl, editRole, editName)}
                  alt="صورة المستخدم"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white ring-2 ring-blue-100 shadow-xs bg-white shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-2 w-full text-center sm:text-right">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="font-bold text-gray-800">صورة البروفايل</span>
                    {!editAvatarUrl && <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">الصورة الثابتة الافتراضية مفعلة</span>}
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isUploadingEditPhoto ? 'جاري المعالجة...' : 'تغيير الصورة'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditPhotoSelect}
                        disabled={isUploadingEditPhoto}
                        className="hidden"
                      />
                    </label>
                    {editAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditAvatarUrl('')}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        إلغاء واستعادة الصورة الثابتة
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Name */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">الاسم بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-right focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">رقم الموبايل *</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-left focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-left focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">نوع الرتبة / الحساب</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="student">طالب (Student)</option>
                    <option value="teacher">مدرس معتمد (Teacher)</option>
                    <option value="parent">ولي أمر (Parent)</option>
                    <option value="admin">مشرف إداري (Admin)</option>
                  </select>
                </div>

                {/* Subject (for teacher) or Grade (for student) */}
                {editRole === 'teacher' ? (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">مادة التدريس</label>
                    <input
                      type="text"
                      placeholder="مثال: فيزياء، كيمياء"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-right focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">الصف الدراسي</label>
                    <input
                      type="text"
                      placeholder="مثال: الصف الثالث الثانوي"
                      value={editGrade}
                      onChange={(e) => setEditGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-right focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Parent Phone for students */}
                {editRole === 'student' && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">رقم واتساب ولي الأمر</label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="010XXXXXXXX"
                      value={editParentPhone}
                      onChange={(e) => setEditParentPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-left focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Badge */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">شارة الحساب (Badge)</label>
                  <select
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value as AccountBadgeType)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="none">بدون شارة (عادي)</option>
                    <option value="verified">موثق رسمياً ✅ (Verified)</option>
                    <option value="suspicious">مشتبه فيه ⚠️ (Suspicious)</option>
                    <option value="fraudulent">محتال / خطر ⛔ (Fraudulent)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">حالة الحساب</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="active">نشط ويعمل (Active)</option>
                    <option value="suspended">موقوف إدارياً (Suspended)</option>
                  </select>
                </div>

              </div>

              {/* Location Selector */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">المحافظة والمنطقة السكنية</label>
                <LocationSelector
                  selectedGovernorate={editGovernorate}
                  selectedCity={editArea}
                  onSelectGovernorate={(gov) => setEditGovernorate(gov || 'القاهرة')}
                  onSelectCity={(city) => setEditArea(city)}
                  showCitySelect={true}
                  placeholder="اختر المحافظة والمدينة"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalAccount(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>حفظ التعديلات في Firestore</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: Account Detail View
         ========================================================================= */}
      {selectedAccountForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-200 text-right animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-[#1E3A8A]">تفاصيل الحساب الكاملة</h3>
              </div>
              <button
                onClick={() => setSelectedAccountForDetail(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <img
                  src={getCleanAvatarUrl(selectedAccountForDetail.avatarUrl, selectedAccountForDetail.role, selectedAccountForDetail.name)}
                  alt={selectedAccountForDetail.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-gray-300 bg-white"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-black text-[#1E3A8A]">{selectedAccountForDetail.name}</h4>
                  <p className="text-gray-500 font-mono mt-0.5">{selectedAccountForDetail.phone}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <AccountBadge badge={selectedAccountForDetail.badge} />
                    <span className="text-[10px] text-gray-400">ID: {selectedAccountForDetail.id}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 space-y-1">
                  <span className="text-gray-400 text-[10px]">نوع الحساب</span>
                  <p className="font-bold text-gray-800">
                    {selectedAccountForDetail.role === 'teacher' ? 'مدرس معتمد' : selectedAccountForDetail.role === 'student' ? 'طالب' : 'ولي أمر'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 space-y-1">
                  <span className="text-gray-400 text-[10px]">حالة الحساب</span>
                  <p className={`font-bold ${selectedAccountForDetail.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {selectedAccountForDetail.status === 'active' ? 'نشط ويعمل' : 'موقوف إدارياً'}
                  </p>
                </div>

                {selectedAccountForDetail.subject && (
                  <div className="p-3 rounded-xl bg-gray-50 space-y-1">
                    <span className="text-gray-400 text-[10px]">المادة والمرحلة</span>
                    <p className="font-bold text-gray-800">{selectedAccountForDetail.subject} ({selectedAccountForDetail.grade})</p>
                  </div>
                )}

                {selectedAccountForDetail.governorate && (
                  <div className="p-3 rounded-xl bg-gray-50 space-y-1">
                    <span className="text-gray-400 text-[10px]">المحافظة والمنطقة</span>
                    <p className="font-bold text-gray-800">{selectedAccountForDetail.governorate} - {selectedAccountForDetail.area}</p>
                  </div>
                )}

                {selectedAccountForDetail.studentsCount !== undefined && (
                  <div className="p-3 rounded-xl bg-gray-50 space-y-1">
                    <span className="text-gray-400 text-[10px]">عدد الطلاب الفعالين</span>
                    <p className="font-bold text-blue-600">{selectedAccountForDetail.studentsCount} طالب</p>
                  </div>
                )}

                {selectedAccountForDetail.qrCode && (
                  <div className="p-3 rounded-xl bg-gray-50 space-y-1 col-span-2">
                    <span className="text-gray-400 text-[10px]">رمز بطاقة الـ QR الذكية</span>
                    <p className="font-mono font-bold text-blue-600">{selectedAccountForDetail.qrCode}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  const acc = selectedAccountForDetail;
                  setSelectedAccountForDetail(null);
                  handleOpenEditModal(acc);
                }}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>تعديل هذا الحساب</span>
              </button>
              <button
                onClick={() => setSelectedAccountForDetail(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: Change Badge Modal (Verified, Suspicious, Fraudulent)
         ========================================================================= */}
      {badgeModalAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-200 text-right animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-[#1E3A8A]">تعديل شارة الحساب (Badge)</h3>
              </div>
              <button
                onClick={() => setBadgeModalAccount(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              اختر الشارة الرسمية التي تظهر بجانب حساب <strong className="text-gray-900 font-bold">{badgeModalAccount.name}</strong> على المنصة:
            </p>

            <div className="space-y-2.5">
              
              {/* Option 1: Verified */}
              <button
                onClick={() => {
                  onUpdateAccountBadge(badgeModalAccount.id, 'verified');
                  setBadgeModalAccount(null);
                }}
                className="w-full p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-right transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-emerald-900">موثّق رسمياً ✅ (Verified)</h5>
                    <p className="text-[10px] text-emerald-700">تم تدقيق بطاقة الرقم القومي وشهادات المؤهل بنجاح</p>
                  </div>
                </div>
              </button>

              {/* Option 2: Suspicious */}
              <button
                onClick={() => {
                  onUpdateAccountBadge(badgeModalAccount.id, 'suspicious');
                  setBadgeModalAccount(null);
                }}
                className="w-full p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-right transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-amber-900">مشتبه فيه ⚠️ (Suspicious)</h5>
                    <p className="text-[10px] text-amber-700">عليه بلاغات معلقة أو نشاط دفع غير منتظم خارج المنصة</p>
                  </div>
                </div>
              </button>

              {/* Option 3: Fraudulent */}
              <button
                onClick={() => {
                  onUpdateAccountBadge(badgeModalAccount.id, 'fraudulent');
                  setBadgeModalAccount(null);
                }}
                className="w-full p-3.5 rounded-2xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-right transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-red-900">محتال / منتحل صفة ⛔ (Fraudulent)</h5>
                    <p className="text-[10px] text-red-700">تم حظر الحساب ومنع استقبال الحجوزات نهائياً</p>
                  </div>
                </div>
              </button>

              {/* Option 4: None */}
              <button
                onClick={() => {
                  onUpdateAccountBadge(badgeModalAccount.id, 'none');
                  setBadgeModalAccount(null);
                }}
                className="w-full p-3.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-right transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-400 text-white flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-gray-800">حساب عادي (بدون شارة)</h5>
                    <p className="text-[10px] text-gray-500">حساب افتراضي قيد الاستخدام اليومي</p>
                  </div>
                </div>
              </button>

            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setBadgeModalAccount(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Delete Account Confirmation
         ========================================================================= */}
      {deleteConfirmAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-200 text-right animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h4 className="text-base font-black text-gray-900">حذف الحساب نهائياً؟</h4>
              <p className="text-xs text-gray-500 mt-1">
                أنت على وشك حذف حساب <strong className="text-gray-900">{deleteConfirmAccount.name}</strong>. لن يتمكن المستخدم من تسجيل الدخول مرة أخرى.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmAccount(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onDeleteAccount(deleteConfirmAccount.id);
                  setDeleteConfirmAccount(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
