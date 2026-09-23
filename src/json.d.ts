/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

declare module '../firebase-applet-config.json' {
  const value: {
    projectId: string;
    appId: string;
    apiKey: string;
    authDomain: string;
    firestoreDatabaseId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    measurementId?: string;
    oAuthClientId?: string;
  };
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}
