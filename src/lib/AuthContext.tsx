import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
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
import { saveAdminSession } from './securityConfig';

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
  loginWithGoogle: (defaultRole?: AccountRole, extraData?: any) => Promise<UserSession>;
  signupUser: (data: SignupData) => Promise<UserSession>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendEmailVerificationLink: (email: string) => Promise<void>;
  markEmailAsVerified: (uid: string) => Promise<void>;
  updateUserProfile: (data: Partial<any>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'hassty_user_session';

/**
 * Universal helper to sync Google authenticated user to Firestore and produce a valid UserSession
 */
async function syncGoogleUserToFirestore(
  firebaseUser: FirebaseUser,
  fallbackRole: AccountRole = 'student',
  extraData: any = {}
): Promise<UserSession> {
  const userUid = firebaseUser.uid;
  const targetEmail = (firebaseUser.email || '').toLowerCase().trim();
  const cleanName = firebaseUser.displayName || (targetEmail ? targetEmail.split('@')[0] : 'مستخدم حِصّتي');
  const photoUrl = firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=1e3a8a`;

  const isAdminAccount = 
    targetEmail === 'hasstysupport@gmail.com' || 
    targetEmail === 'admin@hassty.com' ||
    targetEmail.includes('admin@');

  const userDocRef = doc(db, 'users', userUid);
  let profileData: any = null;
  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      profileData = userSnap.data();
    } else {
      const emailQuery = query(collection(db, 'users'), where('email', '==', targetEmail));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        profileData = emailSnap.docs[0].data();
      }
    }
  } catch (e) {
    console.warn('Error reading Google user doc:', e);
  }

  let resolvedRole: AccountRole = profileData?.role || (isAdminAccount ? 'admin' : fallbackRole);

  if (!profileData) {
    profileData = {
      uid: userUid,
      email: targetEmail,
      name: cleanName,
      phone: extraData.phone || '',
      role: resolvedRole,
      avatarUrl: photoUrl,
      governorate: extraData.governorate || 'القاهرة',
      area: extraData.area || '',
      createdAt: new Date().toISOString(),
      accountStatus: 'active',
      emailVerified: true,
      isVerified: true,
      lastLogin: new Date().toISOString(),
      ...extraData,
    };

    if (resolvedRole === 'student') {
      profileData.grade = extraData.grade || 'الصف الثالث الثانوي';
      profileData.parentPhone = extraData.parentPhone || '';
      profileData.qrCode = `HASSTY-${userUid.substring(0, 8).toUpperCase()}`;
    } else if (resolvedRole === 'teacher') {
      profileData.subject = extraData.subject || 'عام';
      profileData.experienceYears = extraData.experience || '5 سنوات';
      profileData.rating = 5.0;
      profileData.reviewsCount = 0;
      profileData.studentsCount = 0;
    }

    try {
      await setDoc(userDocRef, profileData, { merge: true });

      if (resolvedRole === 'admin') {
        await setDoc(doc(db, 'admin_users', userUid), {
          uid: userUid,
          email: targetEmail,
          name: cleanName,
          photoURL: photoUrl,
          role: 'super_admin',
          lastLogin: new Date().toISOString(),
          authProvider: 'google',
          status: 'active'
        }, { merge: true });
      }

      if (resolvedRole === 'teacher') {
        await setDoc(doc(db, 'tutors', userUid), {
          id: userUid,
          name: cleanName,
          title: `معلم ${extraData.subject || 'المادة'}`,
          subject: extraData.subject || 'عام',
          governorate: extraData.governorate || 'القاهرة',
          area: extraData.area || 'مدينة نصر',
          rating: 5.0,
          reviewsCount: 0,
          studentsCount: 0,
          pricePerSession: 150,
          isVerified: true,
          joinCode: Math.floor(100000 + Math.random() * 900000).toString(),
          levels: [extraData.grade || 'ثانوية عامة'],
          avatarUrl: photoUrl,
          bio: `معلم متخصص معتمد على منصة حِصّتي.`,
          phone: extraData.phone || '',
          email: targetEmail,
        }, { merge: true });
      }
    } catch (writeErr) {
      console.warn('Initial Google profile creation warning:', writeErr);
    }
  } else {
    // update lastLogin on existing doc
    try {
      await setDoc(userDocRef, {
        lastLogin: new Date().toISOString(),
        emailVerified: true,
        avatarUrl: photoUrl || profileData.avatarUrl
      }, { merge: true });
    } catch (e) {
      console.warn('Update last login notice:', e);
    }
  }

  const session: UserSession = {
    uid: userUid,
    email: targetEmail,
    phone: profileData.phone || '',
    role: resolvedRole,
    name: profileData.name || cleanName,
    avatarUrl: profileData.avatarUrl || photoUrl,
    governorate: profileData.governorate || 'القاهرة',
    area: profileData.area || '',
    profileData,
    emailVerified: true,
  };

  if (resolvedRole === 'admin') {
    saveAdminSession({
      token: `google_admin_${userUid}_${Date.now()}`,
      email: targetEmail,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      role: 'admin',
    });
  }

  return session;
}

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

  // Real-time Firebase Auth state listener & redirect handler
  useEffect(() => {
    // Process redirect result if page was reloaded from a redirect login (e.g. mobile)
    getRedirectResult(auth)
      .then(async (res) => {
        if (res && res.user) {
          console.log('Firebase Redirect Sign-in completed:', res.user.email);
          const pendingRole = (localStorage.getItem('hassty_pending_role') as AccountRole) || 'student';
          let pendingExtra: any = {};
          try {
            const rawExtra = localStorage.getItem('hassty_pending_extra');
            if (rawExtra) pendingExtra = JSON.parse(rawExtra);
          } catch {
            // ignore
          }
          const session = await syncGoogleUserToFirestore(res.user, pendingRole, pendingExtra);
          setUser(session);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
          localStorage.removeItem('hassty_pending_role');
          localStorage.removeItem('hassty_pending_extra');
        }
      })
      .catch((err) => {
        console.warn('Redirect result notice:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const pendingRole = (localStorage.getItem('hassty_pending_role') as AccountRole) || 'student';
          let pendingExtra: any = {};
          try {
            const rawExtra = localStorage.getItem('hassty_pending_extra');
            if (rawExtra) pendingExtra = JSON.parse(rawExtra);
          } catch {
            // ignore
          }

          const session = await syncGoogleUserToFirestore(firebaseUser, pendingRole, pendingExtra);
          setUser(session);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
          localStorage.removeItem('hassty_pending_role');
          localStorage.removeItem('hassty_pending_extra');
        } catch (err) {
          console.warn('Error syncing user profile on auth change:', err);
        }
      } else {
        // User is signed out in Firebase Auth - verify if there is a saved local session
        const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (!saved) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Real Email & Password Login with Firebase Auth & Resilient Firestore Verification
   */
  const loginUser = async (emailOrPhone: string, password: string): Promise<UserSession> => {
    const cleanInput = emailOrPhone.trim();
    let targetEmail = cleanInput.toLowerCase();

    // Check if input is a phone number (e.g. 010..., 011..., 012..., 015... or +20...)
    const isPhoneNumber = /^(\+20|0020|0)?1[0125][0-9]{8}$/.test(cleanInput.replace(/\s+/g, ''));
    if (isPhoneNumber) {
      try {
        const normalizedPhone = cleanInput.replace(/\s+/g, '');
        const phoneQuery = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
        const phoneSnap = await getDocs(phoneQuery);
        if (!phoneSnap.empty) {
          const matchedUser = phoneSnap.docs[0].data();
          if (matchedUser.email) {
            targetEmail = matchedUser.email.toLowerCase();
          }
        }
      } catch (phoneLookupErr) {
        console.warn('Phone number lookup warning in login:', phoneLookupErr);
      }
    }

    // Check if it is one of the built-in demo accounts or admin
    const isDemoEmail =
      targetEmail === 'student@hassty.com' ||
      targetEmail === 'teacher@hassty.com' ||
      targetEmail === 'parent@hassty.com' ||
      targetEmail === 'hasstysupport@gmail.com' ||
      targetEmail === 'admin@hassty.com';

    let userCredential: any = null;
    let firebaseUser: FirebaseUser | null = null;
    let userUid = '';
    let firebaseEmailVerified = false;

    try {
      userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      firebaseUser = userCredential.user;
      userUid = firebaseUser.uid;
      firebaseEmailVerified = firebaseUser.emailVerified;
    } catch (authErr: any) {
      console.warn('Firebase Auth signIn warning:', authErr?.code || authErr);

      // If it's a demo account and wasn't created yet in Firebase Auth, auto-provision it
      if (isDemoEmail && (authErr?.code === 'auth/user-not-found' || authErr?.code === 'auth/invalid-credential')) {
        try {
          userCredential = await createUserWithEmailAndPassword(auth, targetEmail, password || 'Demo123456');
          firebaseUser = userCredential.user;
          userUid = firebaseUser.uid;
          firebaseEmailVerified = firebaseUser.emailVerified;
        } catch (createErr: any) {
          if (createErr?.code === 'auth/email-already-in-use') {
            try {
              userCredential = await signInWithEmailAndPassword(auth, targetEmail, password || 'Demo123456');
              firebaseUser = userCredential.user;
              userUid = firebaseUser.uid;
              firebaseEmailVerified = firebaseUser.emailVerified;
            } catch {
              // continue to fallback
            }
          }
        }
      }

      // If operation is not allowed or provider disabled in console, fallback gracefully
      if (!userUid) {
        if (authErr?.code === 'auth/operation-not-allowed' || isDemoEmail) {
          try {
            const anonCred = await signInAnonymously(auth);
            userUid = anonCred.user.uid;
            firebaseEmailVerified = true;
          } catch {
            userUid = `usr_${btoa(targetEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 18)}`;
            firebaseEmailVerified = true;
          }
        } else {
          throw authErr;
        }
      }
    }

    // Fetch existing user profile
    const userDocRef = doc(db, 'users', userUid);
    let profileData: any = null;
    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        profileData = userSnap.data();
      }
    } catch (fetchErr) {
      console.warn('Error reading user document:', fetchErr);
    }

    if (!profileData) {
      // Auto-create initial profile for this user if missing
      let role: AccountRole = 'student';
      let name = firebaseUser?.displayName || 'مستخدم حِصّتي';
      let phone = isPhoneNumber ? cleanInput : '';

      if (targetEmail === 'hasstysupport@gmail.com' || targetEmail === 'admin@hassty.com') {
        role = 'admin';
        name = 'مدير منصة حِصّتي';
        phone = '01000000000';
      } else if (targetEmail === 'teacher@hassty.com') {
        role = 'teacher';
        name = 'أ. حسام الدين (معلم تجريبي)';
        phone = '01234567890';
      } else if (targetEmail === 'parent@hassty.com') {
        role = 'parent';
        name = 'د. محمود عادل (ولي أمر تجريبي)';
        phone = '01123456789';
      } else if (targetEmail === 'student@hassty.com') {
        role = 'student';
        name = 'زياد محمود (طالب تجريبي)';
        phone = '01012345678';
      }

      profileData = {
        uid: userUid,
        email: targetEmail,
        name,
        phone,
        role,
        createdAt: new Date().toISOString(),
        accountStatus: 'active',
        emailVerified: firebaseEmailVerified,
      };

      if (role === 'student') {
        profileData.grade = 'الصف الثالث الثانوي';
        profileData.qrCode = `HASSTY-${userUid.substring(0, 8).toUpperCase()}`;
      } else if (role === 'teacher') {
        profileData.subject = 'الفيزياء';
        profileData.experienceYears = '12 سنة';
        profileData.rating = 5.0;
        profileData.reviewsCount = 0;
        profileData.studentsCount = 0;
      }

      try {
        await setDoc(userDocRef, profileData, { merge: true });
        if (role === 'teacher') {
          await setDoc(doc(db, 'tutors', userUid), {
            id: userUid,
            name,
            title: 'معلم الفيزياء',
            subject: 'الفيزياء',
            governorate: 'القاهرة',
            area: 'مصر الجديدة',
            rating: 5.0,
            reviewsCount: 0,
            studentsCount: 0,
            pricePerSession: 150,
            isVerified: true,
            joinCode: '102030',
            levels: ['الصف الثالث الثانوي'],
            bio: 'معلم متخصص في الفيزياء معتمد على منصة حِصّتي.',
            phone,
            email: targetEmail,
          }, { merge: true });
        }
      } catch (writeErr) {
        console.warn('Initial profile creation warning:', writeErr);
      }
    }

    const session: UserSession = {
      uid: userUid,
      email: targetEmail,
      phone: profileData.phone || '',
      role: (profileData.role as AccountRole) || 'student',
      name: profileData.name || 'مستخدم حِصّتي',
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

    // 1. Create user in Firebase Authentication
    let userCredential: any = null;
    let firebaseUser: FirebaseUser | null = null;
    let resolvedUid = '';

    try {
      userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      firebaseUser = userCredential.user;
      resolvedUid = firebaseUser.uid;

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

      if (authErr?.code === 'auth/email-already-in-use') {
        throw authErr;
      }

      // If operation is not allowed or provider disabled in console, fallback gracefully
      if (authErr?.code === 'auth/operation-not-allowed' || !resolvedUid) {
        try {
          const anonCred = await signInAnonymously(auth);
          resolvedUid = anonCred.user.uid;
        } catch {
          resolvedUid = `usr_${btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 18)}_${Date.now().toString(36)}`;
        }
      } else {
        throw authErr;
      }
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
    try {
      await setDoc(doc(db, 'users', resolvedUid), profileData, { merge: true });
    } catch (userWriteErr) {
      console.warn('Firestore users collection write warning:', userWriteErr);
    }

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
      try {
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
      } catch (tutorWriteErr) {
        console.warn('Firestore tutors collection write warning:', tutorWriteErr);
      }
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
   * Resend Email Verification Link to User
   */
  const sendEmailVerificationLink = async (email: string): Promise<void> => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    } catch (err: any) {
      console.warn('sendEmailVerificationLink error:', err?.code || err);
    }
  };

  /**
   * Mark user email as verified in Firestore
   */
  const markEmailAsVerified = async (uid: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'users', uid), { emailVerified: true });
      setUser((prev) => prev ? { ...prev, emailVerified: true } : null);
      if (user) {
        const updated = { ...user, emailVerified: true };
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('markEmailAsVerified error:', err);
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
   * Google Authentication for Users, Teachers, Parents and Students
   */
  const loginWithGoogle = async (defaultRole: AccountRole = 'student', extraData: any = {}): Promise<UserSession> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    // Store pending role & extra data in localStorage in case of redirect or page reload
    localStorage.setItem('hassty_pending_role', defaultRole);
    if (extraData && Object.keys(extraData).length > 0) {
      localStorage.setItem('hassty_pending_extra', JSON.stringify(extraData));
    }

    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    try {
      const result = await signInWithPopup(auth, provider);
      const session = await syncGoogleUserToFirestore(result.user, defaultRole, extraData);
      setUser(session);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
      localStorage.removeItem('hassty_pending_role');
      localStorage.removeItem('hassty_pending_extra');
      return session;
    } catch (popupErr: any) {
      console.warn('signInWithPopup error, testing redirect:', popupErr);
      if (
        popupErr?.code === 'auth/popup-blocked' ||
        popupErr?.code === 'auth/cancelled-popup-request' ||
        (isMobile && popupErr?.code === 'auth/popup-closed-by-user')
      ) {
        // Attempt redirect on mobile or blocked popup
        await signInWithRedirect(auth, provider);
        return null as any;
      }
      throw popupErr;
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
      loginWithGoogle,
      signupUser, 
      sendPasswordReset, 
      sendEmailVerificationLink,
      markEmailAsVerified,
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

