import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  AccountRole, 
  TutorProfile, 
  StudentProfile, 
  TeacherGroupItem, 
  TeacherStudentItem, 
  AttendanceRecord,
  PaymentRecord
} from '../types';

export interface UserSession {
  uid: string;
  phone: string;
  role: AccountRole;
  name: string;
  profileData?: any;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  loginUser: (phone: string, role: AccountRole, name?: string) => Promise<UserSession>;
  checkPhoneExists: (phone: string) => Promise<{ exists: boolean; userData?: any }>;
  signupUser: (data: {
    phone: string;
    role: AccountRole;
    name: string;
    governorate?: string;
    area?: string;
    grade?: string;
    subject?: string;
    experience?: string;
    parentPhone?: string;
  }) => Promise<UserSession>;
  updateUserProfile: (data: Partial<any>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'hassty_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync session with Firestore
  useEffect(() => {
    async function loadSession() {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const updatedUser: UserSession = {
              uid: user.uid,
              phone: data.phone || user.phone,
              role: data.role || user.role,
              name: data.name || user.name,
              profileData: data,
            };
            setUser(updatedUser);
            localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
          }
        } catch (err) {
          console.warn('Firestore session sync error:', err);
        }
      }
      setLoading(false);
    }
    loadSession();
  }, [user?.uid]);

  const checkPhoneExists = async (phone: string): Promise<{ exists: boolean; userData?: any }> => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) return { exists: false };

    try {
      // Query users collection where phone equals cleanPhone
      const q = query(collection(db, 'users'), where('phone', '==', cleanPhone));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { exists: true, userData: snap.docs[0].data() };
      }

      // Check document IDs like student_010xxx, teacher_010xxx, parent_010xxx
      const roles: AccountRole[] = ['student', 'teacher', 'parent'];
      for (const r of roles) {
        const docSnap = await getDoc(doc(db, 'users', `${r}_${cleanPhone.replace(/\+/g, '')}`));
        if (docSnap.exists()) {
          return { exists: true, userData: docSnap.data() };
        }
      }

      return { exists: false };
    } catch (err) {
      console.warn('Check phone existence error:', err);
      return { exists: false };
    }
  };

  const loginUser = async (phone: string, role: AccountRole, name?: string): Promise<UserSession> => {
    const cleanPhone = phone.trim();
    const uid = `${role}_${cleanPhone.replace(/\+/g, '')}`;

    try {
      // 1. Fetch user doc from Firestore
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      let userName = name || 'المستخدم';
      let profileData = {};

      if (snap.exists()) {
        const data = snap.data();
        userName = data.name || userName;
        profileData = data;
      } else {
        // If first time logging in, create real Firestore user record
        profileData = {
          uid,
          phone: cleanPhone,
          role,
          name: userName,
          createdAt: new Date().toISOString(),
          accountStatus: 'active',
        };
        await setDoc(userRef, profileData, { merge: true });
      }

      const session: UserSession = {
        uid,
        phone: cleanPhone,
        role,
        name: userName,
        profileData,
      };

      setUser(session);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
      return session;
    } catch (err) {
      console.error('Firestore login error:', err);
      // Fallback session
      const fallbackSession: UserSession = {
        uid,
        phone: cleanPhone,
        role,
        name: name || 'المستخدم',
      };
      setUser(fallbackSession);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(fallbackSession));
      return fallbackSession;
    }
  };

  const signupUser = async (data: {
    phone: string;
    role: AccountRole;
    name: string;
    governorate?: string;
    area?: string;
    grade?: string;
    subject?: string;
    experience?: string;
    parentPhone?: string;
  }): Promise<UserSession> => {
    const cleanPhone = data.phone.trim();
    const uid = `${data.role}_${cleanPhone.replace(/\+/g, '')}`;

    const profileData: any = {
      uid,
      phone: cleanPhone,
      role: data.role,
      name: data.name.trim(),
      governorate: data.governorate || 'القاهرة',
      area: data.area || '',
      createdAt: new Date().toISOString(),
      accountStatus: 'active',
    };

    if (data.role === 'teacher') {
      profileData.subject = data.subject || 'عام';
      profileData.experienceYears = data.experience || 'سنة';
      profileData.isVerified = true;
      profileData.rating = 5.0;
      profileData.reviewsCount = 0;
      profileData.studentsCount = 0;
    } else if (data.role === 'student') {
      profileData.grade = data.grade || 'الصف الثالث الثانوي';
      profileData.parentPhone = data.parentPhone || '';
      profileData.qrCode = `HASSTY-${cleanPhone}-${Date.now().toString(36).toUpperCase()}`;
    } else if (data.role === 'parent') {
      profileData.childrenPhones = [];
    }

    try {
      // Save directly to Firestore users collection
      await setDoc(doc(db, 'users', uid), profileData, { merge: true });

      // If teacher, also save to tutors collection so students can find them in search
      if (data.role === 'teacher') {
        await setDoc(doc(db, 'tutors', uid), {
          id: uid,
          name: data.name.trim(),
          title: `معلم ${data.subject || 'المادة'}`,
          subject: data.subject || 'عام',
          governorate: data.governorate || 'القاهرة',
          area: data.area || 'مدينة نصر',
          rating: 5.0,
          reviewsCount: 0,
          studentsCount: 0,
          pricePerSession: 150,
          isVerified: true,
          joinCode: Math.floor(100000 + Math.random() * 900000).toString(),
          levels: [data.grade || 'ثانوية عامة'],
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          bio: `معلم متخصص في تدريس ${data.subject || 'المادة'}، معتمد على منصة حِصّتي.`,
          phone: cleanPhone,
        }, { merge: true });
      }
    } catch (err) {
      console.error('Firestore signup persistence error:', err);
    }

    const session: UserSession = {
      uid,
      phone: cleanPhone,
      role: data.role,
      name: data.name.trim(),
      profileData,
    };

    setUser(session);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
    return session;
  };

  const updateUserProfile = async (updates: Partial<any>) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUser((prev) => prev ? { ...prev, ...updates, profileData: { ...prev.profileData, ...updates } } : null);
      if (user) {
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify({ ...user, ...updates }));
      }
    } catch (err) {
      console.error('Update profile error:', err);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, checkPhoneExists, signupUser, updateUserProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
