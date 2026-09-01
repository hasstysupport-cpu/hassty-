import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccountRole } from '../types';
import { supabase } from './supabase';
import { authApi, getDeviceId, setStoredToken } from './authApi';
import type { RegisterPayload } from './authApi';

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

export type LoginFlowResult =
  | { status: 'complete'; session: UserSession }
  | { status: 'otp_required'; email: string; name: string }
  | { status: 'unconfirmed'; email: string; name: string };

interface SignupData extends Omit<RegisterPayload, 'consent'> {}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  /** Password login → returns next step (direct / OTP / activation) */
  beginPasswordLogin: (email: string, password: string) => Promise<LoginFlowResult>;
  /** Re-login after a successful OTP/activation step (password kept in caller memory) */
  finishPasswordLogin: (email: string, password: string) => Promise<UserSession>;
  loginWithGoogle: (defaultRole?: AccountRole, extraData?: any) => Promise<UserSession | null>;
  /** Server-side registration → pending account + emailed code */
  signupUser: (data: SignupData) => Promise<{ ok: boolean; userId?: string; maskedEmail?: string; expiresIn?: number; error?: string; code?: string }>;
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

function cleanOAuthUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  let changed = false;
  if (url.searchParams.has('googleLogin')) {
    url.searchParams.delete('googleLogin');
    changed = true;
  }
  if (window.location.hash) {
    url.hash = '';
    changed = true;
  }
  if (changed) window.history.replaceState({}, document.title, url.pathname + url.search);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  /* during the 2-step login (password → OTP) the intermediate session must NOT
     be persisted — the auth listener is suppressed until the flow completes */
  const suppressAuthEvents = useRef(false);

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
        const profile = await getProfile(data.session.user.id);
        persistSession(mapProfileToSession(data.session.user, profile));
        cleanOAuthUrl();
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
      if (suppressAuthEvents.current) return; // login flow owns persistence
      if (!mounted) return;
      if (!authSession?.user) {
        persistSession(null);
        return;
      }
      try {
        const profile = await getProfile(authSession.user.id);
        persistSession(mapProfileToSession(authSession.user, profile));
        cleanOAuthUrl();
      } catch (error) {
        console.warn('Auth profile sync warning:', error);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ================= PASSWORD LOGIN (2-step) ================= */
  const beginPasswordLogin = async (email: string, password: string): Promise<LoginFlowResult> => {
    if (!supabase) throw new Error('Supabase غير مُهيأ.');
    const cleanEmail = email.trim().toLowerCase();
    suppressAuthEvents.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        const msg = String(error.message || '');
        if (msg.includes('Email not confirmed')) {
          return { status: 'unconfirmed', email: cleanEmail, name: '' };
        }
        throw error;
      }
      const user = data.user;
      if (!user) throw new Error('تعذر تسجيل الدخول.');

      const profile = await getProfile(user.id);

      /* confirmed user without a profile (legacy / google) → let the app route
         them to profile setup instead of hard-failing */
      if (!profile) {
        if (!user.email_confirmed_at) {
          await supabase.auth.signOut();
          return { status: 'unconfirmed', email: cleanEmail, name: user.user_metadata?.full_name || '' };
        }
        const session = mapProfileToSession(user, null);
        persistSession(session);
        return { status: 'complete', session };
      }

      /* new-device check → OTP (session revoked until the code is confirmed) */
      if (user.email_confirmed_at) {
        try {
          const check = await authApi.loginCheck(getDeviceId());
          if (check.ok && check.otpRequired) {
            await supabase.auth.signOut();
            return { status: 'otp_required', email: cleanEmail, name: profile.full_name || '' };
          }
        } catch (e: any) {
          // network hiccup — Supabase already verified the password; proceed safely
          console.warn('login-check warning:', e?.message || e);
        }
      }

      const session = mapProfileToSession(user, profile);
      persistSession(session);
      return { status: 'complete', session };
    } finally {
      suppressAuthEvents.current = false;
    }
  };

  /* Re-login after OTP / activation success (password stays in the caller's memory) */
  const finishPasswordLogin = async (email: string, password: string): Promise<UserSession> => {
    if (!supabase) throw new Error('Supabase غير مُهيأ.');
    suppressAuthEvents.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      if (!data.user) throw new Error('تعذر إكمال تسجيل الدخول.');
      const { data: authUser } = await supabase.auth.getUser();
      const profile = await getProfile(data.user.id);
      const session = profile
        ? mapProfileToSession(data.user, profile)
        : mapProfileToSession(authUser?.user || data.user, null);
      persistSession(session);
      return session;
    } finally {
      suppressAuthEvents.current = false;
    }
  };

  /* ================= GOOGLE ================= */
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

    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } },
    });
    if (error) throw error;
    if (!data.url) throw new Error('تعذر فتح Google.');
    return null;
  };

  /* ================= SIGNUP (server-side) ================= */
  const signupUser = async (data: SignupData) => {
    const res = await authApi.register({ ...data, consent: true });
    return res;
  };

  const updateUserProfile = async (updates: Partial<any>) => {
    if (!supabase || !user?.uid) throw new Error('لا يوجد مستخدم مسجل.');
    const metadataPatch = { ...(user.profileData || {}), ...(updates.profileData || {}) };
    delete (metadataPatch as any).role;

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

  const value = useMemo(
    () => ({ user, loading, beginPasswordLogin, finishPasswordLogin, loginWithGoogle, signupUser, updateUserProfile, logout }),
    [user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export { setStoredToken };
