-- Rolling Rush cloud schema. Run this in the Supabase SQL editor.

-- Player save data (one row per account).
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  save jsonb not null default '{}'::jsonb,
  display_name text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile read" on public.profiles
  for select using (auth.uid() = user_id);
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles
  for update using (auth.uid() = user_id);

-- Coins purchased with real money. Rows are inserted ONLY by the Stripe
-- webhook (service role); players can read their own rows but never write.
create table if not exists public.coin_credits (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  coins bigint not null check (coins > 0),
  stripe_session_id text unique,       -- idempotency: one credit per checkout
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.coin_credits enable row level security;

create policy "own credits read" on public.coin_credits
  for select using (auth.uid() = user_id);

-- Atomically claim all unclaimed credits for the calling player and return
-- the total. Marking + summing in one statement means a credit can never be
-- applied twice, even from two devices at once.
create or replace function public.claim_coin_credits()
returns bigint
language sql
security definer
set search_path = public
as $$
  with claimed as (
    update coin_credits
    set claimed = true
    where user_id = auth.uid() and claimed = false
    returning coins
  )
  select coalesce(sum(coins), 0) from claimed;
$$;

revoke all on function public.claim_coin_credits() from anon;
grant execute on function public.claim_coin_credits() to authenticated;

-- Public leaderboard: names and best distances only, never emails or saves.
create or replace function public.get_leaderboard(limit_n int default 20)
returns table (display_name text, best bigint)
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(nullif(trim(display_name), ''), 'Player') as display_name,
         coalesce((save->>'best')::bigint, 0) as best
  from profiles
  where coalesce((save->>'best')::bigint, 0) > 0
  order by best desc
  limit least(greatest(limit_n, 1), 100);
$$;

grant execute on function public.get_leaderboard(int) to anon, authenticated;
