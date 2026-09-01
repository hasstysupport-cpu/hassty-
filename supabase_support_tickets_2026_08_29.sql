create extension if not exists pgcrypto;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  user_id uuid null references public.profiles(id) on delete set null,
  name text not null,
  phone text not null,
  email text null,
  subject text not null default 'استفسار عام',
  message text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  admin_reply text null,
  replied_by text null,
  replied_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_idx on public.support_tickets(status, created_at desc);
create index if not exists support_tickets_user_idx on public.support_tickets(user_id, created_at desc);

alter table public.support_tickets enable row level security;

drop policy if exists "support tickets public insert" on public.support_tickets;
drop policy if exists "support tickets owner read" on public.support_tickets;
drop policy if exists "support tickets admin read" on public.support_tickets;
drop policy if exists "support tickets admin update" on public.support_tickets;

create policy "support tickets public insert" on public.support_tickets
  for insert to anon, authenticated
  with check (true);

create policy "support tickets owner read" on public.support_tickets
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "support tickets admin read" on public.support_tickets
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy "support tickets admin update" on public.support_tickets
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

grant insert on public.support_tickets to anon, authenticated;
grant select, update on public.support_tickets to authenticated;

create or replace function public.set_support_ticket_number()
returns trigger
language plpgsql
as $$
declare
  next_num bigint;
begin
  if new.ticket_number is null or btrim(new.ticket_number) = '' then
    select coalesce(max((regexp_replace(ticket_number, '\\D', '', 'g'))::bigint), 1000) + 1 into next_num
    from public.support_tickets
    where ticket_number ~ '^HST-[0-9]+$';
    new.ticket_number := 'HST-' || next_num::text;
  end if;
  return new;
end;
$$;

drop trigger if exists support_ticket_number_trigger on public.support_tickets;
create trigger support_ticket_number_trigger
before insert on public.support_tickets
for each row execute function public.set_support_ticket_number();

create or replace function public.touch_support_ticket_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists support_ticket_updated_at_trigger on public.support_tickets;
create trigger support_ticket_updated_at_trigger
before update on public.support_tickets
for each row execute function public.touch_support_ticket_updated_at();

do $$ begin
  alter publication supabase_realtime add table public.support_tickets;
exception when duplicate_object then
  null;
end $$;