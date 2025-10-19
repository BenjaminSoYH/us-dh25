# DubHacks App — Supabase Schema & Models (Cursor Context)

This file defines the **database schema**, **RLS policies**, and **TypeScript models** for the app. It’s designed to be pasted into Cursor and used as shared context for database- and model-related development.

**Scope covered**: daily check‑ins, LLM‑generated/curated **daily questions** and **answers (mood analysis over time)**, **journaling** (+ AI summaries for partner insight), **experience/plant growth (streaks)**, and a BeReal‑style **dual photo** post. Relational modeling favors fast queries and clean RLS.

---

## 1) Postgres SQL — Tables, Enums, Indexes, RLS

> Paste this whole section into Supabase SQL Editor (or keep here as reference).

```sql
-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
do $$ begin
  perform 1 from pg_type where typname = 'prompt_kind';
  if not found then
    create type prompt_kind as enum ('question','photo');
  end if;
end $$;

do $$ begin
  perform 1 from pg_type where typname = 'photo_kind';
  if not found then
    create type photo_kind as enum ('front','back');
  end if;
end $$;

do $$ begin
  perform 1 from pg_type where typname = 'journal_visibility';
  if not found then
    create type journal_visibility as enum ('private','partner');
  end if;
end $$;

-- ============================================================
-- Core tables
-- ============================================================

-- Auth is handled by Supabase (auth.users). This "users" table is profile-only.
create table if not exists public.users (
  id uuid primary key default auth.uid(),         -- FK to auth.users
  handle text unique,
  display_name text,
  avatar_url text,
  tz text default 'America/Los_Angeles',
  created_at timestamptz not null default now()
);

-- Couples (relationship container). We model membership separately for robust RLS.
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz not null default now()
);

-- Each user belongs to exactly one couple in v1 (or none before pairing).
create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text,                         -- optional: 'a' | 'b' if you need A/B semantics
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);
create index if not exists idx_couple_members_user_id on public.couple_members(user_id);

-- Daily prompts – either a question or a BeReal-style photo window (kind).
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

-- Questions attached to a 'question' prompt (one or more if you rotate/variant).
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  text text not null,
  model_source text,                           -- e.g., 'LLM:v1'
  created_at timestamptz not null default now()
);
create index if not exists idx_questions_prompt_id on public.questions(prompt_id);

-- Answers to a question by a user (unique per question/user).
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  mood jsonb,                                   -- e.g., {"score":0.72,"label":"positive"}
  created_at timestamptz not null default now(),
  unique (question_id, user_id)
);
create index if not exists idx_answers_question_user on public.answers(question_id, user_id);

-- Journals (optionally shared with partner via visibility=partner).
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  ai_summary text,
  visibility journal_visibility not null default 'private',
  created_at timestamptz not null default now()
);
create index if not exists idx_journals_user_time on public.journals(user_id, created_at desc);

-- BeReal-style stitched post for 'photo' prompts (after finalize on server).
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text not null,                       -- Supabase Storage or S3 URL
  is_late boolean not null default false,
  created_at timestamptz not null default now(),
  unique (prompt_id, user_id)
);
create index if not exists idx_posts_couple_prompt on public.posts(couple_id, prompt_id);

-- Optional raw photos for audit/debug or restitching
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  kind photo_kind not null,                      -- 'front'|'back'
  storage_key text not null,                     -- path in storage
  created_at timestamptz not null default now()
);
create index if not exists idx_photos_post_id on public.photos(post_id);

-- Experience / plant growth state (denormalized current level & xp).
create table if not exists public.plant_state (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  level int not null default 1,
  xp int not null default 0,
  updated_at timestamptz not null default now()
);

-- XP events for auditability (derive plant_state from these if desired).
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  reason text not null,                           -- e.g., 'both_posted', 'both_answered'
  points int not null,
  occurred_on date not null default (now()::date),
  created_at timestamptz not null default now()
);
create index if not exists idx_xp_events_couple_date on public.xp_events(couple_id, occurred_on desc);

-- Push tokens (Expo) for notifications
create table if not exists public.push_tokens (
  user_id uuid not null references public.users(id) on delete cascade,
  token text primary key,
  platform text,                                   -- ios|android|web
  updated_at timestamptz not null default now()
);

-- Optional notifications audit
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  prompt_id uuid references public.prompts(id) on delete set null,
  title text,
  body text,
  sent_at timestamptz not null default now()
);

-- ============================================================
-- Helper function for RLS: is the authed user a member of the couple?
-- ============================================================
create or replace function public.is_couple_member(couple uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = couple
      and cm.user_id = auth.uid()
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
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
create policy "users_read_own" on public.users
for select using (id = auth.uid());
create policy "users_upsert_own" on public.users
for insert with check (id = auth.uid());
create policy "users_update_own" on public.users
for update using (id = auth.uid()) with check (id = auth.uid());

-- Couples: visible only to their members
create policy "couples_member_select" on public.couples
for select using (public.is_couple_member(id));

-- Couple members: a user can see their memberships; inserts allowed if they are joining their own user_id
create policy "cm_select_member" on public.couple_members
for select using (user_id = auth.uid() or public.is_couple_member(couple_id));
create policy "cm_insert_self" on public.couple_members
for insert with check (user_id = auth.uid());
create policy "cm_delete_self" on public.couple_members
for delete using (user_id = auth.uid());

-- Prompts: members of the couple can read; insert allowed if member
create policy "prompts_member_select" on public.prompts
for select using (public.is_couple_member(couple_id));
create policy "prompts_member_insert" on public.prompts
for insert with check (public.is_couple_member(couple_id));

-- Questions: readable if prompt is in your couple; insert allowed if member
create policy "questions_member_select" on public.questions
for select using (public.is_couple_member((select couple_id from public.prompts p where p.id = prompt_id)));
create policy "questions_member_insert" on public.questions
for insert with check (public.is_couple_member((select couple_id from public.prompts p where p.id = prompt_id)));

-- Answers: owner can insert/select; partner can select via couple membership (through prompt->question join)
create policy "answers_owner_rw" on public.answers
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "answers_partner_select" on public.answers
for select using (
  exists (
    select 1
    from public.questions q
    join public.prompts   p on p.id = q.prompt_id
    join public.couple_members cm on cm.couple_id = p.couple_id
    where q.id = answers.question_id
      and cm.user_id = auth.uid()
  )
);

-- Journals: owner read/write; partner can read if visibility='partner'
create policy "journals_owner_rw" on public.journals
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "journals_partner_read_if_shared" on public.journals
for select using (
  visibility = 'partner' and
  exists (
    select 1
    from public.couple_members cm1
    join public.couple_members cm2 on cm1.couple_id = cm2.couple_id
    where cm1.user_id = journals.user_id
      and cm2.user_id = auth.uid()
  )
);

-- Posts/photos: couple members can read; owner can write
create policy "posts_member_select" on public.posts
for select using (public.is_couple_member(couple_id));
create policy "posts_owner_insert" on public.posts
for insert with check (user_id = auth.uid() and public.is_couple_member(couple_id));

create policy "photos_member_select" on public.photos
for select using (
  exists (
    select 1 from public.posts p
    where p.id = photos.post_id and public.is_couple_member(p.couple_id)
  )
);
create policy "photos_owner_insert" on public.photos
for insert with check (
  exists (
    select 1 from public.posts p
    where p.id = photos.post_id and p.user_id = auth.uid()
  )
);

-- Plant state / xp: couple members can read; inserts by members or via edge functions (service role)
create policy "plant_member_select" on public.plant_state
for select using (public.is_couple_member(couple_id));
create policy "plant_member_upsert" on public.plant_state
for insert with check (public.is_couple_member(couple_id));
create policy "xp_member_select" on public.xp_events
for select using (public.is_couple_member(couple_id));
create policy "xp_member_insert" on public.xp_events
for insert with check (public.is_couple_member(couple_id));

-- Push tokens & notifications: owner-only
create policy "push_owner_rw" on public.push_tokens
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notif_owner_read" on public.notifications
for select using (user_id = auth.uid());
```

### Useful views (optional)
```sql
-- Latest active prompt for a couple (by scheduled time)
create or replace view public.v_active_prompt as
select distinct on (p.couple_id)
  p.*
from public.prompts p
order by p.couple_id, p.scheduled_at desc;

-- Today's posts by couple (for feed)
create or replace view public.v_feed_today as
select
  po.id as post_id,
  po.couple_id,
  po.prompt_id,
  po.user_id,
  po.image_url,
  po.is_late,
  po.created_at,
  u.display_name,
  u.handle,
  u.avatar_url
from public.posts po
join public.users u on u.id = po.user_id
join public.prompts pr on pr.id = po.prompt_id
where pr.scheduled_at::date = now()::date;
```
---

## 2) TypeScript Models & Zod Schemas (client-side contracts)

> Put this in `models.ts` or keep below for Cursor context. These mirror the tables for typed inserts/reads.

```ts
// models.ts
import { z } from "zod";

// ---------- Profiles ----------
export const ZUser = z.object({
  id: z.string().uuid(),
  handle: z.string().min(2).max(24),
  display_name: z.string().min(1).max(64),
  avatar_url: z.string().url().optional().nullable(),
  tz: z.string().optional(),
  created_at: z.string()
});
export type User = z.infer<typeof ZUser>;

// ---------- Couples & membership ----------
export const ZCouple = z.object({
  id: z.string().uuid(),
  name: z.string().optional().nullable(),
  created_at: z.string()
});
export type Couple = z.infer<typeof ZCouple>;

export const ZCoupleMember = z.object({
  couple_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.string().optional().nullable(),
  joined_at: z.string()
});
export type CoupleMember = z.infer<typeof ZCoupleMember>;

// ---------- Prompts & Questions ----------
export const ZPrompt = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  kind: z.enum(["question","photo"]),
  scheduled_at: z.string(),
  expires_at: z.string().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string()
});
export type Prompt = z.infer<typeof ZPrompt>;

export const ZQuestion = z.object({
  id: z.string().uuid(),
  prompt_id: z.string().uuid(),
  text: z.string().min(1),
  model_source: z.string().optional().nullable(),
  created_at: z.string()
});
export type Question = z.infer<typeof ZQuestion>;

// ---------- Answers ----------
export const ZAnswer = z.object({
  id: z.string().uuid(),
  question_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string().min(1),
  mood: z.record(z.any()).optional().nullable(),
  created_at: z.string()
});
export type Answer = z.infer<typeof ZAnswer>;

export const ZNewAnswer = ZAnswer.pick({ question_id: true, content: true }).extend({
  user_id: z.string().uuid().optional() // server fills from auth when using edge function
});

// ---------- Journals ----------
export const ZJournal = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  content: z.string().min(1),
  ai_summary: z.string().optional().nullable(),
  visibility: z.enum(["private","partner"]),
  created_at: z.string()
});
export type Journal = z.infer<typeof ZJournal>;

export const ZNewJournal = z.object({
  content: z.string().min(1),
  visibility: z.enum(["private","partner"]).default("private")
});

// ---------- Posts (BeReal-style) ----------
export const ZPost = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  prompt_id: z.string().uuid(),
  user_id: z.string().uuid(),
  image_url: z.string().min(1),
  is_late: z.boolean(),
  created_at: z.string()
});
export type Post = z.infer<typeof ZPost>;

export const ZNewPostFinalize = z.object({
  prompt_id: z.string().uuid(),
  is_late: z.boolean().default(false),
  // server derives couple_id & user_id from auth/session
});

// ---------- Photos (optional audit) ----------
export const ZPhoto = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  kind: z.enum(["front","back"]),
  storage_key: z.string(),
  created_at: z.string()
});
export type Photo = z.infer<typeof ZPhoto>;

// ---------- Plant XP ----------
export const ZPlantState = z.object({
  couple_id: z.string().uuid(),
  level: z.number().int().min(1),
  xp: z.number().int().min(0),
  updated_at: z.string()
});
export type PlantState = z.infer<typeof ZPlantState>;

export const ZXpEvent = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  reason: z.string(),
  points: z.number().int(),
  occurred_on: z.string(),
  created_at: z.string()
});
export type XpEvent = z.infer<typeof ZXpEvent>;

// ---------- Push tokens ----------
export const ZPushToken = z.object({
  user_id: z.string().uuid(),
  token: z.string(),
  platform: z.string().optional().nullable(),
  updated_at: z.string()
});
export type PushToken = z.infer<typeof ZPushToken>;
```

---

## 3) Client: Supabase access patterns (RN/Expo)

> Drop these helpers into `lib/db.ts`. They assume you’ve already created a Supabase client and the user is authenticated (email OTP is recommended for hackathon speed).

```ts
// lib/db.ts
import { supabase } from "./supabase";
import { z } from "zod";
import { ZNewAnswer, ZNewJournal, ZNewPostFinalize } from "../models";

export async function upsertProfile({ handle, display_name, avatar_url }: { handle?: string; display_name?: string; avatar_url?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("users").upsert({ id: user.id, handle, display_name, avatar_url });
  if (error) throw error;
}

export async function myCoupleId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("couple_members").select("couple_id").eq("user_id", user.id).single();
  if (error) return null;
  return data?.couple_id ?? null;
}

export async function createPrompt(kind: "question"|"photo", scheduled_at: string, expires_at?: string) {
  const couple_id = await myCoupleId();
  if (!couple_id) throw new Error("No couple");
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("prompts").insert({ couple_id, kind, scheduled_at, expires_at, created_by: user!.id }).select().single();
  if (error) throw error;
  return data;
}

export async function addQuestion(prompt_id: string, text: string, model_source?: string) {
  const { data, error } = await supabase.from("questions").insert({ prompt_id, text, model_source }).select().single();
  if (error) throw error;
  return data;
}

export async function answerQuestion(payload: z.infer<typeof ZNewAnswer>) {
  const parsed = ZNewAnswer.parse(payload);
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("answers").insert({ ...parsed, user_id: user!.id }).select().single();
  if (error) throw error;
  return data;
}

export async function newJournal(payload: z.infer<typeof ZNewJournal>) {
  const parsed = ZNewJournal.parse(payload);
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("journals").insert({ ...parsed, user_id: user!.id }).select().single();
  if (error) throw error;
  return data;
}

// BeReal-style finalize (your edge function handles stitch -> posts insert)
export async function finalizeDualPhoto(payload: z.infer<typeof ZNewPostFinalize>) {
  const parsed = ZNewPostFinalize.parse(payload);
  const res = await fetch(`${process.env.EXPO_PUBLIC_EDGE_URL}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed)
  });
  if (!res.ok) throw new Error(`Finalize failed: ${res.status}`);
  return res.json();
}
```

---

## 4) Edge Function sketch (stitch + insert)

> Implement this as a Supabase **Edge Function** (`finalize`) using **Sharp** to stitch and then `insert` into `posts`. The service role key is used in the function, so it can write storage and bypass RLS where necessary.

```ts
// supabase/functions/finalize/index.ts
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

Deno.serve(async (req) => {
  try {
    const { prompt_id, is_late, back_key, front_key } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Auth user (optional: via JWT in header) or accept from session cookie if using invoke with auth
    // ...

    // 2) Download images from Storage
    const bucket = "dual-photos";
    const [back, front] = await Promise.all([
      supabase.storage.from(bucket).download(back_key),
      supabase.storage.from(bucket).download(front_key)
    ]);
    if (!back.data || !front.data) throw new Error("Missing images");

    // 3) Stitch vertically
    const backBuf = await back.data.arrayBuffer().then(b => Buffer.from(b));
    const frontBuf = await front.data.arrayBuffer().then(b => Buffer.from(b));
    const stitched = await sharp({
      create: { width: 1080, height: 2160, channels: 3, background: "#000" }
    }).png().composite([
      { input: await sharp(backBuf).resize({ width: 1080 }).jpeg({ quality: 80 }).toBuffer(), left: 0, top: 0 },
      { input: await sharp(frontBuf).resize({ width: 1080 }).jpeg({ quality: 80 }).toBuffer(), left: 0, top: 1080 }
    ]).jpeg({ quality: 85 }).toBuffer();

    // 4) Store final image
    const finalKey = `final/${crypto.randomUUID()}.jpg`;
    const up = await supabase.storage.from(bucket).upload(finalKey, stitched, { contentType: "image/jpeg", upsert: false });
    if (up.error) throw up.error;
    const image_url = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/${bucket}/${finalKey}`;

    // 5) Resolve couple_id & user_id from prompt (assuming owner is caller; adjust if needed)
    const { data: prompt } = await supabase.from("prompts").select("couple_id").eq("id", prompt_id).single();
    if (!prompt) throw new Error("Prompt not found");

    // TODO: set user_id from auth context if available
    const user_id = req.headers.get("x-user-id"); // example pass-through
    if (!user_id) throw new Error("Missing user_id");

    // 6) Insert post (RLS bypassed by service role in edge function)
    const { data: post, error: postErr } = await supabase.from("posts")
      .insert({ couple_id: prompt.couple_id, prompt_id, user_id, image_url, is_late })
      .select().single();
    if (postErr) throw postErr;

    return new Response(JSON.stringify(post), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
  }
});
```

---

## 5) Queries you’ll reuse a lot

```sql
-- Get my couple (server-side by auth.uid() or client-side via helper)
select c.*
from couple_members cm
join couples c on c.id = cm.couple_id
where cm.user_id = auth.uid();

-- Latest prompt for my couple
select * from prompts
where couple_id in (select couple_id from couple_members where user_id = auth.uid())
order by scheduled_at desc
limit 1;

-- Feed for today's photo prompt
select p.*, u.display_name, u.handle, u.avatar_url
from posts p
join users u on u.id = p.user_id
where p.prompt_id = $1
order by p.is_late asc, p.created_at desc;

-- Journal entries I can see (mine + partner shared)
-- (Client can do two queries: my journals + partner's shared journals)
```

---

## 6) Implementation notes & conventions

- Enable **RLS on every table** (done above); default deny unless policy allows.
- All writes from the app should not require service role keys. Use edge functions for stitching or privileged operations.
- Keep Storage bucket for dual photos as **private**; serve via signed URLs or public if OK for hackathon.
- Keep **OTP email auth** for fastest onboarding. Avoid phone OTP (SMS setup) during the hackathon.
- Use **ISO strings** for timestamps client-side and rely on Postgres `timestamptz` server-side.
- Indexes are included for hot paths; add more after profiling.
- If you later add group chats/comments, add `comments(post_id, user_id, text, created_at)` with couple-scoped RLS.
