-- Permettre aux visiteurs anonymes (page /s/[id]) de lire le club pour afficher le logo.
-- Sans cette policy, l'embed calendars → clubs(logo_url) retourne null pour les non-connectés.

create policy "Public can view clubs that have a calendar"
on public.clubs for select
to anon
using (
  exists (
    select 1 from public.calendars
    where calendars.club_id = clubs.id
  )
);
