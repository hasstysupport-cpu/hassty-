/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

export type MotionStoryStageId = 'genesis' | 'idea' | 'design' | 'code' | 'platform' | 'reveal';

export interface StageInfo {
  id: MotionStoryStageId;
  stepNumber: string;
  name: string;
  minProgress: number;
  maxProgress: number;
}

export const STORY_STAGES: StageInfo[] = [
  {
    id: 'idea',
    stepNumber: '01',
    name: 'الفكرة',
    minProgress: 0.05,
    maxProgress: 0.28
  },
  {
    id: 'design',
    stepNumber: '02',
    name: 'التصميم',
    minProgress: 0.28,
    maxProgress: 0.5
  },
  {
    id: 'code',
    stepNumber: '03',
    name: 'البرمجة',
    minProgress: 0.5,
    maxProgress: 0.72
  },
  {
    id: 'platform',
    stepNumber: '04',
    name: 'بناء المنصة',
    minProgress: 0.72,
    maxProgress: 0.88
  },
  {
    id: 'reveal',
    stepNumber: '05',
    name: 'حِصّتي',
    minProgress: 0.88,
    maxProgress: 1.0
  }
];
