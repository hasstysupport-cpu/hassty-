-- ============================================================================
-- Hassty — Storage Lockdown (2026-09-10)
-- الهدف: إغلاق ثغرة "Public Storage Bucket Listing" التي رصدها فحص Raqib:
--   أي زائر مجهول كان يقدر يسرد (List) أسماء الملفات داخل buckets
--   باستخدام المفتاح العام المدمج في كود الواجهة.
-- طريقة التطبيق: Supabase Dashboard → SQL Editor → الصق الملف كامل → Run
-- الأمان: الملف Idempotent (يمكن تشغيله أكثر من مرة بأمان).
-- ملاحظة: bucket الـ avatars تم تحويله إلى Private بالفعل عبر Storage API
--   (public=false) وهو فارغ وغير مستخدم — هذا الملف يقفل الـ Listing نفسها
--   على مستوى RLS لكل الـ buckets (بما فيها education-files الخاصة بمستندات التوثيق).
-- ============================================================================

-- 1) جرد السياسات الحالية على التخزين (للمراجعة في الـ Output)
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 2) حذف أي سياسة SELECT/ALL مفتوحة على دور anon أو public (مُمكِّن الـ Listing)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd IN ('SELECT','ALL')
      AND (roles::text ILIKE '%anon%' OR roles::text ILIKE '%public%')
  LOOP
    RAISE NOTICE 'Dropping permissive listing policy: %', r.policyname;
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- 3) سياسة مScoped: المستخدم المصادق يقرأ ملفاته هو فقط (يخدم رفع/تحميل
--    مستندات التوثيق في education-files تحت مجلد <user_id>/)
DROP POLICY IF EXISTS "hassty: owner reads own uploads" ON storage.objects;
CREATE POLICY "hassty: owner reads own uploads"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('avatars','education-files')
  AND (storage.foldername(name))[1] = auth.uid()
);

-- 4) سياسة الأدمن: يقدر يعاين مستندات التوثيق في طابور المراجعة
DROP POLICY IF EXISTS "hassty: admin reads storage" ON storage.objects;
CREATE POLICY "hassty: admin reads storage"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('avatars','education-files')
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 5) (اختياري لكن موصى به) تأكيد أن avatars يبقى Private نهائيًا
UPDATE storage.buckets
SET public = false
WHERE id = 'avatars' AND public = true;

-- 6) السياسات النهائية بعد التنظيف (للمراجعة)
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- ============================================================================
-- التحقق بعد التشغيل (من جهازك):
--   curl -s -X POST "https://mxryrgoxofsvjsvpxzew.supabase.co/storage/v1/object/list/education-files" \
--     -H "Authorization: Bearer <ANON_KEY>" -H "apikey: <ANON_KEY>" \
--     -H "Content-Type: application/json" -d '{"prefix":""}'
--   النتيجة المتوقعة: HTTP 400 مع خطأ RLS (بدل 200 [] قبل الإغلاق)
-- ملاحظات:
--   - سياسات INSERT/UPDATE/DELETE لم تُمس → رفع المستندات يعمل كما هو.
--   - تحميل الصور العامة (إن وُجدت) لا يتأثر لأنه يتجاوز RLS للـ buckets العامة.
-- ============================================================================
