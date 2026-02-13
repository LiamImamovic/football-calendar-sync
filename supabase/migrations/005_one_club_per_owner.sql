-- Un utilisateur ne peut être propriétaire que d'un seul club.
alter table public.clubs
  add constraint clubs_owner_id_unique unique (owner_id);
