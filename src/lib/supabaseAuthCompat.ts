import { supabase } from './supabase';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: any[];
}

const currentUser = async (): Promise<User | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? mapUser(data.user) : null;
};
const mapUser = (u:any): User => ({ uid:u.id, email:u.email ?? null, displayName:u.user_metadata?.full_name ?? u.user_metadata?.name ?? null, photoURL:u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null, emailVerified:!!u.email_confirmed_at, providerData:u.identities ?? [] });

export const auth: any = { currentUser: null };

export async function createUserWithEmailAndPassword(_auth:any, email:string, password:string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/verify-email` : undefined } });
  if (error) throw error;
  return { user: data.user ? mapUser(data.user) : null, session: data.session };
}
export async function signInAnonymously(_auth:any) { throw new Error('Anonymous sign-in is disabled. Please sign in with an email account.'); }
export async function signInWithEmailAndPassword(_auth:any, email:string, password:string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: mapUser(data.user), session: data.session };
}
export async function signInWithPopup(_auth:any, provider:any) { return signInWithRedirect(_auth, provider); }
export async function signInWithRedirect(_auth:any, provider:any) {
  if (!supabase) throw new Error('Supabase is not configured');
  const providerName = provider?.provider || 'google';
  const { error } = await supabase.auth.signInWithOAuth({ provider: providerName, options: { redirectTo: `${window.location.origin}/` } });
  if (error) throw error;
  return null as any;
}
export async function getRedirectResult(_auth:any) { return null; }
export class GoogleAuthProvider { provider = 'google'; setCustomParameters(_params:any) {} }
export async function signOut(_auth:any) { if (supabase) await supabase.auth.signOut(); }
export async function sendPasswordResetEmail(_auth:any, email:string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
  if (error) throw error;
}
export async function sendEmailVerification(user:any) {
  if (!supabase) throw new Error('Supabase is not configured');
  const email = user?.email;
  if (!email) throw new Error('لا يوجد بريد إلكتروني للحساب');
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/verify-email` } });
  if (error) throw error;
}
export async function verifyOtp(params: any) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.verifyOtp(params);
  if (error) throw error;
  return data;
}
export async function reload(_user:any) { return currentUser(); }
export async function updateProfile(user:any, patch:any) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.updateUser({ data: { ...(user?.user_metadata || {}), ...(patch.displayName !== undefined ? { full_name: patch.displayName } : {}), ...(patch.photoURL !== undefined ? { avatar_url: patch.photoURL } : {}) } });
  if (error) throw error;
}
export function onAuthStateChanged(_auth:any, callback:(user:User|null)=>void) {
  let active = true;
  currentUser().then(u => { auth.currentUser = u; if(active) callback(u); });
  const sub = supabase?.auth.onAuthStateChange((_event, session) => { auth.currentUser = session?.user ? mapUser(session.user) : null; if(active) callback(auth.currentUser); });
  return () => { active = false; sub?.data?.subscription?.unsubscribe(); };
}
