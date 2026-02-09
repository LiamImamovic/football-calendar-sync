# Plan de transformation en SaaS Freemium

Ce document décrit tout ce qu’il faudrait modifier pour passer le site **Football Calendar Sync** en **SaaS freemium** : page d’accueil landing, connexion/inscription, création de club (nom, adresse, logo, couleurs), gestion des coachs par invitation email, calendriers par équipe, plans Free/Pro/Club gérés par l'owner, et flux parents (lien calendrier + PDF).

---

## 1. Vue d’ensemble du parcours cible

| Étape | Parcours utilisateur                                                                                       |
| ----- | ---------------------------------------------------------------------------------------------------------- |
| 1     | **Landing** (`/`) : présentation produit, tarifs, CTA "Commencer" / "Se connecter" |
| 2     | **Inscription / Connexion** : email + mot de passe (ou magic link). Pas d'accès calendrier sans compte. |
| 3     | **Création de club (owner)** : si pas de club → formulaire **nom, adresse, logo, couleurs** du club (personnalisation de l'interface). |
| 4     | **Gestion des coachs (owner)** : l'owner saisit l'email du coach → email d'invitation → le coach crée son compte via le lien → affilié au club. Les coachs ont tous les accès (calendriers, matchs, partage) sauf la gestion du club (paramètres, membres, plan), réservée à l'owner. |
| 5     | **Calendriers** : owner et coachs créent des calendriers pour leur équipe ; un coach peut en créer plusieurs. Limites (coachs, calendriers) **par club**, définies par le plan (Free / Pro / Club), géré par l'owner. |
| 6     | **Parents** : le coach envoie le lien du calendrier ; les parents s'abonnent au calendrier et/ou téléchargent le PDF. |

---

## 2. Modifications base de données (Supabase)

### 2.1 Activer Supabase Auth

- Dans le projet Supabase : **Authentication** → activer **Email** (et optionnellement Magic Link, OAuth Google/GitHub plus tard).
- Pas de changement de code minimal pour la table `calendars` si tu restes en anon au début ; pour le SaaS, **toutes les écritures** doivent passer par un utilisateur connecté.

### 2.2 Nouvelles tables (schéma à ajouter)

À exécuter dans le SQL Editor (à adapter selon noms choisis).

```sql
-- Utilisateurs : gérés par Supabase Auth (auth.users).
-- On ajoute un profil étendu optionnel.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clubs (organisations) : créés par l'owner avec nom, adresse, logo, couleurs (personnalisation interface).
create table public.clubs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  slug text unique not null,           -- pour URLs type /dashboard/clubs/[slug]
  address text,                       -- adresse du club
  logo_url text,
  primary_color text,                 -- ex. #1a2b3c pour personnaliser l'interface
  secondary_color text,               -- ex. #f0f0f0
  owner_id uuid not null references auth.users(id) on delete cascade
);

-- Rôles dans un club : owner, coach, etc.
create type public.club_role as enum ('owner', 'coach', 'viewer');

create table public.club_members (
  id uuid default gen_random_uuid() primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role club_role not null default 'coach',
  created_at timestamptz default now(),
  unique(club_id, user_id)
);

-- Invitations coach : l'owner saisit l'email → envoi email avec lien → le coach crée son compte → affilié au club.
create table public.club_invites (
  id uuid default gen_random_uuid() primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  email text not null,
  role club_role not null default 'coach',
  token text unique not null,         -- token dans le lien d'invitation
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  unique(club_id, email)
);

-- Lier les calendriers existants à un club et un "owner"
-- On ajoute club_id et on conserve admin_slug pour rétrocompat / lien secret.
alter table public.calendars
  add column if not exists club_id uuid references public.clubs(id) on delete cascade,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Plans freemium (par club, géré par l'owner)
-- Free = 3 coachs, 5 calendriers | Pro = 5 coachs, 10 calendriers | Club = à définir (voir ci-dessous)
create table public.plans (
  id text primary key,   -- 'free', 'pro', 'club'
  name text not null,
  max_coaches int not null,              -- nombre max de coachs (hors owner) dans le club
  max_calendars_per_club int not null,
  features jsonb default '{}'
);

insert into public.plans (id, name, max_coaches, max_calendars_per_club) values
  ('free', 'Gratuit', 3, 5),
  ('pro', 'Pro', 5, 10),
  ('club', 'Club', 10, 25);  -- proposition : 10 coachs, 25 calendriers ; voir "Offre Club" ci-dessous pour autres idées

-- Abonnement par club (l'owner paie pour le club)
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  club_id uuid not null references public.clubs(id) on delete cascade unique,
  plan_id text not null references public.plans(id),
  stripe_subscription_id text,
  stripe_customer_id text,
  status text not null default 'active',  -- active, canceled, past_due, etc.
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

-- Profiles : lecture par tout le monde (optionnel), écriture par soi
create policy "Users can read all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Clubs : voir si membre
create policy "Members can view club" on public.clubs for select
  using (exists (select 1 from public.club_members where club_id = clubs.id and user_id = auth.uid()));
create policy "Users can create club" on public.clubs for insert with check (auth.uid() = owner_id);
create policy "Owners can update club" on public.clubs for update
  using (owner_id = auth.uid());

-- Club members
create policy "Members can view club_members" on public.club_members for select
  using (exists (select 1 from public.club_members m where m.club_id = club_members.club_id and m.user_id = auth.uid()));
create policy "Owners can insert members" on public.club_members for insert
  with check (exists (select 1 from public.clubs where id = club_id and owner_id = auth.uid()));
create policy "Owners can delete members" on public.club_members for delete
  using (exists (select 1 from public.clubs where id = club_id and owner_id = auth.uid()));

-- Club invites : seul l'owner peut créer / lire / supprimer les invitations de son club
create policy "Members can view club_invites" on public.club_invites for select
  using (exists (select 1 from public.club_members where club_id = club_invites.club_id and user_id = auth.uid()));
create policy "Owners can insert club_invites" on public.club_invites for insert
  with check (exists (select 1 from public.clubs where id = club_id and owner_id = auth.uid()));
create policy "Owners can delete club_invites" on public.club_invites for delete
  using (exists (select 1 from public.clubs where id = club_id and owner_id = auth.uid()));

-- Calendars : remplacer les anciennes policies "public" par des policies basées sur club/members
alter table public.calendars drop policy if exists "Allow public read";
alter table public.calendars drop policy if exists "Allow public insert";
alter table public.calendars drop policy if exists "Allow public update";

-- Lecture calendrier : public pour /s/[id] et API .ics
create policy "Anyone can read calendar" on public.calendars for select using (true);

-- Écriture : seulement les membres du club avec rôle owner ou coach
create policy "Club members can insert calendar" on public.calendars for insert
  with check (exists (
    select 1 from public.club_members
    where club_id = calendars.club_id and user_id = auth.uid() and role in ('owner', 'coach')
  ));
create policy "Club members can update calendar" on public.calendars for update
  using (exists (
    select 1 from public.club_members
    where club_id = calendars.club_id and user_id = auth.uid() and role in ('owner', 'coach')
  ));

-- Subscriptions : lié au club ; lecture par les membres, gestion (upgrade, etc.) par l'owner
create policy "Members can view club subscription" on public.subscriptions for select
  using (exists (select 1 from public.club_members where club_id = subscriptions.club_id and user_id = auth.uid()));
create policy "Owners can manage club subscription" on public.subscriptions for all
  using (exists (select 1 from public.clubs where id = club_id and owner_id = auth.uid()));
```

Points importants :

- **Club** : nom, adresse, logo, primary_color / secondary_color pour personnaliser l'interface du club.
- **Invitations coach** : owner saisit l'email → club_invites + token → email avec lien /invite?token=xxx. Si connecté → ajout club_members ; sinon signup puis ajout.
- **Calendriers** : owner et coachs en créent (plusieurs par coach). Limites par club : max_coaches, max_calendars_per_club. Accès via club_members + RLS.
- **Freemium** : vérifier avant d'ajouter un coach (≤ max_coaches) et avant de créer un calendrier (≤ max_calendars_per_club). Plan géré par l'owner.

---

## 3. Authentification (Supabase Auth)

### 3.1 Packages

- Déjà avec `@supabase/supabase-js`. Pour Next.js App Router, l’idéal est d’utiliser **`@supabase/ssr`** pour gérer les cookies côté serveur et éviter de tout faire en client.

```bash
npm install @supabase/ssr
```

### 3.2 Clients Supabase

- **Côté serveur** (Route Handlers, Server Components, middleware) : créer un client avec `createServerClient` de `@supabase/ssr` qui lit/écrit les cookies de session.
- **Côté client** : soit un client créé dans un Provider qui reçoit la session du serveur, soit un `createBrowserClient` qui lit les cookies.

Fichiers à créer / modifier :

- `lib/supabase/server.ts` : `createServerClient` pour les appels dans les routes API et les Server Components.
- `lib/supabase/client.ts` : client navigateur (pour les composants client).
- `middleware.ts` à la racine : rafraîchir la session Supabase et, si tu veux, protéger les routes `/dashboard`, `/club/*`, etc. (rediriger vers `/login` si non connecté).

### 3.3 Routes auth

- **Inscription** : `POST /api/auth/signup` ou utilisation directe de `supabase.auth.signUp()` (email + password).
- **Connexion** : `POST /api/auth/login` ou `supabase.auth.signInWithPassword()`.
- **Déconnexion** : `POST /api/auth/logout` → `supabase.auth.signOut()`.
- **Magic link** (optionnel) : `signInWithOtp()`.

Après inscription, créer la ligne dans `profiles` (trigger Supabase ou appel depuis l’app). Après connexion, rediriger vers le dashboard ou la création de club.

---

## 4. Structure des routes (Next.js App Router)

À adapter selon tes préférences. Exemple cohérent avec "page d’accueil globale + compte + club + coach".

```
app/
├── page.tsx                    # Landing SaaS (hero, features, tarifs, CTA)
├── layout.tsx                  # Layout global (header public avec Login / Sign up)
├── (auth)/                     # Groupe pour auth
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   └── invite/page.tsx         # Acceptation invitation coach : ?token=xxx → signup ou ajout au club
├── (dashboard)/                # Protégé par middleware (doit être connecté)
│   ├── layout.tsx              # Sidebar / header avec user menu, déconnexion
│   ├── page.tsx                # Redirige vers /dashboard/clubs ou premier club
│   ├── clubs/
│   │   ├── page.tsx            # Liste des clubs de l'utilisateur
│   │   ├── new/page.tsx        # Création de club (nom, adresse, logo, couleurs, slug)
│   │   └── [clubSlug]/
│   │       ├── page.tsx        # Dashboard du club : liste des équipes (calendriers)
│   │       ├── settings/page.tsx
│   │       ├── members/page.tsx # Gestion des coaches invités
│   │       └── team/
│   │           └── [calendarId]/  # Équivalent actuel de [admin_slug] (édition calendrier)
│   └── account/
│       └── page.tsx            # Profil, abonnement, facturation
├── s/[id]/page.tsx             # Page publique parents : le coach envoie ce lien ; s'abonner au calendrier (.ics) et/ou télécharger le PDF
└── api/
    ├── auth/
    │   └── [...nextauth]/route.ts  # Ou routes dédiées signup/login/callback pour Supabase
    ├── cal/[id]/route.ts       # Inchangé : génération .ics
    ├── calendars/route.ts      # À modifier : ne retourner que les calendriers des clubs de l'utilisateur
    └── webhooks/stripe/route.ts    # Pour freemium : mise à jour subscription après paiement
```

- **Page d’accueil** : `app/page.tsx` ne crée plus de calendrier directement. Elle présente le produit, les tarifs, et des boutons "Créer un compte" / "Se connecter" qui mènent vers `(auth)/signup` et `(auth)/login`.
- **Création de club (owner)** : après signup ou login, si l'utilisateur n'a aucun club, redirection vers `(dashboard)/clubs/new`. Formulaire : **nom**, **adresse**, **logo**, **couleurs** (personnalisation interface). Puis accès au dashboard du club.
- **Gestion des coachs (owner)** : page members : saisir l'email du coach → envoi email avec lien d'invitation → le coach crée son compte via le lien → affilié au club. Les coachs ont tous les accès (calendriers, matchs, partage) sauf la gestion du club (paramètres, membres, plan), réservée à l'owner.
- **Accès coach** : l'édition d'un calendrier est sous `(dashboard)/clubs/[clubSlug]/team/[calendarId]`. Owner et coachs peuvent créer plusieurs calendriers (équipes). Limites par club selon le plan (max_coaches, max_calendars_per_club).
- **Flux parents** : chaque coach envoie le lien du calendrier (`/s/[id]`). Les parents s'abonnent au calendrier (.ics) et/ou téléchargent le PDF. Pas de compte requis pour les parents.

---

## 5. Ce qu’il faut modifier fichier par fichier

### 5.1 Page d’accueil globale

- **`app/page.tsx`**
  - Retirer la création de calendrier et la liste "Déjà un calendrier ?".
  - En faire une vraie **landing** : hero ("Ne ratez plus jamais un match"), sous-titres, courtes features (calendrier partagé, lien .ics, multi-équipes), section tarifs (Free / Pro / Club), CTA "Commencer gratuitement" → `/signup`, "Se connecter" → `/login`.
  - Optionnel : garder un lien "Accéder à mon calendrier" (pour utilisateurs déjà en session) vers `/dashboard`.

### 5.2 Auth

- **Nouveaux fichiers**
  - `app/(auth)/login/page.tsx` : formulaire email + mot de passe, appel à Supabase Auth, redirection vers `/dashboard` ou `/clubs/new`.
  - `app/(auth)/signup/page.tsx` : idem + choix du nom (optionnel), création du profil si besoin.
  - `app/(auth)/forgot-password/page.tsx` : envoi du magic link de réinitialisation.
  - `app/(auth)/invite/page.tsx` : page d'acceptation d'invitation coach (`?token=xxx`). Si connecté → ajout à `club_members`, suppression de l'invite, redirection vers le club. Si pas de compte → redirection vers signup avec token en query ; après signup, traiter l'invite puis rediriger vers le club.
  - `middleware.ts` : refresh session Supabase + protection des routes sous `(dashboard)` (et éventuellement `(auth)` en "si déjà connecté → redirect dashboard").

### 5.3 Supabase

- **`lib/supabase.ts`**
  - Soit le garder pour usage client "anon" sur la partie publique (lecture calendriers, `/s/[id]`), soit le remplacer par deux modules :
    - `lib/supabase/server.ts` (création du client serveur avec cookies).
    - `lib/supabase/client.ts` (client navigateur pour les pages dashboard).
  - Dans les pages et API réservées au coach, utiliser le client qui envoie la session (cookie) pour que RLS s’applique avec `auth.uid()`.

### 5.4 Dashboard et clubs

- **`app/(dashboard)/layout.tsx`**
  - Récupérer l’utilisateur (côté serveur avec le client Supabase serveur) et afficher un layout avec navigation (Mes clubs, Compte, Déconnexion). Si pas d’utilisateur, rediriger vers `/login`.

- **`app/(dashboard)/clubs/page.tsx`**
  - Lister les clubs où l’utilisateur est membre (via `club_members` + `clubs`). Bouton "Créer un club".

- **`app/(dashboard)/clubs/new/page.tsx`**
  - Formulaire : **nom**, **adresse**, **logo** (upload ou URL), **couleurs** (primary_color, secondary_color), slug. Insert dans `clubs` + création du premier `club_member` (owner) + création d'une `subscription` (plan free par défaut). Redirection vers `clubs/[clubSlug]`. L'interface du club (header, boutons, thème) utilisera ces couleurs.

- **`app/(dashboard)/clubs/[clubSlug]/page.tsx`**
  - Liste des calendriers (équipes) du club. Bouton "Ajouter une équipe" (création calendrier). Vérifier `max_calendars_per_club` du plan du club. Afficher pour chaque équipe le lien d'édition et le lien public `/s/[id]` (à partager aux parents). Thème : couleurs du club (primary_color, secondary_color).
- **`app/(dashboard)/clubs/[clubSlug]/members/page.tsx`**
  - Gestion des coachs (owner uniquement) : liste des membres et des invitations en attente. Formulaire "Inviter un coach" (email) → création invite + envoi email avec lien `/invite?token=xxx`. Vérifier `max_coaches` du plan avant d'envoyer une invitation.

- **`app/(dashboard)/clubs/[clubSlug]/team/[calendarId]/page.tsx`**
  - Reprendre la logique actuelle de **`app/[admin_slug]/page.tsx`** (formulaire matchs, liste, partage, QR code, etc.) en utilisant `calendarId` et le client Supabase authentifié. Les données du calendrier viennent de `calendars` où `club_id` = club courant et `id` = `calendarId`. RLS assure que seuls les membres owner/coach peuvent modifier.

### 5.5 Rétrocompatibilité admin_slug (optionnel)

- Si tu gardes les URLs à base d’`admin_slug` pour les anciens liens :
  - **`app/[admin_slug]/page.tsx`** (ou une seule route dynamique) :
    - Si la requête est authentifiée, vérifier si ce `admin_slug` correspond à un calendrier d’un club dont l’utilisateur est membre → rediriger vers `/dashboard/clubs/[clubSlug]/team/[calendarId]`.
    - Si non authentifié, afficher une page "Ce lien est réservé aux coaches. Connectez-vous pour accéder au calendrier" avec bouton login.

### 5.6 API

- **`app/api/cal/[id]/route.ts`**
  - Inchangé : lecture seule du calendrier pour générer le .ics, pas besoin d’auth.

- **`app/api/calendars/route.ts`**
  - Au lieu de retourner tous les calendriers (ou les 200 derniers), retourner uniquement les calendriers des clubs dont l’utilisateur est membre. Pour cela, appeler l’API avec le cookie de session, utiliser le client Supabase serveur pour avoir `auth.uid()`, puis requête sur `calendars` jointe à `club_members`. Si cette route n’est plus utilisée pour la landing (car plus de liste "Déjà un calendrier"), tu peux la garder pour le dashboard (liste déroulante "Mes calendriers") ou la remplacer par une requête directe depuis le client Supabase dans les pages dashboard.

### 5.7 Hooks et types

- **`types/database.ts`**
  - Ajouter les types : `Profile`, `Club`, `ClubMember`, `ClubRole`, `Plan`, `Subscription`. Adapter `Calendar` avec `club_id` et `created_by` optionnels pour la transition.

- **`hooks/use-calendar.ts`**
  - Soit le garder pour un chargement par `calendarId` (et éventuellement par `admin_slug` pour la rétrocompat). S’il utilise le client Supabase avec session, RLS fera le filtre.

- **`hooks/use-calendars-list.ts`**
  - Soit le remplacer par un hook "mes calendriers" (par club / utilisateur) utilisant le client authentifié, soit une requête API protégée qui retourne seulement les calendriers de l’utilisateur.

### 5.8 Freemium (plans gérés par l'owner)

- **Plans par club**
  - **Free** : 3 coachs (hors owner), 5 calendriers.
  - **Pro** : 5 coachs, 10 calendriers.
  - **Club** : à définir. Idées : **10 coachs / 25 calendriers** (déjà en place dans le schéma) ; **illimité coachs / 50 calendriers** ; **sur devis** pour les très gros clubs (fédérations, multi-sites). Tu peux ajuster les valeurs dans la table `plans` et les libellés sur la landing.
- **Limites**
  - À chaque invitation coach : vérifier que (nombre de membres avec rôle coach + nombre d'invites en attente) < `max_coaches` du plan du club.
  - À chaque création de calendrier : vérifier que le nombre de calendriers du club < `max_calendars_per_club` du plan du club.
  - Vérifications dans les Server Actions ou Route Handlers ; optionnel : trigger Supabase en secours.

- **Stripe**
  - Créer des produits/prix Stripe (ex. Pro 15€/an, Club 49€/an).
  - Après paiement, créer ou mettre à jour une ligne dans `subscriptions` (plan_id, stripe_subscription_id, current_period_end).
  - Webhook `api/webhooks/stripe/route.ts` : écouter `customer.subscription.updated`, `customer.subscription.deleted` pour mettre à jour `subscriptions` et donc le plan effectif.

- **UI**
  - Dans le dashboard du club (owner uniquement pour changer le plan), afficher le plan actuel (Free / Pro / Club) et un lien "Passer à Pro" / "Passer à Club" vers Stripe Checkout.
  - Si limite atteinte (nombre de coachs ou de calendriers), afficher un message "Passez au plan supérieur pour débloquer plus de coachs/calendriers" avec lien vers la page tarifs ou Stripe.

---

## 6. Résumé des grands chantiers

| Domaine         | Actions                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DB**          | `profiles`, `clubs` (nom, adresse, logo, couleurs), `club_members`, `club_invites`, `plans` (max_coaches, max_calendars_per_club), `subscriptions` (par club). RLS + rôles. |
| **Auth**        | Supabase Auth + `@supabase/ssr`, middleware, login/signup/forgot-password, page `/invite?token=xxx` pour accepter une invitation.                                         |
| **Landing**     | `app/page.tsx` → landing produit + tarifs, CTA inscription/connexion.                                                                                                     |
| **Club**        | Création : nom, adresse, logo, couleurs (personnalisation interface). Members : owner invite les coachs par email → lien d'invitation → création de compte puis affiliation. |
| **Dashboard**   | `(dashboard)/clubs`, `clubs/[clubSlug]`, `members`, `team/[calendarId]`. Déplacer la logique de `[admin_slug]/page.tsx` dans team/[calendarId]. Thème par club (couleurs).     |
| **Freemium**    | Free 3 coachs / 5 calendriers ; Pro 5 / 10 ; Club à définir (ex. 10 / 25). Limites vérifiées à l'invitation et à la création de calendrier. Stripe + webhook.             |
| **Parents**     | Lien `/s/[id]` envoyé par le coach : s'abonner au calendrier (.ics) et/ou télécharger le PDF. Pas de compte.                                                              |
| **API**         | `calendars` list filtrée par utilisateur ; `cal/[id]` inchangé (génération .ics).                                                                                        |

En suivant ce plan, tu obtiens une landing + auth, la création de club (nom, adresse, logo, couleurs), l'invitation des coachs par email, les calendriers par équipe avec limites Free/Pro/Club gérées par l'owner, et le flux parents (lien calendrier + PDF) sans compte.
