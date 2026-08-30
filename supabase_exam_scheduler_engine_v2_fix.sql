-- HASSTY Phase 4 fix: student regular-lesson conflicts + proposed slot capacity.
-- Applied to Supabase project mxryrgoxofsvjsvpxzew on 2026-08-30.

create or replace function public.student_has_group_schedule_conflict(p_student_id uuid,p_starts_at timestamptz,p_ends_at timestamptz,p_exclude_group_id uuid default null) returns boolean
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare day_name text; s time; e time; other jsonb; slot jsonb;
begin
  if p_student_id is null or p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then return false; end if;
  day_name:=case extract(isodow from (p_starts_at at time zone 'Africa/Cairo')) when 6 then 'Saturday' when 7 then 'Sunday' when 1 then 'Monday' when 2 then 'Tuesday' when 3 then 'Wednesday' when 4 then 'Thursday' when 5 then 'Friday' else '' end;
  s:=(p_starts_at at time zone 'Africa/Cairo')::time; e:=(p_ends_at at time zone 'Africa/Cairo')::time;
  for other in select g.schedule_slots from public.group_enrollments ge join public.student_groups g on g.id=ge.group_id where ge.student_id=p_student_id and ge.status='active' and g.is_active is distinct from false and (p_exclude_group_id is null or g.id<>p_exclude_group_id) loop
    for slot in select value from jsonb_array_elements(coalesce(other,'[]'::jsonb)) loop
      if coalesce(slot->>'day','')=day_name and nullif(slot->>'startTime','') is not null and nullif(slot->>'endTime','') is not null and s<(slot->>'endTime')::time and (slot->>'startTime')::time<e then return true; end if;
    end loop;
  end loop;
  return false;
end;
$$;

create or replace function public.preview_exam_distribution(p_exam_id uuid) returns table(student_id uuid,student_name text,original_group_id uuid,proposed_slot_id uuid,proposed_slot_label text,conflict_code text,conflict_reason text,priority_score integer)
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare exam_row public.exams%rowtype; slot_row public.exam_slots%rowtype; ge_row record; chosen_slot public.exam_slots%rowtype; current_count integer; proposed_count integer; slot_conflict boolean; candidate_score integer; proposed_counts jsonb:='{}'::jsonb;
begin
  select * into exam_row from public.exams where id=p_exam_id; if not found then raise exception 'Exam not found'; end if;
  if exam_row.teacher_id<>(select auth.uid()) and not private.is_admin_strict() then raise exception 'Not allowed'; end if;
  for ge_row in select ge.student_id,ge.student_name,ge.group_id from public.group_enrollments ge where ge.group_id=exam_row.group_id and ge.status='active' and ge.student_id is not null order by ge.student_name nulls last,ge.student_id loop
    chosen_slot:=null; conflict_code:=null; conflict_reason:=null; candidate_score:=999999;
    for slot_row in select * from public.exam_slots where exam_id=p_exam_id order by starts_at,id loop
      slot_conflict:=public.teacher_has_schedule_conflict(exam_row.teacher_id,slot_row.starts_at,slot_row.ends_at,exam_row.group_id);
      if not slot_conflict then slot_conflict:=public.student_has_group_schedule_conflict(ge_row.student_id,slot_row.starts_at,slot_row.ends_at,exam_row.group_id); end if;
      if not slot_conflict then slot_conflict:=public.student_has_exam_slot_conflict(ge_row.student_id,slot_row.starts_at,slot_row.ends_at,p_exam_id); end if;
      select count(*) into current_count from public.exam_assignments ea where ea.exam_id=p_exam_id and ea.slot_id=slot_row.id and ea.status<>'cancelled';
      proposed_count:=current_count+coalesce((proposed_counts->>slot_row.id)::integer,0);
      if not slot_conflict and proposed_count<slot_row.capacity then
        candidate_score:=proposed_count*100+(extract(epoch from slot_row.starts_at)::integer%97);
        if chosen_slot.id is null or candidate_score<((current_count+coalesce((proposed_counts->>chosen_slot.id)::integer,0))*100+(extract(epoch from chosen_slot.starts_at)::integer%97)) then chosen_slot:=slot_row; end if;
      end if;
    end loop;
    if chosen_slot.id is not null then
      proposed_slot_id:=chosen_slot.id; proposed_slot_label:=chosen_slot.label; conflict_code:='ok'; conflict_reason:='موعد متوافق والسعة متاحة'; priority_score:=candidate_score;
      proposed_counts:=jsonb_set(proposed_counts,array[chosen_slot.id],to_jsonb(coalesce((proposed_counts->>chosen_slot.id)::integer,0)+1),true);
    else
      proposed_slot_id:=null; proposed_slot_label:=null;
      if not exists(select 1 from public.exam_slots es where es.exam_id=p_exam_id and not public.teacher_has_schedule_conflict(exam_row.teacher_id,es.starts_at,es.ends_at,exam_row.group_id)) then conflict_code:='teacher_schedule_conflict'; conflict_reason:='المواعيد المقترحة تتعارض مع جدول المدرس';
      elsif exists(select 1 from public.exam_slots es where es.exam_id=p_exam_id and public.student_has_group_schedule_conflict(ge_row.student_id,es.starts_at,es.ends_at,exam_row.group_id)) then conflict_code:='student_group_schedule_conflict'; conflict_reason:='الطالب لديه حصة أخرى في كل المواعيد المتاحة';
      elsif exists(select 1 from public.exam_slots es where es.exam_id=p_exam_id and public.student_has_exam_slot_conflict(ge_row.student_id,es.starts_at,es.ends_at,p_exam_id)) then conflict_code:='student_exam_conflict'; conflict_reason:='الطالب لديه امتحان آخر في كل المواعيد المتاحة';
      else conflict_code:='capacity_full'; conflict_reason:='سعات المواعيد ممتلئة'; end if;
      priority_score:=999999;
    end if;
    student_id:=ge_row.student_id; student_name:=ge_row.student_name; original_group_id:=ge_row.group_id; return next;
  end loop;
end;
$$;
