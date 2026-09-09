/* ============================================================
   GET /tutor/:id  (تُوجَّه هنا عبر rewrite في vercel.json)
   ميتا ديناميكية لبروفايلات المدرسين: عنوان ووصف وصورة Open Graph
   وJSON-LD (ProfilePage + Person + AggregateRating الحقيقي) لكل مدرس
   — حتى تُفهرس البروفايلات صح وتظهر بروفايل مصغّر جميل عند مشاركة
   الرابط في واتساب وفيسبوك وتويتر.

   الطريقة: نجلب HTML الإقلاع الخاص بنفس النشر (نفس الأصول)، ثم
   نستبدل الوسوم ونحقن بيانات المدرس — نفس تقنية make-route-html.mjs
   لكن وقت الطلب. لو المدرس غير موجود نعيد الصفحة الأساسية مع noindex.
   الكاش: ساعة على حافة CDN + stale-while-revalidate ليوم.
   ============================================================ */
import { SUPABASE_URL, SERVICE_KEY } from './_lib/config.js';

const FALLBACK_ORIGIN = 'https://hassty.vercel.app';

function originFrom(req) {
  const dep = String(req.headers['x-vercel-deployment-url'] || '');
  if (dep && /^[\w.-]+$/.test(dep)) return `https://${dep}`;
  return FALLBACK_ORIGIN;
}

function tutorIdFrom(req) {
  const q = new URL(req.url, 'https://x').searchParams.get('id');
  if (q) return q;
  const m = String(new URL(req.url, 'https://x').pathname || '').match(/^\/tutor\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

const asText = (v, sep = ' و') => Array.isArray(v) ? v.filter(Boolean).join(sep) : String(v || '').trim();

function buildDescription(t) {
  const subject = asText(t.subjects);
  const place = [t.city, t.governorate].filter(Boolean).join(' - ');
  const head = t.headline || t.bio || '';
  let desc = `${t.title || `مدرس ${subject || 'خصوصي'}`}${subject ? ` لمادة ${subject}` : ''}${place ? ` في ${place}` : ''}`;
  if (head) desc += ` — ${head}`;
  desc = desc.replace(/\s+/g, ' ').trim();
  return desc.length > 165 ? `${desc.slice(0, 162)}...` : desc;
}

function buildJsonLd(t) {
  const url = `${FALLBACK_ORIGIN}/tutor/${encodeURIComponent(t.id)}`;
  const person = {
    '@type': 'Person',
    '@id': `${url}#person`,
    name: t.name,
    ...(t.title ? { alternateName: t.title } : {}),
    jobTitle: `مدرس ${asText(t.subjects) || 'خصوصي'}`,
    ...(t.bio ? { description: String(t.bio).slice(0, 300) } : {}),
    ...(t.avatar_url ? { image: t.avatar_url } : {}),
    knowsAbout: [asText(t.subjects, ', '), ...asText(t.grades, ', ').split(/[,،]\s*/)].map((s) => s.trim()).filter(Boolean),
    url,
    address: {
      '@type': 'PostalAddress',
      ...(t.governorate ? { addressRegion: t.governorate } : {}),
      ...(t.city ? { addressLocality: t.city } : {}),
      addressCountry: 'EG',
    },
    worksFor: { '@id': `${FALLBACK_ORIGIN}/#organization` },
  };
  const rating = Number(t.rating || 0);
  const count = Number(t.reviews_count || 0);
  if (rating > 0 && count > 0) {
    person.aggregateRating = { '@type': 'AggregateRating', ratingValue: Math.min(5, rating).toFixed(1), reviewCount: count, bestRating: '5', worstRating: '1' };
  }
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${url}#profilepage`,
        url,
        name: `${t.name} - مدرس ${asText(t.subjects) || 'خصوصي'} | منصة حصتي`,
        inLanguage: 'ar-EG',
        isPartOf: { '@id': `${FALLBACK_ORIGIN}/#website` },
        mainEntity: person,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${FALLBACK_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'المدرسين المعتمدين', item: `${FALLBACK_ORIGIN}/search` },
          { '@type': 'ListItem', position: 3, name: t.name },
        ],
      },
    ],
  });
}

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function fetchTutor(id) {
  if (!id) return null;
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  const url = `${SUPABASE_URL}/rest/v1/public_verified_teachers?select=id,name,title,headline,bio,subjects,grades,rating,reviews_count,price_per_session,price_per_month,governorate,city,avatar_url,is_verified&id=eq.${encodeURIComponent(id)}&limit=1`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function fetchBaseHtml(origin) {
  // محاولتان: نشر الطلب الحالي ثم أصل الإنتاج — احتياطي لأي فشل مؤقت
  for (const o of [origin, FALLBACK_ORIGIN]) {
    try {
      const res = await fetch(`${o}/?src=tutor-meta`, { headers: { 'User-Agent': 'hassty-tutor-meta' }, signal: AbortSignal.timeout(7000) });
      if (res.ok) return res.text();
    } catch { /* المحاولة التالية */ }
  }
  throw new Error('base HTML unavailable');
}

export default async function handler(req, res) {
  const id = tutorIdFrom(req);
  const origin = originFrom(req);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  try {
    const [baseHtml, tutor] = await Promise.all([fetchBaseHtml(origin), fetchTutor(id)]);

    if (!tutor) {
      // مدرس غير موجود → الصفحة الأساسية مع منع الفهرسة (الـ SPA سيعرض حالته الخاصة)
      const html = baseHtml
        .replace(/<meta name="robots" content="[^"]*"\s*\/?>/, '<meta name="robots" content="noindex, follow" />')
        .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, '<link rel="canonical" href="https://hassty.vercel.app/search" />');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
      return res.status(200).send(html);
    }

    const url = `${FALLBACK_ORIGIN}/tutor/${encodeURIComponent(id)}`;
    const title = `${tutor.name} - مدرس ${asText(tutor.subjects) || 'خصوصي'} في ${tutor.governorate || 'مصر'} | منصة حصتي`;
    const description = buildDescription(tutor);
    const image = /^https:\/\//.test(String(tutor.avatar_url || '')) ? tutor.avatar_url : `${FALLBACK_ORIGIN}/og-image.png`;

    let out = baseHtml
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/<meta name="title" content="[^"]*"\s*\/?>/, `<meta name="title" content="${esc(title)}" />`)
      .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(description)}" />`)
      .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${esc(url)}" />`)
      .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${esc(url)}" />`)
      .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(title)}" />`)
      .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(description)}" />`)
      .replace(/<meta property="og:type" content="[^"]*"\s*\/?>/, '<meta property="og:type" content="profile" />')
      .replace(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${esc(image)}" />`)
      .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(title)}" />`)
      .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(description)}" />`)
      .replace(/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${esc(image)}" />`);

    // محتوى noscript خاص بالمدرس (لزواحف لا تنفّذ JS)
    const noscript = `    <noscript>\n      <div style="max-width:720px;margin:40px auto;padding:0 20px;font-family:system-ui,sans-serif;direction:rtl;text-align:right;line-height:1.9;color:#1F2937">\n        <h1 style="font-size:22px;color:#1D4ED8;margin-bottom:12px">${esc(title)}</h1>\n        <p>${esc(description)}</p>\n        <p>بروفايل موثق على منصة حصتي — احجز حصص تقوية أونلاين مع متابعة حضور ذكية بكود QR.</p>\n        <ul style="padding-inline-start:20px">\n          <li><a href="/search" style="color:#2563EB">البحث عن مدرسين خصوصيين معتمدين</a></li>\n          <li><a href="/" style="color:#2563EB">منصة حصتي — الرئيسية</a></li>\n        </ul>\n      </div>\n    </noscript>`;
    out = out.replace(/<noscript>[\s\S]*?<\/noscript>/, () => noscript);

    // JSON-LD الخاص بالمدرس قبل إغلاق head
    out = out.replace('</head>', `    <script type="application/ld+json" data-route="prerendered">${buildJsonLd(tutor)}</script>\n  </head>`);

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(out);
  } catch (err) {
    console.error('[tutor-meta]', err);
    // أي فشل كلي → نحوّل لمسار SPA العادي (index.html عبر الـ rewrite العام)
    res.setHeader('Location', '/');
    return res.status(302).json({ ok: false });
  }
}
