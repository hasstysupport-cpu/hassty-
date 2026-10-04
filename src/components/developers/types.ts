/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

export interface Developer {
  id: string;
  name: string;
  role: string;
  bio: string;
  quote: string;
  image_url: string;
  github_url: string;
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
  telegram_url: string;
  whatsapp_url: string;
  email: string;
  website_url: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  page_title: string;
  page_subtitle: string;
  hero_badge: string;
  logo_url: string;
  favicon_url: string;
  footer_text: string;
  copyright_text: string;
  contact_email: string;
  contact_phone: string;
  github_org_url: string;
  meta_description: string;
  meta_keywords: string;
  canonical_url: string;
  updated_at: string;
}

export interface MediaItem {
  name: string;
  url: string;
  size: number;
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}
