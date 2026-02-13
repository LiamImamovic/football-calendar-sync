-- Les propriétaires du club doivent pouvoir voir les invitations envoyées pour leur club.
-- La policy "Members can view club_invites" ne permet que les users dans club_members ;
-- si l'owner n'y est pas (ex. club créé avant l'ajout de l'owner dans club_members), il ne voyait rien.

create policy "Owners can view club_invites"
on public.club_invites for select
using (
  exists (
    select 1 from public.clubs
    where clubs.id = club_invites.club_id and clubs.owner_id = auth.uid()
  )
);
