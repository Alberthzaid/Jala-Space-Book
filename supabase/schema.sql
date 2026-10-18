create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  work_id text not null check (work_id ~ '^OL[0-9]+W$'),
  title text not null check (char_length(title) between 1 and 500),
  authors text[] not null default '{}',
  cover_id integer check (cover_id is null or cover_id > 0),
  borrowed_at timestamptz not null default now(),
  due_at timestamptz not null default (now() + interval '14 days'),
  renewed boolean not null default false,
  returned_at timestamptz
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  work_id text not null check (work_id ~ '^OL[0-9]+W$'),
  title text not null check (char_length(title) between 1 and 500),
  authors text[] not null default '{}',
  cover_id integer check (cover_id is null or cover_id > 0),
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  fulfilled_at timestamptz,
  cancelled_at timestamptz
);

create unique index if not exists loans_one_active_copy_per_work
  on public.loans (work_id) where returned_at is null;
create index if not exists loans_user_idx on public.loans (user_id, borrowed_at desc);

create unique index if not exists reservations_one_active_per_user_work
  on public.reservations (user_id, work_id) where fulfilled_at is null and cancelled_at is null;
create index if not exists reservations_active_work_idx
  on public.reservations (work_id) where fulfilled_at is null and cancelled_at is null;
create index if not exists reservations_user_idx on public.reservations (user_id, created_at desc);

alter table public.loans enable row level security;
alter table public.reservations enable row level security;

revoke all on public.loans, public.reservations from anon;
grant select, insert, update on public.loans, public.reservations to authenticated;

drop policy if exists "loans_select_own" on public.loans;
create policy "loans_select_own" on public.loans
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "loans_insert_own" on public.loans;
create policy "loans_insert_own" on public.loans
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "loans_update_own" on public.loans;
create policy "loans_update_own" on public.loans
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "reservations_select_own" on public.reservations;
create policy "reservations_select_own" on public.reservations
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "reservations_insert_own" on public.reservations;
create policy "reservations_insert_own" on public.reservations
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "reservations_update_own" on public.reservations;
create policy "reservations_update_own" on public.reservations
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.loans_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
  own_reservation uuid;
  others_waiting integer;
begin
  new.user_id := auth.uid();
  if new.user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  new.borrowed_at := now();
  new.due_at := now() + interval '14 days';
  new.renewed := false;
  new.returned_at := null;

  perform pg_advisory_xact_lock(hashtext('loans:' || new.user_id::text));

  select count(*) into active_count
    from public.loans
   where user_id = new.user_id and returned_at is null;
  if active_count >= 5 then
    raise exception 'LOAN_LIMIT_REACHED';
  end if;

  select id into own_reservation
    from public.reservations
   where work_id = new.work_id and user_id = new.user_id
     and fulfilled_at is null and cancelled_at is null;

  select count(*) into others_waiting
    from public.reservations
   where work_id = new.work_id and user_id <> new.user_id
     and fulfilled_at is null and cancelled_at is null;

  if others_waiting > 0 and own_reservation is null then
    raise exception 'BOOK_RESERVED';
  end if;

  if own_reservation is not null then
    update public.reservations set fulfilled_at = now() where id = own_reservation;
  end if;

  return new;
end;
$$;

create or replace function public.loans_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if old.returned_at is not null then
    raise exception 'LOAN_CLOSED';
  end if;

  new.id := old.id;
  new.user_id := old.user_id;
  new.work_id := old.work_id;
  new.title := old.title;
  new.authors := old.authors;
  new.cover_id := old.cover_id;
  new.borrowed_at := old.borrowed_at;
  new.due_at := old.due_at;

  if new.renewed and not old.renewed then
    if old.due_at < now() then
      raise exception 'LOAN_OVERDUE';
    end if;
    if exists (
      select 1 from public.reservations
       where work_id = old.work_id and fulfilled_at is null and cancelled_at is null
    ) then
      raise exception 'BOOK_RESERVED';
    end if;
    new.due_at := old.due_at + interval '7 days';
  else
    new.renewed := old.renewed;
  end if;

  if new.returned_at is not null then
    new.returned_at := now();
  end if;

  return new;
end;
$$;

create or replace function public.reservations_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  if new.user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  new.created_at := now();
  new.notified_at := null;
  new.fulfilled_at := null;
  new.cancelled_at := null;

  if exists (
    select 1 from public.loans
     where work_id = new.work_id and user_id = new.user_id and returned_at is null
  ) then
    raise exception 'ALREADY_HOLDING';
  end if;

  if not exists (
    select 1 from public.loans where work_id = new.work_id and returned_at is null
  ) and not exists (
    select 1 from public.reservations
     where work_id = new.work_id and user_id <> new.user_id
       and fulfilled_at is null and cancelled_at is null
  ) then
    raise exception 'BOOK_AVAILABLE';
  end if;

  return new;
end;
$$;

create or replace function public.reservations_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if old.fulfilled_at is not null or old.cancelled_at is not null then
    raise exception 'RESERVATION_CLOSED';
  end if;

  new.id := old.id;
  new.user_id := old.user_id;
  new.work_id := old.work_id;
  new.title := old.title;
  new.authors := old.authors;
  new.cover_id := old.cover_id;
  new.created_at := old.created_at;
  new.fulfilled_at := old.fulfilled_at;
  new.cancelled_at := case when new.cancelled_at is not null then now() else null end;
  new.notified_at := case
    when old.notified_at is not null then old.notified_at
    when new.notified_at is not null then now()
    else null
  end;

  return new;
end;
$$;

revoke all on function public.loans_before_insert() from public, anon, authenticated;
revoke all on function public.loans_before_update() from public, anon, authenticated;
revoke all on function public.reservations_before_insert() from public, anon, authenticated;
revoke all on function public.reservations_before_update() from public, anon, authenticated;

drop trigger if exists loans_before_insert on public.loans;
create trigger loans_before_insert before insert on public.loans
  for each row execute function public.loans_before_insert();

drop trigger if exists loans_before_update on public.loans;
create trigger loans_before_update before update on public.loans
  for each row execute function public.loans_before_update();

drop trigger if exists reservations_before_insert on public.reservations;
create trigger reservations_before_insert before insert on public.reservations
  for each row execute function public.reservations_before_insert();

drop trigger if exists reservations_before_update on public.reservations;
create trigger reservations_before_update before update on public.reservations
  for each row execute function public.reservations_before_update();

create or replace function public.get_availability(work_ids text[])
returns table (work_id text, on_loan boolean, due_at timestamptz, reservations_count integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    w.id as work_id,
    l.id is not null as on_loan,
    l.due_at as due_at,
    (
      select count(*)::integer
        from public.reservations r
       where r.work_id = w.id and r.fulfilled_at is null and r.cancelled_at is null
    ) as reservations_count
  from (select distinct unnest(get_availability.work_ids[1:100]) as id) w
  left join public.loans l on l.work_id = w.id and l.returned_at is null;
$$;

revoke all on function public.get_availability(text[]) from public;
grant execute on function public.get_availability(text[]) to anon, authenticated;
