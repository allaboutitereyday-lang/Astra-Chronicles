-- ============================================================================
-- ASTRA CHRONICLES: CROSS-SAVE PROGRESSION CLOUD SCHEMA (SUPABASE POSTGRES)
-- ============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> New Query.
-- This creates the `user_progression_bundles` table and Row Level Security (RLS)
-- policies so authenticated players (Email, Google, Discord, GitHub) can
-- securely sync Save Slots 0-3, Timeline Echoes, Custom Worlds, and Codex Relics.

create table if not exists public.user_progression_bundles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  version text not null default '1.0',
  device_label text,
  summary jsonb not null default '{}'::jsonb,
  bundle jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.user_progression_bundles enable row level security;

-- Policy: Users can read only their own progression bundle
drop policy if exists "Users can view own progression bundle" on public.user_progression_bundles;
create policy "Users can view own progression bundle"
  on public.user_progression_bundles
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own progression bundle
drop policy if exists "Users can insert own progression bundle" on public.user_progression_bundles;
create policy "Users can insert own progression bundle"
  on public.user_progression_bundles
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own progression bundle
drop policy if exists "Users can update own progression bundle" on public.user_progression_bundles;
create policy "Users can update own progression bundle"
  on public.user_progression_bundles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own progression bundle
drop policy if exists "Users can delete own progression bundle" on public.user_progression_bundles;
create policy "Users can delete own progression bundle"
  on public.user_progression_bundles
  for delete
  using (auth.uid() = user_id);

-- Automatic updated_at timestamp trigger
create or replace function public.handle_progression_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_progression_updated_at on public.user_progression_bundles;
create trigger set_progression_updated_at
  before update on public.user_progression_bundles
  for each row
  execute function public.handle_progression_updated_at();

