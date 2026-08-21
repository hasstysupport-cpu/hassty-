export type AccountRole = 'student' | 'parent' | 'teacher';

export interface SubjectItem {
  id: string;
  name: string;
  tutorCount: number;
  iconName: string;
  isFeatured?: boolean;
  tag?: string;
  description: string;
  stageCategory?: 'primary' | 'prep' | 'secondary' | 'all';
}

export interface ReviewItem {
  id: string;
  studentName: string;
  studentAvatar?: string;
  rating: number;
  date: string;
  createdAtTimestamp?: number;
  canEditUntilTimestamp?: number; // 48h cool-off period
  comment: string;
  tutorReply?: string;
  subject?: string;
  verified?: boolean;
  reply?: {
    author: string;
    content: string;
    date: string;
  };
}

export interface AvailableSlot {
  id: string;
  day: string;
  time: string;
  status: 'available' | 'booked' | 'unavailable' | 'full';
  type: 'center' | 'online' | 'private';
  location?: string;
  bookedByStudentName?: string;
  isRevisionSession?: boolean;
  revisionPrice?: number;
  waitlistCount?: number;
}

export interface TutorProfile {
  id: string;
  name: string;
  title: string;
  headline?: string;
  subject: string;
  governorate: string;
  area: string;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  pricePerSession: number;
  isVerified: boolean;
  joinCode: string;
  levels: string[];
  avatarUrl: string;
  bio: string;
  experienceYears?: number;
  centers?: string[];
  phone?: string;
  email?: string;
  education?: string;
  accountStatus?: 'active' | 'under_review' | 'paused';
  reviews?: ReviewItem[];
  availableSlots?: AvailableSlot[];
  qualityMetrics?: {
    retentionRate: number; // e.g. 96%
    churnRate: number;     // e.g. 4%
    attendanceAvg: number; // e.g. 94%
    cancelRate: number;    // e.g. 1.2%
  };
  gender?: 'male' | 'female' | string;
  monthlySubscriptionPrice?: number;
  paymentPlans?: any;
  schedule?: any;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  governorate: string;
  quote: string;
  rating: number;
  avatar: string;
  relatedSubject?: string;
}

export interface StatItem {
  value: string;
  label: string;
  description: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  highlight?: string;
}

export interface StepItem {
  number: number;
  title: string;
  description: string;
  iconName: string;
}

export interface LessonItem {
  id: string;
  tutorId?: string;
  tutorName: string;
  tutorAvatar?: string;
  subject: string;
  topic?: string;
  date: string;
  day?: string;
  dayName?: string;
  time: string;
  location: string;
  type: 'center' | 'online' | 'private';
  status: 'upcoming' | 'completed' | 'cancelled' | 'paused';
  price: number;
  homework?: string;
  teacherNotes?: string;
  isRevision?: boolean;
}

export type TimeWindowStatus = 'on_time' | 'late_window' | 'absent_window' | 'late' | 'absent_cutoff';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  tutorId: string;
  tutorName: string;
  subject: string;
  date: string;
  time: string;
  sessionStartTime?: string;
  scanTime?: string;
  status: 'present' | 'absent' | 'late';
  timeWindowStatus?: TimeWindowStatus;
  groupName: string;
  location?: string;
  center?: string;
  qrVerifiedAt?: string;
  sessionNotes?: string; // Educational follow-up (e.g. "شرح الباب الثالث")
  teacherNotes?: string; // Teacher feedback & homework note
  homeworkAssigned?: string; // (e.g. "واجب صـ 45 إلى 48")
  isMakeup?: boolean;
  hasDispute?: boolean;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  tutorId: string;
  tutorName: string;
  studentName: string;
  subject: string;
  period?: string;
  month?: string;
  invoiceNumber: string;
}

export interface GroupScheduleSlot {
  id: string;
  day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | string;
  dayArabic: string;
  startTime: string; // e.g. "14:00"
  endTime: string;   // e.g. "16:00"
}

export type PricingBillingType = 'per_session' | 'monthly';

export interface StudentGroup {
  id: string;
  name: string;
  subject?: string;
  level?: string;
  grade?: string;
  schedule: string;
  scheduleSlots?: GroupScheduleSlot[];
  location: string;
  studentCount?: number;
  currentStudents: number;
  maxCapacity: number;
  studentIds?: string[];
  waitlist?: string[];
  isPaused?: boolean;
  // New billing & pricing capabilities
  billingType: PricingBillingType; // 'per_session' (2% fixed) | 'monthly' (tiered rate)
  priceAmount: number; // e.g. 120 EGP per session or 480 EGP per month
  commissionRate: number; // e.g. 2 for 2%, or tiered (e.g. 1% - 1.5%)
  maxStudents?: number;
  studentsCount?: number;
  timing?: string;
  centerName?: string;
  sessionPrice?: number;
  monthlyPrice?: number;
  days?: string[];
  timeSlot?: string;
}

export interface TeacherGroupItem {
  id: string;
  name: string;
  grade: string;
  schedule: string;
  scheduleSlots?: GroupScheduleSlot[];
  location: string;
  currentStudents: number;
  maxCapacity: number;
  waitlistCount?: number;
  isPaused?: boolean;
  billingType?: PricingBillingType;
  priceAmount?: number;
  commissionRate?: number;
}

export interface TeacherStudentItem {
  id: string;
  name: string;
  avatarUrl: string;
  grade: string;
  phone: string;
  parentPhone: string;
  qrCode: string;
  groupName: string;
  attendanceRate: number;
  totalSessions: number;
  attendedSessions: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  joinedDate: string;
  status?: 'active' | 'paused' | 'transferred';
}

export interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  governorate: string;
  city?: string;
  area?: string;
  stage?: string;
  grade?: string;
  groupName?: string;
  age?: number;
  studentIdNumber?: string;
  qrCode: string;
  qrCodeValue?: string;
  parentPhone: string;
  emergencyParentPhone?: string;
  joinedTutorIds?: string[];
  avatarUrl: string;
  isSubscriptionPaused?: boolean;
}

export interface StudentCardCustomization {
  themeColor: 'emerald' | 'blue' | 'purple' | 'gold' | 'crimson' | 'slate';
  centerName: string;
  academicYear: string;
  cardTitle: string;
  footerText: string;
  disclaimerText: string;
  logoUrl?: string;
  showPhone: boolean;
  showCity: boolean;
  showGroup: boolean;
  showIssueDate: boolean;
  showBarcode: boolean;
  showQR: boolean;
  showAvatar: boolean;
  groupNameText?: string;
  issueDateText?: string;
  cardOrientation?: 'horizontal' | 'vertical';
}

export interface ParentSettings {
  notifyOnAttendance: boolean;
  notifyOnAbsence: boolean;
  notifyOnLateArrival: boolean; // 10 min late WhatsApp alert
  remindPayments: boolean;
  remindUpcomingLessons: boolean;
  whatsappPhone: string;
  emergencyPhone?: string; // Optional backup emergency number
}

export interface CommissionTier {
  range: string;
  minStudents: number;
  maxStudents: number | null;
  percentage: number;
  tag?: string;
  rate?: string;
  example?: string;
  benefit?: string;
}

// 1. Booking Approval Requests
export interface BookingRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  parentPhone: string;
  studentGrade: string;
  tutorId: string;
  tutorName: string;
  subject: string;
  day: string;
  time: string;
  sessionType: 'center' | 'online' | 'private';
  location: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  notes?: string;
}

// 2. Multi-child Parent Link
export interface ParentLinkedChild {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  avatarUrl: string;
  qrCode: string;
  governorate: string;
  area: string;
  status: 'linked' | 'pending_student_approval';
  verificationCode?: string;
  linkedAt: string;
  attendanceRate: number;
  upcomingLessonCount: number;
}

// 3. Compensatory Session Request (حصة تعويضية)
export interface MakeupSessionRequest {
  id: string;
  studentId: string;
  studentName: string;
  tutorId: string;
  subject: string;
  missedDate: string;
  missedSessionTopic: string;
  excuseReason: string;
  medicalProofAttached?: boolean;
  requestedSlotId?: string;
  requestedSlotText?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// 4. Safety and Misconduct Reporting (إبلاغ عن تصرف غير لائق)
export interface SafetyReport {
  id: string;
  reporterRole: 'student' | 'parent';
  reporterName: string;
  reporterPhone: string;
  targetTeacherId: string;
  targetTeacherName: string;
  category: 'inappropriate_conduct' | 'external_payment_demand' | 'absence_no_notice' | 'verbal_abuse' | 'other';
  description: string;
  createdAt: string;
  status: 'under_investigation' | 'resolved';
}

// 5. Attendance Dispute Ticket (تظلم تقني أو اعتذار)
export interface AttendanceDisputeTicket {
  id: string;
  studentId: string;
  studentName: string;
  attendanceRecordId: string;
  sessionDate: string;
  subject: string;
  teacherName: string;
  disputeReason: string;
  status: 'under_review' | 'resolved_present' | 'rejected';
  createdAt: string;
}

// 6. Teacher Cancellation Record (إلغاء المعلم للحصة مع تأثير التقييم)
export interface TeacherCancellationLog {
  id: string;
  tutorId: string;
  sessionId: string;
  groupName: string;
  scheduledTime: string;
  cancelledAt: string;
  noticeHoursBefore: number; // e.g. 5 hours vs 0.5 hours
  isPenaltyApplied: boolean; // true if cancelled < 3 hours before
  reason: string;
  whatsappNoticeSent: boolean;
}

export interface RevisionSessionItem {
  id: string;
  title: string;
  tutorId: string;
  tutorName: string;
  subject: string;
  grade: string;
  date: string;
  time: string;
  location: string;
  pricePerStudent: number;
  totalSeats: number;
  bookedSeats: number;
  isExamNight: boolean;
}

export type AccountBadgeType = 'none' | 'verified' | 'suspicious' | 'fraudulent';

export interface AdminUserAccount {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: AccountRole | 'admin';
  createdAt: string;
  status: 'active' | 'suspended';
  badge: AccountBadgeType;
  grade?: string;
  subject?: string;
  governorate?: string;
  area?: string;
  studentsCount?: number;
  totalRevenue?: number;
  qrCode?: string;
  avatarUrl?: string;
  nationalId?: string;
  parentPhone?: string;
}

export interface TeacherVerificationRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  phone: string;
  subject: string;
  stage: string;
  governorate: string;
  area: string;
  bio: string;
  experienceYears: number | string;
  idCardImageUrl: string;
  certificateImageUrl?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  actionedAt?: string;
  actionedBy?: string;
}

export interface AdminSafetyReport {
  id: string;
  reporterName: string;
  reporterRole: 'student' | 'parent';
  reporterPhone: string;
  targetTeacherId: string;
  targetTeacherName: string;
  category: 'inappropriate_conduct' | 'external_payment_demand' | 'absence_no_notice' | 'verbal_abuse' | 'other';
  description: string;
  createdAt: string;
  status: 'new' | 'in_review' | 'resolved';
  teacherSuspended?: boolean;
}

export interface TeacherCommissionTrackingItem {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  activeStudentsCount: number;
  monthlyGrossEgp: number;
  tierRate: number; // e.g. 1.0% or 1.5% or 2.0%
  dueCommissionEgp: number;
  paymentStatus: 'paid' | 'overdue' | 'pending';
  lastPaymentDate?: string;
  billingCycle: string;
}

