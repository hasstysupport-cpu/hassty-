import { StudentGroup, GroupScheduleSlot } from '../types';

export interface ActiveGroupDetectionResult {
  activeGroup: StudentGroup | null;
  activeSlot: GroupScheduleSlot | null;
  status: 'active_now' | 'upcoming_soon' | 'none';
  minutesUntilStart: number;
  minutesIntoSession: number;
  isPastHalfSession: boolean; // True if current time is past 50% of session length -> absent cutoff
  formattedCurrentTime: string;
}

const ARABIC_DAYS_MAP: Record<number, { eng: string; ar: string }> = {
  0: { eng: 'Sunday', ar: 'الأحد' },
  1: { eng: 'Monday', ar: 'الإثنين' },
  2: { eng: 'Tuesday', ar: 'الثلاثاء' },
  3: { eng: 'Wednesday', ar: 'الأربعاء' },
  4: { eng: 'Thursday', ar: 'الخميس' },
  5: { eng: 'Friday', ar: 'الجمعة' },
  6: { eng: 'Saturday', ar: 'السبت' },
};

/**
 * Parses "HH:MM" into total minutes from midnight (0 to 1439)
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Formats 24h string "16:30" into Arabic 12h representation "04:30 م"
 */
export function formatTimeArabic(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'م' : 'ص';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const formattedM = m < 10 ? `0${m}` : `${m}`;
  return `${displayH}:${formattedM} ${period}`;
}

/**
 * Detects if there is any active group session running right now,
 * or allows simulated time for interactive testing.
 */
export function detectActiveLiveGroup(
  groups: StudentGroup[],
  customDate?: Date
): ActiveGroupDetectionResult {
  const now = customDate || new Date();
  const currentDayIndex = now.getDay();
  const dayInfo = ARABIC_DAYS_MAP[currentDayIndex];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const formattedCurrentTime = now.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Check all groups and their slots
  for (const group of groups) {
    if (group.isPaused) continue;
    const slots = group.scheduleSlots || [];

    for (const slot of slots) {
      // Check if day matches (either english name or arabic name)
      const dayMatches =
        slot.day === dayInfo.eng ||
        slot.dayArabic === dayInfo.ar ||
        slot.day.toLowerCase() === dayInfo.eng.toLowerCase() ||
        group.schedule.includes(dayInfo.ar);

      if (dayMatches) {
        const startMin = timeToMinutes(slot.startTime);
        const endMin = timeToMinutes(slot.endTime);
        const sessionDuration = endMin - startMin > 0 ? endMin - startMin : 120; // default 2h (120m)
        const halfDuration = Math.floor(sessionDuration / 2);

        // Window: from 30 mins before start until session end
        if (currentMinutes >= startMin - 30 && currentMinutes <= endMin) {
          const minutesIntoSession = Math.max(0, currentMinutes - startMin);
          const isPastHalfSession = minutesIntoSession > halfDuration;

          return {
            activeGroup: group,
            activeSlot: slot,
            status: 'active_now',
            minutesUntilStart: Math.max(0, startMin - currentMinutes),
            minutesIntoSession,
            isPastHalfSession,
            formattedCurrentTime,
          };
        }
      }
    }
  }

  // Fallback: If no strict time matched, return first group as default fallback
  return {
    activeGroup: groups[0] || null,
    activeSlot: groups[0]?.scheduleSlots?.[0] || null,
    status: 'none',
    minutesUntilStart: 0,
    minutesIntoSession: 5,
    isPastHalfSession: false,
    formattedCurrentTime,
  };
}

/**
 * Calculates platform fee and teacher net payout
 */
export function calculateTeacherCommission(
  billingType: 'per_session' | 'monthly',
  priceAmount: number,
  studentCount: number
) {
  if (billingType === 'per_session') {
    // 2% FIXED per student per session
    const grossPerStudent = priceAmount;
    const feePerStudent = grossPerStudent * 0.02;
    const netPerStudent = grossPerStudent - feePerStudent;
    const totalGross = grossPerStudent * studentCount;
    const totalFee = feePerStudent * studentCount;
    const totalNet = netPerStudent * studentCount;

    return {
      billingType: 'per_session' as const,
      commissionRateLabel: '2% ثابتة لكل طالب/حصة',
      commissionPercentage: 2,
      grossPerStudent,
      feePerStudent: Math.round(feePerStudent * 100) / 100,
      netPerStudent: Math.round(netPerStudent * 100) / 100,
      totalGross,
      totalFee: Math.round(totalFee * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
    };
  } else {
    // Monthly tiered rate based on volume
    let rate = 2.0;
    if (studentCount > 300) rate = 1.0;
    else if (studentCount > 150) rate = 1.2;
    else if (studentCount > 50) rate = 1.5;

    const grossPerStudent = priceAmount;
    const feePerStudent = grossPerStudent * (rate / 100);
    const netPerStudent = grossPerStudent - feePerStudent;
    const totalGross = grossPerStudent * studentCount;
    const totalFee = feePerStudent * studentCount;
    const totalNet = netPerStudent * studentCount;

    return {
      billingType: 'monthly' as const,
      commissionRateLabel: `${rate}% حسب شريحة الطلاب الشهرية`,
      commissionPercentage: rate,
      grossPerStudent,
      feePerStudent: Math.round(feePerStudent * 100) / 100,
      netPerStudent: Math.round(netPerStudent * 100) / 100,
      totalGross,
      totalFee: Math.round(totalFee * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
    };
  }
}
