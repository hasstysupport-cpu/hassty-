import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  const modalContent = (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/65 backdrop-blur-xs text-right font-['Tajawal',sans-serif] animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      dir="rtl"
    >
      <div
        className={`bg-white rounded-3xl w-full ${maxWidthClasses} p-6 sm:p-8 space-y-4 relative shadow-2xl border border-gray-100 animate-scaleUp my-auto max-h-[90vh] overflow-y-auto`}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {(title || icon) && (
          <div className="text-center space-y-1.5 pb-1">
            {icon && (
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-2">
                {icon}
              </div>
            )}
            {title && (
              <h3 className="text-lg sm:text-xl font-bold text-[#1E3A8A]">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#6B7280]">{subtitle}</p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
