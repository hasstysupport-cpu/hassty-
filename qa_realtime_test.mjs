#!/usr/bin/env node
/* اختبار Realtime مباشر: هل تصل أحداث commission_tiers عبر WS؟ */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const ANON = readFileSync('/home/z/my-project/scripts/anon_key.txt', 'utf8').trim();
const URL = 'https://mxryrgoxofsvjsvpxzew.supabase.co';

const supabase = createClient(URL, ANON, {
  realtime: { params: { eventsPerSecond: 5 } },
});

const channel = supabase
  .channel('qa-tier-test')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_tiers' }, (payload) => {
    console.log('EVENT:', JSON.stringify({ event: payload.event, id: payload.new?.id, rate: payload.new?.rate_pct }).slice(0, 200));
    process.exit(0);
  })
  .subscribe((status) => console.log('channel status:', status));

setTimeout(() => { console.log('TIMEOUT - no event in 25s'); process.exit(1); }, 25000);
