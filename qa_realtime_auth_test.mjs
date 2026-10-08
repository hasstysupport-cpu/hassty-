#!/usr/bin/env node
/* اختبار Realtime بجلسة مستخدم حقيقية — نفس إعداد تطبيق hassty تمامًا */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const ANON = readFileSync('/home/z/my-project/scripts/anon_key.txt', 'utf8').trim();
const URL = 'https://mxryrgoxofsvjsvpxzew.supabase.co';

const supabase = createClient(URL, ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    storageKey: 'hassty-supabase-auth',
  },
  realtime: { params: { eventsPerSecond: 5 } },
});

const main = async () => {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'hassty.qa.teacher7@gmail.com',
    password: 'Qa#Test2026x',
  });
  if (authErr) { console.log('auth error:', authErr.message); return; }
  console.log('signed in as', auth.user.email);

  const channel = supabase
    .channel(`teacher-payments-${auth.user.id}-${Date.now().toString(36)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_tiers' }, (p) => {
      console.log('EVENT ARRIVED:', p.event, p.new?.id, p.new?.rate_pct);
      process.exit(0);
    })
    .subscribe((status, err) => console.log('channel status:', status, err || ''));

  setTimeout(() => { console.log('TIMEOUT: no event in 30s'); process.exit(1); }, 30000);
};

main();
