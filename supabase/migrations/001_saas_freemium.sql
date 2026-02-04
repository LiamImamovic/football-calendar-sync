-- Football Calendar Sync - Migration SaaS Freemium
-- Exécuter dans le SQL Editor Supabase après le schéma initial (calendars)

-- Profiles (prolongation auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clubs
create table if not exists public.clubs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  slug text unique not null,
  address text,
  logo_url text,
  primary_color text,
  secondary_color text,
  owner_id uuid not null references auth.users(id) on delete cascade
);

-- Rôles club
do $$ begin
  create type public.club_role as enum ('owner', 'coach', 'viewer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.club_members (
  id uuid default gen_random_uuid() primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.club_role not null default 'coach',
  created_at timestamptz default now(),
  unique(club_id, user_id)
);

create table if not exists public.club_invites (
  id uuid default gen_random_uuid() primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  email text not null,
  role public.club_role not null default 'coach',
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  unique(club_id, email)
);

-- Calendars : ajout colonnes club
alter table public.calendars
  add column if not exists club_id uuid references public.clubs(id) on delete cascade,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Plans
create table if not exists public.plans (
  id text primary key,
  name text not null,
  max_coaches int not null,
  max_calendars_per_club int not null,
  features jsonb default '{}'
);

insert into public.plans (id, name, max_coaches, max_calendars_per_club) values
  ('free', 'Gratuit', 3, 5),
  ('pro', 'Pro', 5, 10),
  ('club', 'Club', 10, 25)
on conflict (id) do nothing;

-- Abonnements par club
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  club_id uuid not null references public.clubs(id) on delete cascade unique,
  plan_id text not null references public.plans(id),
  stripe_subscription_id text,
  stripe_customer_id text,
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_invites enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Users can read all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can read all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Members can view club" on public.clubs;
drop policy if exists "Users can create club" on public.clubs;
drop policy if exists "Owners can update club" on public.clubs;
create policy "Members can view club" on public.clubs for select
  using (exists (select 1 from public.club_members where club_id = clubs.id and user_id = auth.uid()));
create policy "Users can create club" on public.clubs for insert with check (auth.uid() = owner_id);
create policy "Owners can update club" on public.clubs for update using (owner_id = auth.uid());

drop policy if exists "Members can view club_members" on public.club_members;
drop policy if exists "Owners can insert members" on public.club_members;
drop policy if exists "Owners can delete members" on public.club_members;
create policy "Members can view club_members" on public.club_members for select
  using (exists (select 1 from public.club_members m where m.club_id = club_members.club_id and m.user_id = auth.uid()));
create policy "Owners can insert members" on public.club_members for insert
  with check (exists (select 1 from public.clubs where id = club_id and owner_id = auth.uid()));
create policy "Owners can delete members" on public.club_members for delete
  using (exists (select 1 from public.clubs where id = club_id and owner_id = auth.uid()));

drop policy if exists "Members can view club_invites" on public.club_invites;
drop policy if exists "Owners can insert club_invites" on public.club_invites;
drop policy if exists "Owners can delete club_invites" on public.club_invites;
create policy "Members can view club_invites" on public.club_invites for select
  using (exists (select 1 from public.club_members where club_id = club_invites.club_id and user_id = auth.uid()));
-- Invités : peuvent lire l'invitation dont l'email correspond à leur compte
create policy "Invited users can view own invite" on public.club_invites for select
  using ((select email from auth.users where id = auth.uid()) = club_invites.email);
create policy "Owners can insert club_invites" on public.club_invites for insert
  with check (exists (select 1 from public.clubs where id = club_id and owner_id = auth.uid()));
create policy "Owners can delete club_invites" on public.club_invites for delete
  using (exists (select 1 from public.clubs where id = club_id and owner_id = auth.uid()));

-- Calendars : remplacer policies public par club/members
alter table public.calendars drop policy if exists "Allow public read";
alter table public.calendars drop policy if exists "Allow public insert";
alter table public.calendars drop policy if exists "Allow public update";
create policy "Anyone can read calendar" on public.calendars for select using (true);
create policy "Club members can insert calendar" on public.calendars for insert
  with check (
    club_id is null
    or exists (
      select 1 from public.club_members
      where club_id = calendars.club_id and user_id = auth.uid() and role in ('owner', 'coach')
    )
  );
create policy "Club members can update calendar" on public.calendars for update
  using (
    club_id is null
    or exists (
      select 1 from public.club_members
      where club_id = calendars.club_id and user_id = auth.uid() and role in ('owner', 'coach')
    )
  );

-- Subscriptions
drop policy if exists "Members can view club subscription" on public.subscriptions;
drop policy if exists "Owners can manage club subscription" on public.subscriptions;
create policy "Members can view club subscription" on public.subscriptions for select
  using (exists (select 1 from public.club_members where club_id = subscriptions.club_id and user_id = auth.uid()));
create policy "Owners can manage club subscription" on public.subscriptions for all
  using (exists (select 1 from public.clubs where id = club_id and owner_id = auth.uid()));

-- Trigger : créer profil après signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
