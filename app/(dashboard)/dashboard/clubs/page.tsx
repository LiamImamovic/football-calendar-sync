import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default async function ClubsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("club_members")
    .select("club_id, role, clubs(id, name, slug)")
    .eq("user_id", user.id);

  const clubs = (memberships ?? [])
    .map((m) => {
      const row = m as { clubs: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null };
      const c = row.clubs;
      return Array.isArray(c) ? c[0] : c;
    })
    .filter(Boolean) as { id: string; name: string; slug: string }[];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mes clubs</h1>
        <Button asChild>
          <Link href="/dashboard/clubs/new">Créer un club</Link>
        </Button>
      </div>
      {clubs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Aucun club
            </CardTitle>
            <CardDescription>
              Créez votre premier club pour gérer vos équipes et calendriers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/clubs/new">Créer un club</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {clubs.map((club) => (
            <li key={club.id}>
              <Link href={`/dashboard/clubs/${club.slug}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center justify-between py-4">
                    <span className="font-medium">{club.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Voir le club →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
