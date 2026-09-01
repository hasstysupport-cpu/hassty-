import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccountRole } from '../types';
import { supabase } from './supabase';
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
  loginWithGoogle: (defaultRole?: AccountRole, extraData?: any) => Promise<UserSession | null>;
  signupUser: (data: SignupData) => Promise<UserSession>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendEmailVerificationLink: (email: string) => Promise<void>;
  markEmailAsVerified: (uid: string) => Promise<void>;
  updateUserProfile: (data: Partial<any>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PENDING_GOOGLE_ROLE_KEY = 'hassty_pending_role';
const PENDING_GOOGLE_EXTRA_KEY = 'hassty_pending_extra';
const GOOGLE_LOGIN_STARTED_KEY = 'hassty_google_login_started_at';

const normalizeRole = (value: any): AccountRole | null => {
  return value === 'student' || value === 'parent' || value === 'teacher' || value === 'assistant' || value === 'admin' ? value : null;
};

const mapProfileToSession = (authUser: any, profile: any, roleOverride?: AccountRole | null): UserSession => {
  const role = roleOverride ?? normalizeRole(profile?.role) ?? 'student';
  const metadata = (profile?.metadata || {}) as Record<string, any>;
  return {
    uid: authUser.id,
    email: authUser.email || profile?.email || '',
    phone: profile?.phone || '',
    role,
    name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
    avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
    governorate: profile?.governorate || '',
    area: profile?.city || '',
    profileData: {
      ...metadata,
      grade: profile?.grade || metadata.grade || '',
      role: profile?.role ?? null,
      isVerified: metadata.isVerified ?? false,
      verificationStatus: metadata.verificationStatus || 'not_submitted',
      qrCode: profile?.qr_code || metadata.qrCode || '',
    },
    emailVerified: Boolean(authUser.email_confirmed_at),
  };
};

async function getProfile(uid: string) {
  if (!supabase) throw new Error('Supabase غير مُهيأ.');
  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,phone,email,role,avatar_url,qr_code,governorate,city,grade,account_status,badge,metadata')
    .eq('id', uid)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertProfile(uid: string, values: Record<string, any>) {
  if (!supabase) throw new Error('Supabase غير مُهيأ.');
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: uid, ...values }, { onConflict: 'id' })
    .select('id,full_name,phone,email,role,avatar_url,qr_code,governorate,city,grade,account_status,badge,metadata')
    .single();
  if (error) throw error;
  return data;
}

async function buildSession(authUser: any): Promise<UserSession> {
  const profile = await getProfile(authUser.id);
  return mapProfileToSession(authUser, profile);
}

function cleanOAuthUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  let changed = false;
  if (url.searchParams.has('googleLogin')) {
    url.searchParams.delete('googleLogin');
    changed = true;
  }
  if (window.location.hash) {
    // supabase-js consumes the OAuth fragment; remove any leftover fragment.
    url.hash = '';
    changed = true;
  }
  if (changed) window.history.replaceState({}, document.title, url.pathname + url.search);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = (session: UserSession | null) => {
    setUser(session);
    if (typeof window !== 'undefined') {
      if (session) localStorage.setItem('hassty_user_session', JSON.stringify(session));
      else localStorage.removeItem('hassty_user_session');
    }
  };

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      if (!supabase) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) throw error;
        if (!data.session?.user) {
          persistSession(null);
          return;
        }
        const session = await buildSession(data.session.user);
        if (mounted) {
          persistSession(session);
          cleanOAuthUrl();
        }
      } catch (error) {
        console.warn('Auth hydration warning:', error);
        try {
          const stored = typeof window !== 'undefined' ? localStorage.getItem('hassty_user_session') : null;
          const parsed = stored ? JSON.parse(stored) : null;
          if (mounted && parsed?.uid) persistSession(parsed as UserSession);
        } catch {}
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void hydrate();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
      if (!mounted) return;
      if (!authSession?.user) {
        persistSession(null);
        return;
      }
      try {
        const profile = await getProfile(authSession.user.id);
        const next = mapProfileToSession(authSession.user, profile);
        if (mounted) {
          persistSession(next);
          cleanOAuthUrl();
        }
      } catch (error) {
        console.warn('Auth profile sync warning:', error);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loginUser = async (email: string, password: string): Promise<UserSession> => {
    if (!supabase) throw new Error('Supabase غير مُهيأ.');
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) throw error;
    if (!data.user) throw new Error('تعذر تسجيل الدخول.');
    const profile = await getProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('الحساب موجود في المصادقة لكن ملف الحساب غير مكتمل. استخدم إنشاء حساب لإكماله.');
    }
    const session = mapProfileToSession(data.user, profile);
    persistSession(session);
    return session;
  };

  const signupUser = async (data: SignupData): Promise<UserSession> => {
    if (!supabase) throw new Error('Supabase غير مُهيأ.');
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const cleanPhone = data.phone.trim();
    if (!cleanEmail || !cleanName || !cleanPhone) throw new Error('من فضلك أكمل البيانات الأساسية.');

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: data.password,
      options: {
        data: { full_name: cleanName, avatar_url: data.avatarUrl || null, role: data.role },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/verify-email` : undefined,
      },
    });
    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('لم يتم إنشاء الحساب.');

    const metadata: Record<string, any> = {
      authProvider: 'email',
      subject: data.subject || '',
      experienceYears: data.experience || '',
      parentPhone: data.parentPhone || '',
      onboardingComplete: true,
      isVerified: false,
      verificationStatus: data.role === 'teacher' ? 'pending' : 'not_required',
    };

    const hasActiveSession = Boolean(authData.session);
    let profile: any = {
      id: authData.user.id,
      email: cleanEmail,
      full_name: cleanName,
      phone: cleanPhone,
      role: data.role,
      avatar_url: data.avatarUrl || null,
      governorate: data.governorate || null,
      city: data.area || null,
      grade: data.grade || null,
      account_status: 'active',
      badge: null,
      qr_code: null,
      metadata,
    };

    if (hasActiveSession) {
      profile = await upsertProfile(authData.user.id, profile);
    } else {
      try {
        const provisioned = await getProfile(authData.user.id);
        if (provisioned) profile = provisioned;
      } catch {}
    }

    if (data.role === 'student' && hasActiveSession) {
      const qrCode = `HASSTY-${authData.user.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
      await upsertProfile(authData.user.id, { qr_code: qrCode, metadata: { ...metadata, qrCode } });
      profile = { ...profile, qr_code: qrCode, metadata: { ...metadata, qrCode } };
    }

    if (data.role === 'teacher' && hasActiveSession) {
      const { error: tutorError } = await supabase.from('tutor_profiles').upsert({
        user_id: authData.user.id,
        title: `معلم ${data.subject || 'المادة'}`,
        headline: `معلم ${data.subject || 'المادة'}`,
        bio: '',
        subjects: data.subject ? [data.subject] : [],
        grades: data.grade ? [data.grade] : [],
        experience_years: Number(data.experience || 0) || 0,
        governorate: data.governorate || null,
        city: data.area || null,
        price_per_session: 0,
        is_verified: false,
        verification_status: 'pending',
      }, { onConflict: 'user_id' });
      if (tutorError) throw tutorError;
    }

    if (data.role === 'parent' && data.studentJoinCode?.trim() && hasActiveSession) {
      await sendParentLinkRequest({ uid: authData.user.id, name: cleanName, phone: cleanPhone, email: cleanEmail, avatarUrl: data.avatarUrl || '' }, data.studentJoinCode.trim());
    }

    const session = mapProfileToSession(authData.user, profile, data.role);
    persistSession(session);
    return session;
  };

  const loginWithGoogle = async (defaultRole?: AccountRole, extraData: any = {}): Promise<UserSession | null> => {
    if (!supabase) throw new Error('Supabase غير مُهيأ.');
    if (typeof window !== 'undefined') {
      localStorage.setItem(GOOGLE_LOGIN_STARTED_KEY, String(Date.now()));
      localStorage.removeItem('hassty_google_auth_error');
      if (defaultRole) localStorage.setItem(PENDING_GOOGLE_ROLE_KEY, defaultRole);
      else localStorage.removeItem(PENDING_GOOGLE_ROLE_KEY);
      if (Object.keys(extraData || {}).length) localStorage.setItem(PENDING_GOOGLE_EXTRA_KEY, JSON.stringify(extraData));
      else localStorage.removeItem(PENDING_GOOGLE_EXTRA_KEY);
    }

    // Return to the clean origin. supabase-js handles the OAuth callback/session
    // in the browser, so no googleLogin query flag is needed.
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } },
    });
    if (error) throw error;
    if (!data.url) throw new Error('تعذر فتح Google.');
    return null;
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase غير مُهيأ.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` });
    if (error) throw error;
  };

  const sendEmailVerificationLink = async (email: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase غير مُهيأ.');
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/verify-email` } });
    if (error) throw error;
  };

  const markEmailAsVerified = async (uid: string): Promise<void> => {
    if (!supabase || !uid) return;
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user || data.user.id !== uid) return;
    const session = await buildSession(data.user);
    persistSession({ ...session, emailVerified: true });
  };

  const updateUserProfile = async (updates: Partial<any>) => {
    if (!supabase || !user?.uid) throw new Error('لا يوجد مستخدم مسجل.');
    const metadataPatch = { ...(user.profileData || {}), ...(updates.profileData || {}) };
    delete (metadataPatch as any).role;
    // Teachers complete their profile through ProfileSetupPage, which sends
    // subject/experienceYears/bio as top-level updates. Persist them into
    // profiles.metadata as well, otherwise App's profile-completion check
    // (metadata.subject) never passes and email teachers stay stuck on
    // /setup-profile forever. The Google first-login path already writes them.
    if (updates.subject !== undefined) metadataPatch.subject = updates.subject;
    if (updates.experienceYears !== undefined) metadataPatch.experienceYears = String(updates.experienceYears ?? '');
    if (updates.bio !== undefined) metadataPatch.bio = updates.bio;

    const profilePatch: Record<string, any> = {
      ...(updates.name !== undefined ? { full_name: updates.name } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.avatarUrl !== undefined ? { avatar_url: updates.avatarUrl } : {}),
      ...(updates.governorate !== undefined ? { governorate: updates.governorate } : {}),
      ...(updates.area !== undefined ? { city: updates.area } : {}),
      ...(updates.grade !== undefined ? { grade: updates.grade } : {}),
      metadata: metadataPatch,
    };

    const profile = await upsertProfile(user.uid, profilePatch);

    if (user.role === 'teacher') {
      const tutorPatch: Record<string, any> = {
        user_id: user.uid,
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.headline !== undefined ? { headline: updates.headline } : {}),
        ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
        ...(updates.subject !== undefined ? { subjects: [updates.subject] } : {}),
        ...(updates.grade !== undefined ? { grades: [updates.grade] } : {}),
        ...(updates.experienceYears !== undefined ? { experience_years: Number(updates.experienceYears) || 0 } : {}),
        ...(updates.governorate !== undefined ? { governorate: updates.governorate } : {}),
        ...(updates.area !== undefined ? { city: updates.area } : {}),
      };
      const { error } = await supabase.from('tutor_profiles').upsert(tutorPatch, { onConflict: 'user_id' });
      if (error) throw error;
    }

    if (updates.name !== undefined || updates.avatarUrl !== undefined) {
      const { error } = await supabase.auth.updateUser({ data: { full_name: updates.name ?? user.name, avatar_url: updates.avatarUrl ?? user.avatarUrl ?? null } });
      if (error) throw error;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) persistSession(mapProfileToSession(authData.user, profile, normalizeRole(profile.role)));
  };

  const logout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('Supabase signOut warning:', error);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PENDING_GOOGLE_ROLE_KEY);
      localStorage.removeItem(PENDING_GOOGLE_EXTRA_KEY);
      localStorage.removeItem(GOOGLE_LOGIN_STARTED_KEY);
    }
    persistSession(null);
  };

  const value = useMemo(() => ({ user, loading, loginUser, loginWithGoogle, signupUser, sendPasswordReset, sendEmailVerificationLink, markEmailAsVerified, updateUserProfile, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
