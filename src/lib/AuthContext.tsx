import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { AccountRole } from '../types';

export interface UserSession {
  uid: string;
  email: string;
  phone: string;
  role: AccountRole;
  name: string;
  profileData?: any;
  emailVerified?: boolean;
}

interface SignupData {
  email: string;
  password: string;
  role: AccountRole;
  name: string;
  phone: string;
  governorate?: string;
  area?: string;
  grade?: string;
  subject?: string;
  experience?: string;
  parentPhone?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  loginUser: (email: string, password: string) => Promise<UserSession>;
  signupUser: (data: SignupData) => Promise<UserSession>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<any>) => Promise<void>;
  logout: () => Promise<void>;
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

  // Real-time Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let profileData: any = {};
          let role: AccountRole = 'student';
          let name = firebaseUser.displayName || 'مستخدم حِصّتي';
          let phone = '';

          if (userDoc.exists()) {
            profileData = userDoc.data();
            role = (profileData.role as AccountRole) || 'student';
            name = profileData.name || name;
            phone = profileData.phone || '';
          }

          const session: UserSession = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            phone,
            role,
            name,
            profileData,
            emailVerified: firebaseUser.emailVerified,
          };

          setUser(session);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
        } catch (err) {
          console.warn('Error fetching Firestore user profile on auth change:', err);
        }
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Real Email & Password Login with Firebase Auth
   */
  const loginUser = async (email: string, password: string): Promise<UserSession> => {
    const cleanEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const firebaseUser = userCredential.user;

    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userDocRef);

    let profileData: any = {};
    let role: AccountRole = 'student';
    let name = firebaseUser.displayName || 'مستخدم حِصّتي';
    let phone = '';

    if (userSnap.exists()) {
      profileData = userSnap.data();
      role = (profileData.role as AccountRole) || 'student';
      name = profileData.name || name;
      phone = profileData.phone || '';
    } else {
      // Auto create Firestore profile if missing
      profileData = {
        uid: firebaseUser.uid,
        email: cleanEmail,
        name,
        role: 'student',
        createdAt: new Date().toISOString(),
        accountStatus: 'active',
      };
      await setDoc(userDocRef, profileData, { merge: true });
    }

    const session: UserSession = {
      uid: firebaseUser.uid,
      email: cleanEmail,
      phone,
      role,
      name,
      profileData,
      emailVerified: firebaseUser.emailVerified,
    };

    setUser(session);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
    return session;
  };

  /**
   * Real Email & Password Signup with Firebase Auth & Firestore Registration
   */
  const signupUser = async (data: SignupData): Promise<UserSession> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const cleanPhone = data.phone.trim();

    // 1. Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
    const firebaseUser = userCredential.user;

    // 2. Set Firebase Auth Display Name
    try {
      await updateProfile(firebaseUser, { displayName: cleanName });
    } catch (e) {
      console.warn('Update display name warning:', e);
    }

    // 3. Send Email Verification link to user's real email
    try {
      await sendEmailVerification(firebaseUser);
    } catch (e) {
      console.warn('Email verification send warning:', e);
    }

    // 4. Construct Firestore Profile Data
    const profileData: any = {
      uid: firebaseUser.uid,
      email: cleanEmail,
      phone: cleanPhone,
      role: data.role,
      name: cleanName,
      governorate: data.governorate || 'القاهرة',
      area: data.area || '',
      createdAt: new Date().toISOString(),
      accountStatus: 'active',
      emailVerified: false,
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
      profileData.qrCode = `HASSTY-${firebaseUser.uid.substring(0, 8).toUpperCase()}`;
    } else if (data.role === 'parent') {
      profileData.childrenPhones = [];
    }

    // 5. Save to Firestore `users` collection
    await setDoc(doc(db, 'users', firebaseUser.uid), profileData, { merge: true });

    // 6. If Teacher, register into `tutors` directory for students to search & book
    if (data.role === 'teacher') {
      await setDoc(doc(db, 'tutors', firebaseUser.uid), {
        id: firebaseUser.uid,
        name: cleanName,
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
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=1e3a8a`,
        bio: `معلم متخصص في تدريس ${data.subject || 'المادة'}، معتمد على منصة حِصّتي.`,
        phone: cleanPhone,
        email: cleanEmail,
      }, { merge: true });
    }

    const session: UserSession = {
      uid: firebaseUser.uid,
      email: cleanEmail,
      phone: cleanPhone,
      role: data.role,
      name: cleanName,
      profileData,
      emailVerified: false,
    };

    setUser(session);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
    return session;
  };

  /**
   * Send Password Reset Link to User's Email
   */
  const sendPasswordReset = async (email: string): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, cleanEmail);
  };

  /**
   * Update Firestore Profile Data
   */
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

  /**
   * Real Logout with Firebase Auth
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginUser, 
      signupUser, 
      sendPasswordReset, 
      updateUserProfile, 
      logout 
    }}>
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

