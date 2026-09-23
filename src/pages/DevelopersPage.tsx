/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

import React, { useEffect } from 'react';
import { useSEO } from '../lib/useSEO';
import { PublicPage } from '../components/developers/PublicPage';
import type { Developer, SiteSettings } from '../components/developers/types';

interface DevelopersPageProps {
  onNavigate: (path: string) => void;
}

const sharedBio = 'مهندس برمجيات متخصص في بناء المنظومات التعليمية والحلول الرقمية السحابية. قاد تصميم البنية التحتية لمنصة حِصّتي ونظام الحضور الذكي بالـ QR.';
const sharedQuote = 'أؤمن أن البرمجة ليست مجرد كتابة كود، بل بناء تجارب تصنع فرقًا حقيقيًا وتمكّن الأجيال القادمة.';

const settings: SiteSettings = {
  id: 'settings_main', site_name: 'منصة حِصّتي', page_title: 'فريق تطوير منصة حِصّتي',
  page_subtitle: 'نحن الفريق المسؤول عن بناء وتطوير منصة حِصّتي، ونعمل باستمرار على تقديم تجربة تعليمية رقمية أكثر سهولة واحترافية.',
  hero_badge: 'فريق العمل والابتكار التقني', logo_url: '/hassty-logo.svg', favicon_url: '/favicon.svg',
  footer_text: 'صُنعت بشغف لتطوير تجربة التعليم', copyright_text: 'جميع الحقوق محفوظة Tikzoom© | Hassty',
  contact_email: 'hasstysupport@gmail.com', contact_phone: '', github_org_url: 'https://github.com',
  meta_description: 'الصفحة التعريفية الرسمية بفريق تطوير وبناء منصة حِصّتي — لوحة المطورين.', meta_keywords: 'لوحة المطورين, فريق تطوير حصتي, منصة حصتي, مطوري حصتي, Hassty team',
  canonical_url: 'https://hassty.site/team', updated_at: '2026-09-23T00:00:00.000Z'
};

const developers: Developer[] = [
  { id: 'dev-1', name: 'Yosef Emad', role: 'مطور ومؤسس حصتي', bio: sharedBio, quote: sharedQuote, image_url: '/uploads/youssef.jpg', github_url: 'https://github.com', linkedin_url: '', facebook_url: '', instagram_url: '', telegram_url: 'https://t.me/MCV_W', whatsapp_url: 'https://wa.me/MCV_W', email: 'myyousef000@gmail.com', website_url: 'https://hassty.vercel.app', sort_order: 1, is_visible: true, created_at: '2026-09-22T00:00:00.000Z', updated_at: '2026-09-22T00:00:00.000Z' },
  { id: 'dev-2', name: 'Mahmoud Ali', role: 'مطور ومؤسس حصتي', bio: sharedBio, quote: sharedQuote, image_url: 'https://raw.githubusercontent.com/mahmoudmadkour191-code/-/hastey-deploy/public/uploads/mahmoud-ali.jpg', github_url: 'https://github.com/mahmoudmadkour7052-creator', linkedin_url: '', facebook_url: 'https://www.facebook.com/share/1LxsV63LZW/', instagram_url: '', telegram_url: 'https://t.me/MCV_M', whatsapp_url: 'https://wa.me/MCV_M', email: 'hasstysupport@gmail.com', website_url: 'https://mahmoud-ali-madkour.vercel.app/', sort_order: 2, is_visible: true, created_at: '2026-09-22T00:00:00.000Z', updated_at: '2026-09-22T00:00:00.000Z' }
];

/**
 * لوحة المطورين — صفحة منفصلة داخل الموقع (/team)
 * تعرض فريق تطوير منصة حِصّتي بتجربة بصرية تفاعلية مستقلة
 */
export const DevelopersPage: React.FC<DevelopersPageProps> = ({ onNavigate }) => {
  useSEO({
    title: 'لوحة المطورين — فريق تطوير منصة حصتي | Hassty Team',
    description: 'لوحة المطورين الرسمية لمنصة حصتي: تعرف على فريق التطوير المسؤول عن بناء المنصة ونظام الحضور الذكي بالـ QR، رؤيتهم التقنية ورحلة بناء المنصة مرحلة بمرحلة.',
    canonicalPath: '/team',
    breadcrumbs: ['لوحة المطورين'],
    keywords: 'لوحة المطورين حصتي, فريق تطوير حصتي, مطوري منصة حصتي, Hassty developers team',
  });

  useEffect(() => {
    const icon = document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null;
    if (icon) icon.href = '/favicon.svg';
    return () => { if (icon) icon.href = '/icon.svg'; };
  }, []);

  return <PublicPage developers={developers} settings={settings} isLoading={false} isAdminLoggedIn={false} onOpenAdmin={() => {}} onRefresh={() => {}} />;
};
