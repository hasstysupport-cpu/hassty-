export type AccountRole = 'student' | 'parent' | 'teacher';

export interface SubjectItem {
  id: string;
  name: string;
  tutorCount: number;
  iconName: string;
  isFeatured?: boolean;
  tag?: string;
  description: string;
}

export interface ReviewItem {
  id: string;
  studentName: string;
  studentAvatar?: string;
  rating: number;
  date: string;
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
  status: 'available' | 'booked' | 'unavailable';
  type: 'center' | 'online' | 'private';
  location?: string;
  bookedByStudentName?: string;
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
  reviews?: ReviewItem[];
  availableSlots?: AvailableSlot[];
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
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
}

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
  status: 'present' | 'absent' | 'late';
  groupName: string;
  location?: string;
  center?: string;
  qrVerifiedAt?: string;
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

export interface StudentGroup {
  id: string;
  name: string;
  subject?: string;
  level?: string;
  grade?: string;
  schedule: string;
  location: string;
  studentCount?: number;
  currentStudents?: number;
  maxCapacity: number;
  studentIds?: string[];
}

export interface TeacherGroupItem {
  id: string;
  name: string;
  grade: string;
  schedule: string;
  location: string;
  currentStudents: number;
  maxCapacity: number;
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
  age?: number;
  studentIdNumber?: string;
  qrCode?: string;
  qrCodeValue?: string;
  parentPhone: string;
  joinedTutorIds?: string[];
  avatarUrl: string;
}

export interface ParentSettings {
  notifyOnAttendance: boolean;
  notifyOnAbsence: boolean;
  remindPayments: boolean;
  remindUpcomingLessons: boolean;
  whatsappPhone: string;
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
