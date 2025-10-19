-- Supabase schema for DubHacks App
-- Couple-scoped prompts, answers, journals, stitched posts, XP/plant, push tokens

create extension if not exists "pgcrypto";

do $$ begin
  perform 1 from pg_type where typname = 'prompt_kind';
  if not found then create type prompt_kind as enum ('question','photo'); end if;
end $$;

do $$ begin
  perform 1 from pg_type where typname = 'photo_kind';
  if not found then create type photo_kind as enum ('front','back'); end if;
end $$;

do $$ begin
  perform 1 from pg_type where typname = 'journal_visibility';
  if not found then create type journal_visibility as enum ('private','partner'); end if;
end $$;

-- Profiles (owner-only via RLS)
create table if not exists public.users (
  id uuid primary key default auth.uid(),
  handle text unique,
  display_name text,
  avatar_url text,
  tz text default 'America/Los_Angeles',
  created_at timestamptz not null default now()
);

-- Couples container
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz not null default now()
);

-- Membership (user belongs to couple)
create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);
create index if not exists idx_couple_members_user_id on public.couple_members(user_id);

-- Daily prompt (question/photo)
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  kind prompt_kind not null,
  scheduled_at timestamptz not null,
  expires_at timestamptz,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_prompts_couple_time on public.prompts(couple_id, scheduled_at desc);

-- Questions for question prompts
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references public.prompts(id) on delete set null,
  couple_id uuid references public.couples(id) on delete cascade,
  scheduled_for date,
  created_by uuid references public.users(id),
  text text not null,
  model_source text,
  created_at timestamptz not null default now()
);
-- Ensure legacy column becomes nullable if table existed
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='questions' and column_name='prompt_id'
  ) then
    begin
      execute 'alter table public.questions alter column prompt_id drop not null';
    exception when others then null; end;
  end if;
end $$;
create index if not exists idx_questions_prompt_id on public.questions(prompt_id);
create index if not exists idx_questions_couple_day on public.questions(couple_id, scheduled_for);
create unique index if not exists uniq_question_per_couple_day on public.questions(couple_id, scheduled_for) where scheduled_for is not null;

-- Answers (unique per question/user)
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  mood jsonb,
  created_at timestamptz not null default now(),
  unique (question_id, user_id)
);
create index if not exists idx_answers_question_user on public.answers(question_id, user_id);

-- Journals (private/partner visibility)
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  ai_summary text,
  visibility journal_visibility not null default 'private',
  created_at timestamptz not null default now()
);
create index if not exists idx_journals_user_time on public.journals(user_id, created_at desc);

-- Stitched post for photo prompt
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text not null,
  is_late boolean not null default false,
  created_at timestamptz not null default now(),
  unique (prompt_id, user_id)
);
create index if not exists idx_posts_couple_prompt on public.posts(couple_id, prompt_id);

-- Optional raw photos (audit/restitch)
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  kind photo_kind not null,
  storage_key text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_photos_post_id on public.photos(post_id);

-- Plant XP state and events
create table if not exists public.plant_state (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  level int not null default 1,
  xp int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  reason text not null,
  points int not null,
  occurred_on date not null default (now()::date),
  created_at timestamptz not null default now()
);
create index if not exists idx_xp_events_couple_date on public.xp_events(couple_id, occurred_on desc);

-- Push tokens and notifications audit
create table if not exists public.push_tokens (
  user_id uuid not null references public.users(id) on delete cascade,
  token text primary key,
  platform text,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  prompt_id uuid references public.prompts(id) on delete set null,
  title text,
  body text,
  sent_at timestamptz not null default now()
);

-- Helper: is authenticated user a member of the couple?
create or replace function public.is_couple_member(couple uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.couple_members cm
    where cm.couple_id = couple and cm.user_id = auth.uid()
  );
$$;

-- Enable RLS
alter table public.users          enable row level security;
alter table public.couples        enable row level security;
alter table public.couple_members enable row level security;
alter table public.prompts        enable row level security;
alter table public.questions      enable row level security;
alter table public.answers        enable row level security;
alter table public.journals       enable row level security;
alter table public.posts          enable row level security;
alter table public.photos         enable row level security;
alter table public.plant_state    enable row level security;
alter table public.xp_events      enable row level security;
alter table public.push_tokens    enable row level security;
alter table public.notifications  enable row level security;

-- Users: owner-only
create policy users_read_own  on public.users for select using (id = auth.uid());
create policy users_upsert_own on public.users for insert with check (id = auth.uid());
create policy users_update_own on public.users for update using (id = auth.uid()) with check (id = auth.uid());

-- Couples: member-visible
create policy couples_member_select on public.couples for select using (public.is_couple_member(id));

-- Membership: self visible; self insert/delete
create policy cm_select_member on public.couple_members for select using (user_id = auth.uid() or public.is_couple_member(couple_id));
create policy cm_insert_self  on public.couple_members for insert with check (user_id = auth.uid());
create policy cm_delete_self  on public.couple_members for delete using (user_id = auth.uid());

-- Prompts: member read/insert
create policy prompts_member_select on public.prompts for select using (public.is_couple_member(couple_id));
create policy prompts_member_insert on public.prompts for insert with check (public.is_couple_member(couple_id));

-- Questions: member read/insert via prompt->couple
do $$ begin
  -- Drop old prompt-based policies if present
  begin execute 'drop policy questions_member_select on public.questions'; exception when undefined_object then null; end;
  begin execute 'drop policy questions_member_insert on public.questions'; exception when undefined_object then null; end;
end $$;
create policy questions_member_select on public.questions for select using (
  public.is_couple_member(couple_id)
);
create policy questions_member_insert on public.questions for insert with check (
  public.is_couple_member(couple_id)
);

-- Answers: owner RW; partner read via couple
create policy answers_owner_rw on public.answers for all using (user_id = auth.uid()) with check (user_id = auth.uid());
do $$ begin
  begin execute 'drop policy answers_partner_select on public.answers'; exception when undefined_object then null; end;
end $$;
create policy answers_partner_select on public.answers for select using (
  exists (
    select 1 from public.questions q
    join public.couple_members cm on cm.couple_id = q.couple_id
    where q.id = answers.question_id and cm.user_id = auth.uid()
  )
);

-- Journals: owner RW; partner read if shared
create policy journals_owner_rw on public.journals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy journals_partner_read_if_shared on public.journals for select using (
  visibility = 'partner' and exists (
    select 1 from public.couple_members cm1
    join public.couple_members cm2 on cm1.couple_id = cm2.couple_id
    where cm1.user_id = journals.user_id and cm2.user_id = auth.uid()
  )
);

-- Posts/photos: member read; owner write
create policy posts_member_select on public.posts for select using (public.is_couple_member(couple_id));
create policy posts_owner_insert on public.posts for insert with check (user_id = auth.uid() and public.is_couple_member(couple_id));

create policy photos_member_select on public.photos for select using (
  exists (select 1 from public.posts p where p.id = photos.post_id and public.is_couple_member(p.couple_id))
);
create policy photos_owner_insert on public.photos for insert with check (
  exists (select 1 from public.posts p where p.id = photos.post_id and p.user_id = auth.uid())
);

-- Plant/xp: member read; allow inserts
create policy plant_member_select on public.plant_state for select using (public.is_couple_member(couple_id));
create policy plant_member_upsert on public.plant_state for insert with check (public.is_couple_member(couple_id));
create policy xp_member_select on public.xp_events for select using (public.is_couple_member(couple_id));
create policy xp_member_insert on public.xp_events for insert with check (public.is_couple_member(couple_id));

-- Push/notifications: owner-only
create policy push_owner_rw on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_owner_read on public.notifications for select using (user_id = auth.uid());

-- Helpful views
create or replace view public.v_today_question as
select q.* from public.questions q
where q.scheduled_for = now()::date;


-- Couples: Requests system
do $$ begin
  perform 1 from pg_type where typname = 'couple_request_status';
  if not found then create type couple_request_status as enum ('pending','accepted','declined','canceled','expired'); end if;
end $$;

create table if not exists public.couple_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status couple_request_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- One active couple per user
do $$ begin
  perform 1 from pg_indexes where schemaname = 'public' and indexname = 'uniq_member_one_couple';
  if not found then execute 'create unique index uniq_member_one_couple on public.couple_members(user_id)'; end if;
end $$;

-- Prevent duplicate pending requests between same pair (order-insensitive)
do $$ begin
  perform 1 from pg_indexes where schemaname = 'public' and indexname = 'uniq_pending_pair';
  if not found then execute $cr$
    create unique index uniq_pending_pair
    on public.couple_requests (
      (least(requester_id, recipient_id)),
      (greatest(requester_id, recipient_id))
    ) where status = 'pending'$cr$; end if;
end $$;

-- RLS for couple_requests
alter table public.couple_requests enable row level security;
create policy cr_select_involved on public.couple_requests for select using (
  requester_id = auth.uid() or recipient_id = auth.uid()
);
create policy cr_insert_requester on public.couple_requests for insert with check (
  requester_id = auth.uid()
);
-- Intentionally no generic update/delete policy; transitions via RPC only

-- RPC: send request by recipient handle
create or replace function public.send_couple_request(recipient_handle text, msg text default null)
returns public.couple_requests
language plpgsql
security definer
set search_path = public as $$
declare
  me uuid := auth.uid();
  recip public.users%rowtype;
  existing_couple_me uuid;
  existing_couple_them uuid;
  req public.couple_requests%rowtype;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  select * into recip from public.users where handle = recipient_handle;
  if recip.id is null then
    raise exception 'recipient not found';
  end if;
  if recip.id = me then
    raise exception 'cannot send request to yourself';
  end if;
  select couple_id into existing_couple_me from public.couple_members where user_id = me;
  select couple_id into existing_couple_them from public.couple_members where user_id = recip.id;
  if existing_couple_me is not null then
    raise exception 'you are already in a couple';
  end if;
  if existing_couple_them is not null then
    raise exception 'recipient is already in a couple';
  end if;
  insert into public.couple_requests (requester_id, recipient_id, message)
  values (me, recip.id, msg)
  returning * into req;

  -- optional: notify recipient
  insert into public.notifications (user_id, title, body)
  values (recip.id, 'Couple Request', 'You received a couple request');

  return req;
exception when unique_violation then
  raise exception 'a pending request already exists between you two';
end;
$$;

-- RPC: accept request (recipient only)
create or replace function public.accept_couple_request(request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public as $$
declare
  me uuid := auth.uid();
  r public.couple_requests%rowtype;
  cid uuid;
  requester_name text;
  recipient_name text;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  select * into r from public.couple_requests where id = request_id for update;
  if r.id is null then raise exception 'request not found'; end if;
  if r.status <> 'pending' then raise exception 'request not pending'; end if;
  if r.recipient_id <> me then raise exception 'only recipient can accept'; end if;

  -- ensure neither side is already in a couple
  if exists (select 1 from public.couple_members where user_id in (r.requester_id, r.recipient_id)) then
    raise exception 'one or both users already in a couple';
  end if;

  select coalesce(display_name, handle) into requester_name from public.users where id = r.requester_id;
  select coalesce(display_name, handle) into recipient_name from public.users where id = r.recipient_id;
  insert into public.couples (name) values (trim(both from (requester_name || ' × ' || recipient_name))) returning id into cid;
  insert into public.couple_members (couple_id, user_id, role) values (cid, r.requester_id, 'partner');
  insert into public.couple_members (couple_id, user_id, role) values (cid, r.recipient_id, 'partner');

  update public.couple_requests set status = 'accepted', responded_at = now() where id = r.id;

  -- optional: notify both
  insert into public.notifications (user_id, title, body) values (r.requester_id, 'Couple Request Accepted', 'You are now in a couple');
  insert into public.notifications (user_id, title, body) values (r.recipient_id, 'Couple Request Accepted', 'You are now in a couple');

  return cid;
end;
$$;

-- RPC: decline (recipient only)
create or replace function public.decline_couple_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  me uuid := auth.uid();
  r public.couple_requests%rowtype;
begin
  select * into r from public.couple_requests where id = request_id for update;
  if r.id is null then raise exception 'request not found'; end if;
  if r.status <> 'pending' then raise exception 'request not pending'; end if;
  if r.recipient_id <> me then raise exception 'only recipient can decline'; end if;
  update public.couple_requests set status = 'declined', responded_at = now() where id = r.id;
end;
$$;

-- RPC: cancel (requester only)
create or replace function public.cancel_couple_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  me uuid := auth.uid();
  r public.couple_requests%rowtype;
begin
  select * into r from public.couple_requests where id = request_id for update;
  if r.id is null then raise exception 'request not found'; end if;
  if r.status <> 'pending' then raise exception 'request not pending'; end if;
  if r.requester_id <> me then raise exception 'only requester can cancel'; end if;
  update public.couple_requests set status = 'canceled', responded_at = now() where id = r.id;
end;
$$;

