/* ============================================================
   GET /api/sitemap  (يُقدَّم عبر rewrite من /sitemap.xml)
   خريطة موقع ديناميكية: المسارات العامة الثابتة + صفحات كل
   المدرسين الموثقين المعتمدين (من نفس عوامل التصفية العامة)
   بحيث تكتشف محركات البحث بروفايلات المدرسين تلقائيًا.
   - يُخزَّن مؤقتًا ساعة لدى CDN (s-maxage) لتقليل الاستعلامات
   - في حال فشل الاستعلام يعود بخريطة المسارات الثابتة فقط
   ============================================================ */
import { SUPABASE_URL, SERVICE_KEY, SITE_URL } from './_lib/config.js';

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', freq: 'daily' },
  { path: '/search', priority: '0.95', freq: 'daily' },
  { path: '/for-teachers', priority: '0.85', freq: 'weekly' },
  { path: '/about', priority: '0.75', freq: 'monthly' },
  { path: '/contact', priority: '0.70', freq: 'monthly' },
  { path: '/signup', priority: '0.65', freq: 'monthly' },
  { path: '/login', priority: '0.60', freq: 'monthly' },
  { path: '/assistant/signup', priority: '0.55', freq: 'monthly' },
  { path: '/legal/terms', priority: '0.35', freq: 'yearly' },
  { path: '/legal/privacy', priority: '0.35', freq: 'yearly' },
  { path: '/legal/teacher', priority: '0.35', freq: 'yearly' },
  { path: '/legal/cookies', priority: '0.30', freq: 'yearly' },
  { path: '/legal/acceptable', priority: '0.30', freq: 'yearly' },
  { path: '/legal/refund', priority: '0.30', freq: 'yearly' },
  { path: '/legal/rights', priority: '0.30', freq: 'yearly' },
];

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

async function fetchVerifiedTutorIds() {
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  // 1) معرّفات المدرسين الظاهرين للعامة (نفس منطق البحث العام: موثق + معتمد)
  const vRes = await fetch(`${SUPABASE_URL}/rest/v1/public_verified_teachers?select=id`, { headers });
  if (!vRes.ok) return [];
  const tutors = await vRes.json();
  const ids = (Array.isArray(tutors) ? tutors : []).map((t) => t && t.id).filter(Boolean);
  if (!ids.length) return [];

  // 2) تاريخ آخر تحديث لكل بروفايل (lastmod دقيق لخريطة الموقع)
  const lastmodMap = {};
  try {
    const inFilter = `(${ids.map((id) => `"${id}"`).join(',')})`;
    const pRes = await fetch(
      `${SUPABASE_URL}/rest/v1/tutor_profiles?select=user_id,updated_at&user_id=in.${inFilter}`,
      { headers }
    );
    if (pRes.ok) {
      const rows = await pRes.json();
      for (const row of rows || []) {
        if (row.user_id && row.updated_at) lastmodMap[row.user_id] = String(row.updated_at).slice(0, 10);
      }
    }
  } catch { /* lastmod اختياري */ }
  return ids.map((id) => ({ id, lastmod: lastmodMap[id] || null }));
}

export default async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  let tutorUrls = [];
  try { tutorUrls = await fetchVerifiedTutorIds(); } catch { tutorUrls = []; }

  const urls = [
    ...STATIC_ROUTES.map((r) => ({ loc: `${SITE_URL}${r.path}`, lastmod: today, priority: r.priority, freq: r.freq })),
    ...tutorUrls.map((t) => ({ loc: `${SITE_URL}/tutor/${encodeURIComponent(t.id)}`, lastmod: t.lastmod || today, priority: '0.80', freq: 'weekly' })),
  ];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n` +
          `    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n` +
          `    <xhtml:link rel="alternate" hreflang="ar" href="${esc(u.loc)}" />\n` +
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(u.loc)}" />\n  </url>`
      )
      .join('\n') +
    '\n</urlset>\n';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(xml);
}
