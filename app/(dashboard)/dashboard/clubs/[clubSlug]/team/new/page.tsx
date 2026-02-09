"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 12; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export default function NewTeamPage() {
  const params = useParams();
  const router = useRouter();
  const clubSlug = params.clubSlug as string;
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const name = teamName.trim() || "Équipe 1";
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("slug", clubSlug)
      .single();
    if (!club) {
      setError("Club introuvable.");
      setLoading(false);
      return;
    }
    const adminSlug = generateSlug();
    const { data: calendar, error: insertError } = await supabase
      .from("calendars")
      .insert({
        team_name: name,
        admin_slug: adminSlug,
        events: [],
        club_id: (club as { id: string }).id,
        created_by: user.id,
      })
      .select("id")
      .single();
    setLoading(false);
    if (insertError) {
      setError(insertError.message ?? "Erreur lors de la création.");
      return;
    }
    router.push(
      `/dashboard/clubs/${clubSlug}/team/${(calendar as { id: string }).id}`,
    );
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nouvelle équipe</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="teamName">Nom de l&apos;équipe</Label>
          <Input
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="ex: U13 Équipe A"
            disabled={loading}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Création…" : "Créer l'équipe"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/dashboard/clubs/${clubSlug}`}>Annuler</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
