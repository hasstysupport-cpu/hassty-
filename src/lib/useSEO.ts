import { useEffect } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  ogType?: string;
}

const DEFAULT_TITLE = 'منصة حصتي | أفضل منصة لحجز المدرسين الخصوصيين وحضور الـ QR في مصر';
const DEFAULT_DESC = 'منصة حصتي (Hassty) هي المنصة التعليمية الأولى في مصر لحجز أفضل المدرسين الخصوصيين المعتمدين لمختلف المراحل الدراسية واللغات مع نظام متابعة الحضور التلقائي بكود QR وإشعارات فورية عبر الواتساب.';
const BASE_URL = 'https://hassty.vercel.app';

/**
 * Custom React Hook to manage dynamic SEO title, descriptions and OpenGraph metadata per page
 */
export function useSEO({ title, description, keywords, canonicalPath, ogType = 'website' }: SeoProps) {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title ? `${title} | منصة حصتي` : DEFAULT_TITLE;
    document.title = formattedTitle;

    // 2. Update Description Meta
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description || DEFAULT_DESC);
    }

    // 3. Update OG Title & Description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', formattedTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description || DEFAULT_DESC);
    }

    const ogTypeMeta = document.querySelector('meta[property="og:type"]');
    if (ogTypeMeta) {
      ogTypeMeta.setAttribute('content', ogType);
    }

    // 4. Update Canonical Link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      const fullCanonical = canonicalPath ? `${BASE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}` : BASE_URL;
      canonicalLink.setAttribute('href', fullCanonical);
    }

    // 5. Update Keywords if provided
    if (keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords);
      }
    }
  }, [title, description, keywords, canonicalPath, ogType]);
}
