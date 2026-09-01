import React from 'react';
import { AccountBadgeType } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface AccountBadgeProps {
  badge: AccountBadgeType;
  showText?: boolean;
}

export const AccountBadge: React.FC<AccountBadgeProps> = ({ badge, showText = true }) => {
  if (badge === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="حساب موثق">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        {showText && <span>موثّق</span>}
      </span>
    );
  }

  if (badge === 'suspicious') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200" title="حساب مشتبه فيه">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        {showText && <span>مشتبه فيه</span>}
      </span>
    );
  }

  if (badge === 'fraudulent') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200" title="حساب احتيالي مخالف">
        <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
        {showText && <span>احتيالي</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
      <span>بدون شارة</span>
    </span>
  );
};
