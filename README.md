# Football Calendar Sync (MVP)

Outil permettant à un coach de saisir ses matchs et de générer une URL `.ics` (iCal) dynamique que les parents peuvent ajouter à leur iPhone/Google Agenda.

## Stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, **shadcn/ui**
- **Supabase** (PostgreSQL)
- **ics**, **date-fns**, **zod**, **react-hook-form**

## Démarrage

### 1. Variables d'environnement

Copie `.env.example` vers `.env.local` et renseigne tes clés Supabase :

```bash
cp .env.example .env.local
```

Dans `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=ta-cle-anon
```

### 2. Base de données Supabase

- Crée un projet sur [supabase.com](https://supabase.com)
- Dans le **SQL Editor**, exécute le script `supabase/schema.sql`

### 3. Installation et lancement

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Pages

- **`/`** — Landing : nom d’équipe → création calendrier → redirection vers le dashboard admin
- **`/[admin_slug]`** — Dashboard coach : ajout de matchs, liste, lien de partage (garder l’URL secrète)
- **`/s/[id]`** — Page parents : bouton « S’abonner au calendrier » (webcal), tuto iPhone/Android, liste des matchs
- **`GET /api/cal/[id]`** — Génère le fichier `.ics` pour l’abonnement

## Déploiement gratuit (pour le club)

Tout peut rester **gratuit** : Supabase (base de données) et Vercel (hébergement) ont des offres gratuites suffisantes pour un club.

### Étape 1 — Supabase (base de données)

1. Va sur [supabase.com](https://supabase.com) et crée un compte (gratuit).
2. **New project** : donne un nom (ex. `football-calendar-club`), un mot de passe pour la base, une région proche (ex. Frankfurt).
3. Une fois le projet créé, ouvre **Project Settings** (icône engrenage) → **API**.
4. Note :
   - **Project URL** (ex. `https://xxxxx.supabase.co`) → ce sera `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (clé qui commence par `eyJ...`) → ce sera `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
5. Dans le menu gauche : **SQL Editor** → **New query**. Copie-colle **tout** le contenu de `supabase/schema.sql` (tables + index + RLS) et exécute (**Run**). Vérifie qu’il n’y a pas d’erreur.

### Étape 2 — GitHub (code)

1. Crée un compte sur [github.com](https://github.com) si besoin.
2. **New repository** : nom (ex. `football-calendar-sync`), visibilité **Public**, ne coche pas « Add a README » si tu as déjà le code en local.
3. En local, dans le dossier du projet :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TON-USERNAME/football-calendar-sync.git
   git push -u origin main
   ```
   (Remplace `TON-USERNAME` par ton identifiant GitHub.)

### Étape 3 — Vercel (hébergement)

1. Va sur [vercel.com](https://vercel.com) et connecte-toi avec GitHub (gratuit).
2. **Add New** → **Project** → importe le repo `football-calendar-sync`.
3. Avant de déployer, ouvre **Environment Variables** et ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = l’URL Supabase (étape 1)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` = la clé anon Supabase (étape 1)
   Tu peux les mettre pour **Production**, **Preview** et **Development**.
4. Clique sur **Deploy**. Attends la fin du build (1–2 min).
5. Une fois terminé, tu obtiens une URL du type `https://football-calendar-sync-xxx.vercel.app`.

### Étape 4 — Vérifier que tout fonctionne

1. Ouvre l’URL Vercel : tu dois voir la page d’accueil « Ne ratez plus jamais un match ».
2. Crée un calendrier (nom d’équipe) : tu dois être redirigé vers le dashboard admin.
3. Ajoute un match, puis ouvre le **lien parents** (ou scanne le QR code) : la page parents doit s’afficher et le bouton « S’abonner au calendrier » doit fonctionner.

Si tout ça marche, l’app est en ligne et utilisable par le club.

### Optionnel — Nom de domaine

- **Sans domaine** : le club utilise l’URL Vercel (ex. `https://football-calendar-sync-xxx.vercel.app`). C’est suffisant.
- **Avec un nom de domaine** (ex. `calendrier.andernos-sport.fr`) : dans Vercel, **Project** → **Settings** → **Domains**, ajoute le domaine et suis les instructions (enregistrement DNS chez ton hébergeur de domaine). Souvent gratuit côté Vercel pour un seul domaine.

### Résumé (checklist)

1. **Supabase** : projet créé, `schema.sql` exécuté, URL + clé anon notées.
2. **GitHub** : repo créé, code poussé (`git push`).
3. **Vercel** : projet importé, variables d'environnement ajoutées, déploiement réussi.
4. **Test** : page d'accueil → créer un calendrier → ajouter un match → lien parents / QR code fonctionnels.

## Monétisation (plus tard)

Bannière prévue dans le dashboard :

- **Version gratuite** : les parents doivent retélécharger le calendrier si une date change
- **Version Pro (15€/an)** : les dates se mettent à jour automatiquement sur leur téléphone
