"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import logo from "@/assets/images/logo-andernos-sport.avif";

type CalendarOption = { team_name: string; admin_slug: string };

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 12; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

function extractSlugFromInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const path = url.pathname.replace(/^\/|\/$/g, "");
    const slug = path.split("/")[0];
    return slug || null;
  } catch {
    return trimmed;
  }
}

export default function LandingPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [accessInput, setAccessInput] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [calendarsLoading, setCalendarsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    async function loadCalendars() {
      try {
        const res = await fetch("/api/calendars");
        if (res.ok) {
          const data = await res.json();
          setCalendars(data);
        }
      } catch {
        // ignore
      } finally {
        setCalendarsLoading(false);
      }
    }
    loadCalendars();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const name = teamName.trim();
    if (!name) {
      setError("Entrez le nom de votre équipe.");
      return;
    }
    setLoading(true);
    const adminSlug = generateSlug();
    const { data, error: insertError } = await supabase
      .from("calendars")
      .insert({
        team_name: name,
        admin_slug: adminSlug,
        events: [],
      })
      .select("admin_slug")
      .single();

    setLoading(false);
    if (insertError) {
      setError("Erreur lors de la création. Réessayez.");
      return;
    }
    // Redirection avec le slug qu'on vient de générer (le .select() peut être vide si RLS bloque la lecture)
    router.push(`/${data?.admin_slug ?? adminSlug}`);
  }

  function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    setAccessError("");
    const slug = selectedSlug || extractSlugFromInput(accessInput);
    if (!slug) {
      setAccessError(
        "Choisissez un calendrier dans la liste ou collez le lien / code.",
      );
      return;
    }
    router.push(`/${slug}`);
  }

  if (calendarsLoading) {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden
        />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <div className="flex justify-center">
            <Image
              src={logo}
              alt="Andernos Sport"
              className="h-24 sm:h-28 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
            Ne ratez plus jamais un match
          </h1>
          <p className="text-base text-muted-foreground">
            Créez un calendrier pour votre équipe et partagez-le aux parents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="team" className="text-base">
              Nom de votre équipe
            </Label>
            <Input
              id="team"
              placeholder="ex: U13 Équipe A"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={loading}
              className="bg-club-white border-border"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Création…" : "Créer mon calendrier"}
          </Button>
        </form>

        <div className="border-t border-border pt-6">
          <p className="text-sm text-muted-foreground mb-2">
            Déjà un calendrier ?
          </p>
          <form onSubmit={handleAccess} className="space-y-3">
            {!calendarsLoading && calendars.length > 0 && (
              <div className="space-y-2">
                <select
                  id="calendar-select"
                  value={selectedSlug}
                  onChange={(e) => {
                    setSelectedSlug(e.target.value);
                    if (e.target.value) setAccessInput("");
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Choisir dans la liste —</option>
                  {calendars.map((cal) => (
                    <option key={cal.admin_slug} value={cal.admin_slug}>
                      {cal.team_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="access-input" className="text-sm">
                Ou coller le lien / code
              </Label>
              <Input
                id="access-input"
                placeholder="Collez votre lien d'accès ou le code"
                value={accessInput}
                onChange={(e) => {
                  setAccessInput(e.target.value);
                  if (e.target.value.trim()) setSelectedSlug("");
                }}
                className="bg-background"
              />
            </div>
            {accessError && (
              <p className="text-sm text-red-600">{accessError}</p>
            )}
            <Button type="submit" variant="secondary" className="w-full">
              Accéder au calendrier
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
