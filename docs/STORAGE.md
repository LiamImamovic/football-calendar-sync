# Supabase Storage – Logo des clubs

## 1. Créer le bucket

Dans **Supabase Dashboard > Storage** :

1. **New bucket** : nom `club-logos`
2. Cocher **Public bucket** (pour que les URLs des images fonctionnent)

## 2. Ajouter les policies (obligatoire)

Sans policies, l'upload est refusé et rien n'apparaît dans le bucket. Exécutez le fichier **`supabase/migrations/002_storage_club_logos.sql`** dans **Dashboard > SQL Editor** (ou copiez-collez son contenu).

Ces policies permettent :

- **INSERT** : utilisateurs authentifiés peuvent uploader dans `club-logos`
- **UPDATE** : utilisateurs authentifiés peuvent remplacer un logo existant (upsert)
- **SELECT** : lecture publique pour afficher les logos

Après avoir exécuté la migration, réessayez l'upload du logo (création de club ou paramètres du club).

## 3. Afficher le logo sur la page publique (/s/[id])

Pour que le logo s'affiche sur la page d'abonnement au calendrier (visiteurs non connectés), exécutez aussi **`supabase/migrations/003_clubs_public_read_for_calendar.sql`** dans le SQL Editor. Cette policy permet aux visiteurs anonymes de lire les infos du club (dont `logo_url`) lorsque le club a au moins un calendrier.
