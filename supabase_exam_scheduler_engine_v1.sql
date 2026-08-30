-- HASSTY Phase 4: deterministic exam scheduler
-- Applied to Supabase project mxryrgoxofsvjsvpxzew on 2026-08-30.

create or replace function public.teacher_has_schedule_conflict(
  p_teacher_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_exclude_group_id uuid default null
) returns boolean
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare day_name text; s time; e time; slot jsonb;
begin
  if p_teacher_id is null or p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then return false; end if;
  day_name := case extract(isodow from (p_starts_at at time zone 'Africa/Cairo')) when 6 then 'Saturday' when 7 then 'Sunday' when 1 then 'Monday' when 2 then 'Tuesday' when 3 then 'Wednesday' when 4 then 'Thursday' when 5 then 'Friday' else '' end;
  s := (p_starts_at at time zone 'Africa/Cairo')::time; e := (p_ends_at at time zone 'Africa/Cairo')::time;
  for slot in select value from public.student_groups g, jsonb_array_elements(coalesce(g.schedule_slots,'[]'::jsonb)) where g.tutor_id=p_teacher_id and g.is_active is distinct from false and (p_exclude_group_id is null or g.id<>p_exclude_group_id) loop
    if coalesce(slot->>'day','')=day_name and nullif(slot->>'startTime','') is not null and nullif(slot->>'endTime','') is not null and s < (slot->>'endTime')::time and (slot->>'startTime')::time < e then return true; end if;
  end loop;
  return false;
end;
$$;

create or replace function public.student_has_exam_slot_conflict(p_student_id uuid,p_starts_at timestamptz,p_ends_at timestamptz,p_exclude_exam_id uuid default null) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
select exists(select 1 from public.exam_assignments ea join public.exam_slots es on es.id=ea.slot_id where ea.student_id=p_student_id and ea.status<>'cancelled' and (p_exclude_exam_id is null or ea.exam_id<>p_exclude_exam_id) and es.starts_at<p_ends_at and p_starts_at<es.ends_at);
$$;

create or replace function public.preview_exam_distribution(p_exam_id uuid)
returns table(student_id uuid,student_name text,original_group_id uuid,proposed_slot_id uuid,proposed_slot_label text,conflict_code text,conflict_reason text,priority_score integer)
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare exam_row public.exams%rowtype; slot_row public.exam_slots%rowtype; ge_row record; chosen_slot public.exam_slots%rowtype; chosen_count integer; slot_conflict boolean; candidate_score integer;
begin
  select * into exam_row from public.exams where id=p_exam_id; if not found then raise exception 'Exam not found'; end if;
  if exam_row.teacher_id<>(select auth.uid()) and not private.is_admin_strict() then raise exception 'Not allowed'; end if;
  for ge_row in select ge.student_id,ge.student_name,ge.group_id from public.group_enrollments ge where ge.group_id=exam_row.group_id and ge.status='active' and ge.student_id is not null order by ge.student_name nulls last,ge.student_id loop
    chosen_slot:=null; conflict_code:=null; conflict_reason:=null; candidate_score:=0;
    for slot_row in select * from public.exam_slots where exam_id=p_exam_id order by starts_at,id loop
      slot_conflict:=public.teacher_has_schedule_conflict(exam_row.teacher_id,slot_row.starts_at,slot_row.ends_at,exam_row.group_id);
      if not slot_conflict then slot_conflict:=public.student_has_exam_slot_conflict(ge_row.student_id,slot_row.starts_at,slot_row.ends_at,p_exam_id); end if;
      select count(*) into chosen_count from public.exam_assignments ea where ea.exam_id=p_exam_id and ea.slot_id=slot_row.id and ea.status<>'cancelled';
      if not slot_conflict and chosen_count<slot_row.capacity then
        candidate_score:=chosen_count*100+(extract(epoch from slot_row.starts_at)::integer%97);
        if chosen_slot.id is null or candidate_score<((select count(*) from public.exam_assignments ea2 where ea2.exam_id=p_exam_id and ea2.slot_id=chosen_slot.id and ea2.status<>'cancelled')*100+(extract(epoch from chosen_slot.starts_at)::integer%97)) then chosen_slot:=slot_row; end if;
      end if;
    end loop;
    if chosen_slot.id is not null then proposed_slot_id:=chosen_slot.id; proposed_slot_label:=chosen_slot.label; conflict_code:='ok'; conflict_reason:='موعد متوافق والسعة متاحة'; priority_score:=candidate_score;
    else proposed_slot_id:=null; proposed_slot_label:=null; if exists(select 1 from public.exam_slots es where es.exam_id=p_exam_id and public.teacher_has_schedule_conflict(exam_row.teacher_id,es.starts_at,es.ends_at,exam_row.group_id)) then conflict_code:='teacher_schedule_conflict'; conflict_reason:='المواعيد تتعارض مع جدول المدرس'; elsif exists(select 1 from public.exam_slots es where es.exam_id=p_exam_id and public.student_has_exam_slot_conflict(ge_row.student_id,es.starts_at,es.ends_at,p_exam_id)) then conflict_code:='student_schedule_conflict'; conflict_reason:='الطالب لديه تعارض في المواعيد المتاحة'; else conflict_code:='capacity_full'; conflict_reason:='سعات المواعيد ممتلئة'; end if; priority_score:=999999; end if;
    student_id:=ge_row.student_id; student_name:=ge_row.student_name; original_group_id:=ge_row.group_id; return next;
  end loop;
end;
$$;

create or replace function public.finalize_exam_distribution(p_exam_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare exam_row public.exams%rowtype; r record; assigned_count integer:=0; conflict_count integer:=0;
begin
  select * into exam_row from public.exams where id=p_exam_id for update; if not found then raise exception 'Exam not found'; end if;
  if exam_row.teacher_id<>(select auth.uid()) and not private.is_admin_strict() then raise exception 'Not allowed'; end if;
  if not exists(select 1 from public.exam_slots where exam_id=p_exam_id) then raise exception 'No exam slots configured'; end if;
  delete from public.exam_assignments where exam_id=p_exam_id;
  for r in select * from public.preview_exam_distribution(p_exam_id) loop
    if r.proposed_slot_id is not null then insert into public.exam_assignments(exam_id,slot_id,student_id,original_group_id,assignment_reason,status) values(p_exam_id,r.proposed_slot_id,r.student_id,r.original_group_id,'deterministic_scheduler_v1','assigned'); assigned_count:=assigned_count+1; else conflict_count:=conflict_count+1; end if;
  end loop;
  update public.exams set status='scheduled',updated_at=now() where id=p_exam_id;
  return jsonb_build_object('exam_id',p_exam_id,'assigned_count',assigned_count,'conflict_count',conflict_count);
end;
$$;

create index if not exists idx_exam_assignments_exam_slot_status on public.exam_assignments(exam_id,slot_id,status);
create index if not exists idx_exam_slots_exam_starts on public.exam_slots(exam_id,starts_at);
