import React, { useEffect, useRef } from 'react';

/* ============================================================
   OtpCodeInput — مدخل رمز التحقق (6 خانات)
   إدخال تلقائي متقدم + لصق + رجوع بالمسح + اهتزاز عند الخطأ
   ============================================================ */

interface OtpCodeInputProps {
  value: string[];
  onChange: (digits: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  length?: number;
  autoFocus?: boolean;
}

export const OtpCodeInput: React.FC<OtpCodeInputProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  length = 6,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRefs.current[0]?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!hasError) return;
    const card = inputRefs.current[0]?.closest('.otp-wrap');
    card?.classList.remove('otp-shake');
    void (card as HTMLElement | null)?.offsetWidth;
    card?.classList.add('otp-shake');
  }, [hasError]);

  const handleChange = (index: number, raw: string) => {
    // paste (or fast typing) — accept the full code at once
    if (raw.length > 1) {
      const sanitized = raw.replace(/\D/g, '').slice(0, length);
      if (!sanitized) return;
      const digits = Array.from({ length }, (_, i) => sanitized[i] || '');
      onChange(digits);
      inputRefs.current[Math.min(sanitized.length, length - 1)]?.focus();
      if (sanitized.length === length) onComplete?.(digits.join(''));
      return;
    }

    const digit = raw.replace(/\D/g, '').slice(-1);
    const digits = [...value];
    digits[index] = digit;
    onChange(digits);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    const joined = digits.join('');
    if (joined.length === length && !digits.includes('')) {
      onComplete?.(joined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div dir="ltr" className="otp-wrap flex items-center justify-center gap-2.5 sm:gap-3 my-1">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={`الرقم ${i + 1}`}
          className={`auth-otp ${value[i] ? 'filled' : ''} ${hasError ? '!border-red-400 !text-red-600' : ''}`}
        />
      ))}
    </div>
  );
};
