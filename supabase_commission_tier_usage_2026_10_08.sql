-- ============================================================
-- Hassty — Migration 2026-10-08 (2)
-- إحصاءات حية لشرائح العمولة: كم مدرسًا وكم طالبًا في كل شريحة الآن
-- ============================================================

create or replace function public.get_commission_tier_usage()
returns table (tier_id int, tier_label text, rate_pct numeric, teachers_count bigint, students_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  with tiers as (
    select id, min_students, max_students, label, rate_pct
    from public.commission_tiers
    where is_active
  ),
  teacher_students as (
    select p.id as tutor_id,
           coalesce((
             select count(ge.id)
             from group_enrollments ge
             join student_groups sg on sg.id = ge.group_id
             where sg.tutor_id = p.id and ge.status = 'active'
           ), 0) as students
    from profiles p
    where p.role = 'teacher' and p.account_status = 'active'
  ),
  first_min as (
    select min(min_students) as m from tiers
  )
  select
    t.id,
    t.label,
    t.rate_pct,
    count(ts.tutor_id) filter (where
      (ts.students >= t.min_students and (t.max_students is null or ts.students <= t.max_students))
      or (ts.students = 0 and t.min_students = (select m from first_min))
    ),
    coalesce(sum(ts.students) filter (where
      (ts.students >= t.min_students and (t.max_students is null or ts.students <= t.max_students))
      or (ts.students = 0 and t.min_students = (select m from first_min))
    ), 0)
  from tiers t
  left join teacher_students ts on true
  group by t.id, t.min_students, t.max_students, t.label, t.rate_pct
  order by t.min_students;
$$;

grant execute on function public.get_commission_tier_usage() to authenticated, anon;
