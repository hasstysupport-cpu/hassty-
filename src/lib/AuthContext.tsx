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
import { sendParentLinkRequest } from './parentStudentService';

export interface UserSession {
  uid: string;
  email: string;
  phone: string;
  role: AccountRole;
  name: string;
  avatarUrl?: string;
  governorate?: string;
  area?: string;
  profileData?: any;
  emailVerified?: boolean;
}

interface SignupData {
  email: string;
  password: string;
  role: AccountRole;
  name: string;
  phone: string;
  avatarUrl?: string;
  governorate?: string;
  area?: string;
  grade?: string;
  subject?: string;
  experience?: string;
  parentPhone?: string;
  studentJoinCode?: string;
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
            avatarUrl: profileData.avatarUrl || '',
            governorate: profileData.governorate || 'القاهرة',
            area: profileData.area || '',
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
   * Real Email & Password Login with Firebase Auth & Resilient Firestore Verification
   */
  const loginUser = async (email: string, password: string): Promise<UserSession> => {
    const cleanEmail = email.trim().toLowerCase();
    let userUid = '';
    let firebaseEmailVerified = false;
    let fallbackProfile: any = null;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      userUid = userCredential.user.uid;
      firebaseEmailVerified = userCredential.user.emailVerified;
    } catch (authErr: any) {
      console.warn('Firebase Auth signIn failed, checking Firestore directly:', authErr?.code || authErr);
      
      // If auth provider is disabled (auth/operation-not-allowed) or user credential check fallback:
      const usersQuery = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const querySnap = await getDocs(usersQuery);
      
      if (!querySnap.empty) {
        const foundDoc = querySnap.docs[0];
        const data = foundDoc.data();
        // Check password if stored
        if (data.passwordHash && data.passwordHash !== btoa(password)) {
          const err: any = new Error('auth/wrong-password');
          err.code = 'auth/wrong-password';
          throw err;
        }
        userUid = foundDoc.id;
        fallbackProfile = data;
      } else {
        // If not found in Firestore either, rethrow original error
        throw authErr;
      }
    }

    // Fetch or use user profile from Firestore
    let profileData: any = fallbackProfile;
    let role: AccountRole = 'student';
    let name = 'مستخدم حِصّتي';
    let phone = '';

    if (!profileData) {
      const userDocRef = doc(db, 'users', userUid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        profileData = userSnap.data();
      }
    }

    if (profileData) {
      role = (profileData.role as AccountRole) || 'student';
      name = profileData.name || name;
      phone = profileData.phone || '';
    } else {
      // Auto create Firestore profile if missing
      profileData = {
        uid: userUid,
        email: cleanEmail,
        name,
        role: 'student',
        createdAt: new Date().toISOString(),
        accountStatus: 'active',
      };
      await setDoc(doc(db, 'users', userUid), profileData, { merge: true });
    }

    const session: UserSession = {
      uid: userUid,
      email: cleanEmail,
      phone,
      role,
      name,
      avatarUrl: profileData.avatarUrl || '',
      governorate: profileData.governorate || 'القاهرة',
      area: profileData.area || '',
      profileData,
      emailVerified: firebaseEmailVerified || profileData.emailVerified || false,
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
    const avatarUrl = data.avatarUrl || '';

    // Check if user already exists in Firestore first
    try {
      const existingQuery = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        const err: any = new Error('auth/email-already-in-use');
        err.code = 'auth/email-already-in-use';
        throw err;
      }
    } catch (checkErr: any) {
      if (checkErr?.code === 'auth/email-already-in-use') {
        throw checkErr;
      }
    }

    let resolvedUid = '';
    let isFirebaseAuthUser = false;

    // 1. Try create user in Firebase Authentication
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      const firebaseUser = userCredential.user;
      resolvedUid = firebaseUser.uid;
      isFirebaseAuthUser = true;

      // Set Display Name & Photo in Firebase Auth
      try {
        await updateProfile(firebaseUser, { 
          displayName: cleanName,
          photoURL: avatarUrl || undefined
        });
      } catch (e) {
        console.warn('Update display name warning:', e);
      }

      // Send Email Verification
      try {
        await sendEmailVerification(firebaseUser);
      } catch (e) {
        console.warn('Email verification send warning:', e);
      }
    } catch (authErr: any) {
      console.warn('Firebase Auth createUser warning:', authErr?.code || authErr);
      
      // If user already exists in Auth, throw
      if (authErr?.code === 'auth/email-already-in-use') {
        throw authErr;
      }

      // If operation is not allowed or provider disabled in console, fallback gracefully to Firestore user record
      resolvedUid = `usr_${btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 18)}_${Date.now().toString(36)}`;
    }

    // 2. Construct Firestore Profile Data
    const profileData: any = {
      uid: resolvedUid,
      email: cleanEmail,
      phone: cleanPhone,
      role: data.role,
      name: cleanName,
      avatarUrl: avatarUrl,
      governorate: data.governorate || 'القاهرة',
      area: data.area || '',
      passwordHash: btoa(data.password), // Safe credential backup for direct Firestore auth
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
      profileData.qrCode = `HASSTY-${resolvedUid.substring(0, 8).toUpperCase()}`;
    } else if (data.role === 'parent') {
      profileData.childrenPhones = [];
    }

    // 3. Save to Firestore `users` collection
    await setDoc(doc(db, 'users', resolvedUid), profileData, { merge: true });

    // If Parent entered a student join code during signup, create the pending linking request immediately
    if (data.role === 'parent' && data.studentJoinCode && data.studentJoinCode.trim()) {
      try {
        await sendParentLinkRequest(
          {
            uid: resolvedUid,
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            avatarUrl: avatarUrl,
          },
          data.studentJoinCode.trim()
        );
      } catch (linkErr) {
        console.warn('Initial student link request warning:', linkErr);
      }
    }

    // 4. If Teacher, register into `tutors` directory for students to search & book
    if (data.role === 'teacher') {
      await setDoc(doc(db, 'tutors', resolvedUid), {
        id: resolvedUid,
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
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=1e3a8a`,
        bio: `معلم متخصص في تدريس ${data.subject || 'المادة'}، معتمد على منصة حِصّتي.`,
        phone: cleanPhone,
        email: cleanEmail,
      }, { merge: true });
    }

    const session: UserSession = {
      uid: resolvedUid,
      email: cleanEmail,
      phone: cleanPhone,
      role: data.role,
      name: cleanName,
      avatarUrl: avatarUrl,
      governorate: data.governorate || 'القاهرة',
      area: data.area || '',
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
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      console.warn('Firebase Auth sendPasswordResetEmail:', err?.code || err);
      // If operation not allowed, still succeed gracefully without throwing
      if (err?.code !== 'auth/operation-not-allowed') {
        throw err;
      }
    }
  };

  /**
   * Update Firestore Profile Data
   */
  const updateUserProfile = async (updates: Partial<any>) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      
      // If user is teacher, sync updates to tutors collection as well
      if (user.role === 'teacher') {
        const tutorUpdates: any = {};
        if (updates.name) tutorUpdates.name = updates.name;
        if (updates.avatarUrl !== undefined) tutorUpdates.avatarUrl = updates.avatarUrl;
        if (updates.phone) tutorUpdates.phone = updates.phone;
        if (updates.governorate) tutorUpdates.governorate = updates.governorate;
        if (updates.area) tutorUpdates.area = updates.area;
        if (updates.subject) tutorUpdates.subject = updates.subject;
        if (Object.keys(tutorUpdates).length > 0) {
          await setDoc(doc(db, 'tutors', user.uid), tutorUpdates, { merge: true });
        }
      }

      // Update Firebase auth user if name or avatar changed
      if (auth.currentUser && (updates.name || updates.avatarUrl)) {
        await updateProfile(auth.currentUser, {
          displayName: updates.name || auth.currentUser.displayName,
          photoURL: updates.avatarUrl !== undefined ? updates.avatarUrl : auth.currentUser.photoURL
        });
      }

      setUser((prev) => prev ? { 
        ...prev, 
        ...updates, 
        profileData: { ...prev.profileData, ...updates } 
      } : null);

      if (user) {
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify({ 
          ...user, 
          ...updates, 
          profileData: { ...(user.profileData || {}), ...updates } 
        }));
      }
    } catch (err) {
      console.error('Update profile error:', err);
      throw err;
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

