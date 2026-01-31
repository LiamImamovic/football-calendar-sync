-- Football Calendar Sync - Schema Supabase
-- Exécute ce script dans le SQL Editor de ton projet Supabase

create table calendars (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  team_name text not null,
  admin_slug text not null unique,
  events jsonb not null default '[]'::jsonb,
  is_premium boolean default false
);

create index idx_calendars_id on calendars(id);
create index idx_calendars_admin_slug on calendars(admin_slug);

-- Row Level Security : lecture/écriture pour anon (à durcir plus tard avec auth)
alter table calendars enable row level security;

create policy "Allow public read"
  on calendars for select
  using (true);

create policy "Allow public insert"
  on calendars for insert
  with check (true);

create policy "Allow public update"
  on calendars for update
  using (true);

-- Pas de policy delete : suppression de calendrier interdite pour anon
