import { useEffect } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  ogType?: string;
  /** توجيه محركات البحث للصفحات الخاصة (مثل 404 أو لوحات التحكم) */
  robots?: string;
  /** بيانات منظمة JSON-LD خاصة بالصفحة (تُحقن كـ script وتُزال عند مغادرة الصفحة) */
  jsonLd?: Record<string, any> | null;
  /** صورة Open Graph الخاصة بالصفحة (اختياري — الافتراضية في index.html) */
  ogImage?: string;
  /** مسار تنقل الصفحة (الرئيسية ضمنية) — يبني BreadcrumbList تلقائياً */
  breadcrumbs?: string[];
}

export const DEFAULT_TITLE = 'منصة حصتي | أفضل منصة لحجز المدرسين الخصوصيين وحضور الـ QR في مصر';
export const DEFAULT_DESC = 'منصة حصتي (Hassty) هي المنصة التعليمية الأولى في مصر لحجز أفضل المدرسين الخصوصيين المعتمدين لمختلف المراحل الدراسية واللغات مع نظام متابعة الحضور التلقائي بكود QR وإشعارات فورية عبر الواتساب.';
export const BASE_URL = 'https://hassty.vercel.app';
const DEFAULT_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setLink = (selector: string, rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/** يجمع JSON-LD الخاص بالصفحة + BreadcrumbList في كيان واحد @graph */
const buildCombinedJsonLd = (
  jsonLd: Record<string, any> | null | undefined,
  breadcrumbs: string[] | undefined,
  canonicalUrl: string,
): Record<string, any> | null => {
  const graph: Record<string, any>[] = [];
  if (jsonLd) graph.push(jsonLd);
  if (breadcrumbs && breadcrumbs.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: `${BASE_URL}/` },
        ...breadcrumbs.map((name, i) => ({
          '@type': 'ListItem',
          // آخر عنصر = الصفحة الحالية بلا item URL (توصية Google)
          ...(i < breadcrumbs.length - 1
            ? { position: i + 2, name, item: canonicalUrl }
            : { position: i + 2, name }),
        })),
      ],
    });
  }
  if (!graph.length) return null;
  return graph.length === 1 ? graph[0] : { '@context': 'https://schema.org', '@graph': graph };
};

/**
 * Custom React Hook to manage dynamic SEO title, description, OpenGraph,
 * Twitter, canonical, robots and JSON-LD structured data per page —
 * with automatic restore to site defaults on unmount (SPA navigation safety).
 */
export function useSEO({ title, description, keywords, canonicalPath, ogType = 'website', robots, jsonLd, ogImage, breadcrumbs }: SeoProps) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';
  const jsonLdId = 'page-specific-jsonld';

  useEffect(() => {
    // 1. Document Title
    const formattedTitle = title ? `${title} | منصة حصتي` : DEFAULT_TITLE;
    document.title = formattedTitle;

    // 2. Description + Keywords
    setMeta('meta[name="description"]', 'name', 'description', description || DEFAULT_DESC);
    if (keywords) setMeta('meta[name="keywords"]', 'name', 'keywords', keywords);

    // 3. Robots directive (index / noindex) — يُضبط دائماً حتى لا يتسرب noindex للصفحات التالية
    setMeta('meta[name="robots"]', 'name', 'robots', robots || DEFAULT_ROBOTS);

    // 4. Open Graph
    const fullCanonical = canonicalPath
      ? `${BASE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
      : BASE_URL;
    setMeta('meta[property="og:title"]', 'property', 'og:title', formattedTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description || DEFAULT_DESC);
    setMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMeta('meta[property="og:url"]', 'property', 'og:url', fullCanonical);
    if (ogImage) setMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);

    // 5. Twitter Card
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', formattedTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description || DEFAULT_DESC);
    if (ogImage) setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // 6. Canonical Link
    setLink('link[rel="canonical"]', 'canonical', fullCanonical);

    // 7. Page-specific JSON-LD structured data
    // لو دخلت عبر SPA على صفحة ثابتة prerendered، احذف JSON-LD المسار الثابت
    // حتى لا يتعارض مسار التنقل مع meta الصفحة الحالية (المستخدم نفسه يرى الصحيح عبر JS)
    document.querySelectorAll('script[data-route="prerendered"]').forEach((s) => s.remove());
    const combinedJsonLd = buildCombinedJsonLd(jsonLd, breadcrumbs, fullCanonical);
    if (combinedJsonLd) {
      let script = document.getElementById(jsonLdId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = jsonLdId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(combinedJsonLd);
    }

    // Cleanup: استرجاع الإعدادات الافتراضية للموقع عند مغادرة الصفحة
    // (يمنع تسريب noindex/عناوين قديمة لصفحات تالية في SPA)
    return () => {
      document.title = DEFAULT_TITLE;
      setMeta('meta[name="description"]', 'name', 'description', DEFAULT_DESC);
      setMeta('meta[name="robots"]', 'name', 'robots', DEFAULT_ROBOTS);
      setMeta('meta[property="og:title"]', 'property', 'og:title', DEFAULT_TITLE);
      setMeta('meta[property="og:description"]', 'property', 'og:description', DEFAULT_DESC);
      setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
      setMeta('meta[property="og:url"]', 'property', 'og:url', BASE_URL);
      setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', DEFAULT_TITLE);
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', DEFAULT_DESC);
      setLink('link[rel="canonical"]', 'canonical', `${BASE_URL}/`);
      const script = document.getElementById(jsonLdId);
      if (script) script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, keywords, canonicalPath, ogType, robots, jsonLdKey, ogImage, breadcrumbs?.join('/')]);
}
