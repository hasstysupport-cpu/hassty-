import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Prevents a newly authenticated account from briefly landing on a role dashboard
 * before the canonical Supabase profile has been completed.
 */
export function ProfileCompletionGate() {
  useEffect(() => {
    if (!supabase) return;

    let disposed = false;
    let channel: { unsubscribe?: () => void } | null = null;

    const check = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;
      if (!authUser || disposed) return;

      const provider = String(authUser.app_metadata?.provider || authUser.app_metadata?.providers?.[0] || '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('id,full_name,phone,governorate,city,grade,role,metadata,account_status')
        .eq('id', authUser.id)
        .maybeSingle();

      if (disposed || !profile) return;

      const metadata = (profile.metadata || {}) as Record<string, unknown>;
      const commonComplete = Boolean(
        String(profile.full_name || '').trim() &&
        String(profile.phone || '').trim() &&
        String(profile.governorate || '').trim() &&
        String(profile.city || '').trim()
      );
      const role = String(profile.role || 'student');
      const roleComplete = role === 'teacher'
        ? Boolean(String(metadata.subject || '').trim() && String(metadata.experienceYears || '').trim())
        : role === 'student'
          ? Boolean(String(profile.grade || metadata.grade || '').trim())
          : role === 'parent';

      const incomplete = !Boolean(metadata.onboardingCompleted) || !commonComplete || !roleComplete;
      const path = window.location.pathname;

      if (incomplete && provider === 'google' && path !== '/setup-profile' && !path.startsWith('/admin')) {
        localStorage.setItem('hassty_google_login_started_at', String(Date.now()));
        localStorage.setItem('hassty_google_profile_setup', '1');
        window.history.replaceState({}, '', '/setup-profile');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };

    void check();
    const authSubscription = supabase.auth.onAuthStateChange(() => { void check(); });
    channel = authSubscription.data.subscription;

    return () => {
      disposed = true;
      channel?.unsubscribe?.();
    };
  }, []);

  return null;
}
