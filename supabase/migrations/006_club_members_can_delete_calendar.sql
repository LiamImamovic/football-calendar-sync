-- Les membres du club (owner, coach) peuvent supprimer un calendrier du club.
create policy "Club members can delete calendar" on public.calendars for delete
  using (
    club_id is not null
    and exists (
      select 1 from public.club_members
      where club_id = calendars.club_id and user_id = auth.uid() and role in ('owner', 'coach')
    )
  );
