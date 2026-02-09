-- Policies Storage pour le bucket club-logos
-- À exécuter dans le SQL Editor Supabase (Dashboard > SQL Editor).
-- Prérequis : bucket "club-logos" créé dans Storage, et coché "Public bucket".

-- Policy : les utilisateurs authentifiés peuvent insérer dans club-logos
drop policy if exists "Authenticated can upload club logos" on storage.objects;
create policy "Authenticated can upload club logos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'club-logos');

-- Policy : les utilisateurs authentifiés peuvent mettre à jour (remplacer) un fichier dans club-logos
drop policy if exists "Authenticated can update club logos" on storage.objects;
create policy "Authenticated can update club logos"
on storage.objects for update
to authenticated
using (bucket_id = 'club-logos');

-- Policy : tout le monde peut lire (pour afficher les logos en public)
drop policy if exists "Public can read club logos" on storage.objects;
create policy "Public can read club logos"
on storage.objects for select
to public
using (bucket_id = 'club-logos');
