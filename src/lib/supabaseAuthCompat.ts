import { supabase } from './supabase';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: any[];
}

const mapUser = (u: any): User => ({
  uid: u.id,
  email: u.email ?? null,
  displayName: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
  photoURL: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null,
  emailVerified: Boolean(u.email_confirmed_at),
  providerData: u.identities ?? [],
});

export const auth: { currentUser: User | null } = { currentUser: null };

export async function signInWithPopup(_auth: any, provider: any) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider?.provider || 'google',
    options: { redirectTo: `${window.location.origin}/` },
  });
  if (error) throw error;
  return { user: auth.currentUser };
}

export async function signInWithRedirect(_auth: any, provider: any) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider?.provider || 'google',
    options: { redirectTo: `${window.location.origin}/` },
  });
  if (error) throw error;
  return null as any;
}

export async function getRedirectResult(_auth: any) {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  auth.currentUser = mapUser(data.user);
  return { user: auth.currentUser };
}

export class GoogleAuthProvider {
  provider = 'google';
  setCustomParameters(_params: Record<string, string>) {}
}

export function onAuthStateChanged(_auth: any, callback: (user: User | null) => void) {
  if (!supabase) {
    callback(null);
    return () => {};
  }
  supabase.auth.getUser().then(({ data }) => {
    auth.currentUser = data.user ? mapUser(data.user) : null;
    callback(auth.currentUser);
  });
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    auth.currentUser = session?.user ? mapUser(session.user) : null;
    callback(auth.currentUser);
  });
  return () => data.subscription.unsubscribe();
}

export async function signOut(_auth: any) {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  auth.currentUser = null;
}

export async function sendEmailVerification(user: { email?: string | null } | User) {
  if (!supabase || !user.email) throw new Error('لا يوجد بريد إلكتروني للحساب');
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
    options: { emailRedirectTo: `${window.location.origin}/verify-email` },
  });
  if (error) throw error;
}

export async function reload(_user?: any) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  auth.currentUser = data.user ? mapUser(data.user) : null;
  return auth.currentUser;
}

export async function verifyOtp(params: any) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.verifyOtp(params);
  if (error) throw error;
  auth.currentUser = data.user ? mapUser(data.user) : auth.currentUser;
  return data;
}
