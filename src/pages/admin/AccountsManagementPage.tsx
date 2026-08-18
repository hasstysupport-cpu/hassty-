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
  XCircle,
  CheckCircle2,
  Phone,
  Calendar,
  Sparkles,
  UserCheck,
  UserX,
  X
} from 'lucide-react';
import { AdminUserAccount, AccountRole, AccountBadgeType } from '../../types';
import { AccountBadge } from '../../components/admin/AccountBadge';

interface AccountsManagementPageProps {
  accounts: AdminUserAccount[];
  onUpdateAccountBadge: (accountId: string, newBadge: AccountBadgeType) => void;
  onToggleAccountStatus: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
}

export const AccountsManagementPage: React.FC<AccountsManagementPageProps> = ({
  accounts,
  onUpdateAccountBadge,
  onToggleAccountStatus,
  onDeleteAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AccountRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [badgeFilter, setBadgeFilter] = useState<'all' | AccountBadgeType>('all');

  // Modals state
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<AdminUserAccount | null>(null);
  const [badgeModalAccount, setBadgeModalAccount] = useState<AdminUserAccount | null>(null);
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<AdminUserAccount | null>(null);

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
            إدارة الحسابات والمستخدمين (Accounts Management) 👥
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            التحكم الشامل في حسابات الطلاب، أولياء الأمور، والمدرسين ومنح شارات الثقة (Verified/Scam Badges).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white px-3.5 py-2 rounded-2xl border border-gray-200 shadow-xs">
          <span>إجمالي الحسابات:</span>
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
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full text-right px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">كل أنواع الحسابات</option>
              <option value="teacher">مدرسين (Teachers)</option>
              <option value="student">طلاب (Students)</option>
              <option value="parent">أولياء أمور (Parents)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-right px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">كل الحالات (نشط/موقوف)</option>
              <option value="active">الحسابات النشطة فقط</option>
              <option value="suspended">الحسابات الموقوفة</option>
            </select>
          </div>

          {/* Badge Filter */}
          <div>
            <select
              value={badgeFilter}
              onChange={(e) => setBadgeFilter(e.target.value as any)}
              className="w-full text-right px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">كل الشارات</option>
              <option value="verified">موثّق ✅ (Verified)</option>
              <option value="suspicious">مشتبه فيه ⚠️ (Suspicious)</option>
              <option value="fraudulent">احتيالي ❌ (Fraudulent)</option>
              <option value="none">بدون شارة</option>
            </select>
          </div>

        </div>
      </div>

      {/* 3. Accounts Table */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">الاسم والحساب</th>
                <th className="py-3.5 px-4">النوع (Role)</th>
                <th className="py-3.5 px-4">رقم الموبايل</th>
                <th className="py-3.5 px-4">تاريخ التسجيل</th>
                <th className="py-3.5 px-4">الشارة (Badge)</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    لا توجد حسابات تطابق خيارات البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-blue-50/30 transition-colors">
                    
                    {/* Name + Avatar */}
                    <td className="py-3.5 px-4 font-bold text-[#1E3A8A]">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={account.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={account.name}
                          className="w-8 h-8 rounded-xl object-cover border border-gray-200"
                        />
                        <div>
                          <p className="hover:underline cursor-pointer" onClick={() => setSelectedAccountForDetail(account)}>
                            {account.name}
                          </p>
                          {account.subject && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              {account.subject} • {account.governorate}
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
                        {account.role === 'teacher' ? 'مدرس' : account.role === 'student' ? 'طالب' : 'ولي أمر'}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono text-gray-700 font-medium dir-ltr text-right">
                      {account.phone}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                      {account.createdAt}
                    </td>

                    {/* Badge Column with quick action */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setBadgeModalAccount(account)}
                        className="hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                        title="انقر لتعديل الشارة"
                      >
                        <AccountBadge badge={account.badge} />
                        <span className="text-[10px] text-blue-600 underline font-bold">تعديل</span>
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
                        
                        <button
                          onClick={() => setSelectedAccountForDetail(account)}
                          className="p-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-xl transition-colors cursor-pointer"
                          title="عرض التفاصيل"
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
                          title="حذف الحساب"
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
                  src={selectedAccountForDetail.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={selectedAccountForDetail.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-gray-300"
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
                    <h5 className="text-xs font-black text-red-900">احتيالي ومخالف ❌ (Scam/Fraudulent)</h5>
                    <p className="text-[10px] text-red-700">حساب احتيالي مخالف لشروط وأمان الطلاب (تحذير علني)</p>
                  </div>
                </div>
              </button>

              {/* Option 4: None */}
              <button
                onClick={() => {
                  onUpdateAccountBadge(badgeModalAccount.id, 'none');
                  setBadgeModalAccount(null);
                }}
                className="w-full p-3 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-right transition-all flex items-center justify-between cursor-pointer text-xs font-bold text-gray-700"
              >
                <span>بدون شارة (Standard Account)</span>
              </button>

            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setBadgeModalAccount(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
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

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">تأكيد حذف الحساب نهائياً؟</h3>
              <p className="text-xs text-gray-500">
                أنت على وشك حذف حساب <strong className="text-red-600 font-bold">{deleteConfirmAccount.name}</strong> بشكل نهائي من قاعدة البيانات. هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  onDeleteAccount(deleteConfirmAccount.id);
                  setDeleteConfirmAccount(null);
                }}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                نعم، احذف الحساب
              </button>

              <button
                onClick={() => setDeleteConfirmAccount(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
