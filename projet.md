# 📅 PROJECT: FOOTBALL CALENDAR SYNC (MVP)

**Objectif :** Créer un outil permettant à un coach de saisir ses matchs et de générer une URL `.ics` (iCal) dynamique que les parents peuvent ajouter à leur iPhone/Google Agenda.
**Temps de dev estimé :** 4 à 6 heures.
**Vibe UI :** Minimaliste, Clean, "Vercel style" (Zinc/Slate palette).

---

## 1. TECH STACK (La plus rapide)

- **Framework :** Next.js 14 (App Router)
- **Language :** TypeScript
- **Styling :** Tailwind CSS + `shadcn/ui` (Components: Card, Input, Button, DatePicker, Table, Dialog)
- **Database :** Supabase (PostgreSQL)
- **Librairies Clés :**
- `ics` : Pour générer le flux calendrier.
- `date-fns` : Pour manipuler les dates sans douleur.
- `lucide-react` : Pour les icônes.
- `zod` + `react-hook-form` : Pour la validation du formulaire.

---

## 2. DATABASE SCHEMA (Supabase)

Tu n'as besoin que d'une seule table. Pas d'auth utilisateur complexe pour la v1. On utilise un système de "lien secret d'admin".

Exécute ça dans ton SQL Editor Supabase :

```sql
create table calendars (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  team_name text not null,
  admin_slug text not null unique, -- Le "mot de passe" dans l'URL pour éditer
  events jsonb not null default '[]'::jsonb, -- Stocke le tableau des matchs
  is_premium boolean default false
);

-- Index pour lookup rapide
create index idx_calendars_id on calendars(id);
create index idx_calendars_admin_slug on calendars(admin_slug);

```

**Structure du JSON `events` :**

```json
[
  {
    "id": "uuid-v4",
    "date": "2024-02-14T14:00:00Z",
    "opponent": "FC Nantes U13",
    "location": "Stade de la Beaujoire",
    "is_home": true
  }
]
```

---

## 3. ARCHITECTURE DES PAGES (App Router)

Voici l'arborescence exacte de tes fichiers :

```
app/
├── page.tsx               # Landing + Bouton "Créer un calendrier"
├── [admin_slug]/          # Page d'édition (Secrète pour le coach)
│   └── page.tsx           # Dashboard: Liste des matchs + Formulaire d'ajout + Lien de partage
├── s/[id]/                # Page publique (pour les parents)
│   └── page.tsx           # Instructions: "Comment s'abonner" + Bouton "Copier le lien"
└── api/
    └── cal/
        └── [id]/
            └── route.ts   # LE CŒUR: Génère le fichier .ics

```

---

## 4. UI / UX SPECS (Shadcn Style)

### A. Landing Page (`/`)

- **Hero Center :** Gros titre "Ne ratez plus jamais un match".
- **Input :** "Nom de votre équipe" (ex: U13 Équipe A).
- **CTA :** Bouton "Créer mon calendrier".
- **Action :** Crée une entrée en DB -> Redirige vers `/[admin_slug]`.

### B. Dashboard Coach (`/[admin_slug]`)

- **Header :** Nom de l'équipe + Badge "Admin Mode".
- **Section 1 : Ajouter un match (Card)**
- Grid form : Date (DatePicker), Heure (Input), Adversaire (Input), Lieu (Input).
- Switch : "Domicile / Extérieur".
- Button : "Ajouter au calendrier".

- **Section 2 : Liste des matchs (Table)**
- Colonnes : Date, Match, Lieu, Actions (Supprimer).

- **Section 3 : Zone de partage (Card - Highlighted)**
- "Lien à donner aux parents" : `https://tonapp.com/s/[id]`
- Bouton "Copier".

### C. Page Publique Parents (`/s/[id]`)

- **Vibe :** Très mobile-friendly.
- **Titre :** Calendrier de [Nom Équipe].
- **Gros Bouton Principal :** "S'abonner au calendrier" (Lien `webcal://`).
- **Tuto Accordéon :** "Comment ajouter sur iPhone ?" / "Comment ajouter sur Android ?".
- **Liste des matchs :** Affichage simple en lecture seule pour vérifier.

---

## 5. LA LOGIQUE API (Le fichier .ics)

C'est ici que la magie opère. Fichier `app/api/cal/[id]/route.ts`.

```typescript
import { createEvents } from "ics";
import { supabase } from "@/lib/supabase"; // Ton client
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  // 1. Récupérer les données DB
  const { data: calendar } = await supabase
    .from("calendars")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!calendar) return new NextResponse("Not Found", { status: 404 });

  // 2. Transformer le JSON en format ICS
  const icsEvents = calendar.events.map((event: any) => {
    const date = new Date(event.date);
    return {
      start: [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
      ],
      duration: { hours: 2, minutes: 0 }, // Durée standard match foot
      title: `Match vs ${event.opponent}`,
      description: `Match de ${calendar.team_name}. \nLieu: ${event.location}`,
      location: event.location,
      status: "CONFIRMED",
      busyStatus: "BUSY",
      url: "https://tonapp.com",
    };
  });

  // 3. Générer le fichier
  // @ts-ignore
  const { error, value } = createEvents(icsEvents);

  if (error) return new NextResponse("Error generating ICS", { status: 500 });

  // 4. Servir le fichier avec les bons headers pour que le téléphone "comprenne"
  return new NextResponse(value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${calendar.team_name}.ics"`,
    },
  });
}
```

---

## 6. LES ÉTAPES D'EXECUTION (Ordre chronologique)

1. **Setup :** `npx create-next-app@latest my-app` (TS, Tailwind, App Router).
2. **Shadcn :** `npx shadcn-ui@latest init` puis `npx shadcn-ui@latest add button card input table calendar popover`.
3. **Supabase :** Crée le projet, copie les clés `.env.local`, lance le script SQL.
4. **Dev Backend :** Code la route API (`route.ts`) d'abord. Teste-la avec des fausses données en DB.
5. **Dev Frontend :** Code le Dashboard (`admin_slug`) pour remplir la DB.
6. **Deploy :** Push sur GitHub -> Import sur Vercel.

## 7. MONETIZATION HOOK (Pour plus tard)

Dans le Dashboard, ajoute une petite bannière :

> _"Version Gratuite : Les parents doivent retélécharger le calendrier si vous changez une date."_ > _"Version Pro (15€/an) : Les dates se mettent à jour automatiquement sur leur téléphone."_

(Techniquement, l'URL ICS reste la même, c'est juste le client mail qui décide de rafraichir ou pas, mais tu vends le service de "Live Sync").
