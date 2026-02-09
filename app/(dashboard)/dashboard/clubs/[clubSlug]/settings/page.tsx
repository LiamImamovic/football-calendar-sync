import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClubSettingsForm } from "./ClubSettingsForm";

export default async function ClubSettingsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, owner_id, address, logo_url, primary_color, secondary_color")
    .eq("slug", clubSlug)
    .single();
  if (!club) notFound();

  const c = club as { id: string; name: string; slug: string; owner_id: string; address: string | null; logo_url: string | null; primary_color: string | null; secondary_color: string | null };
  if (c.owner_id !== user.id) notFound();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, plans(name, max_coaches, max_calendars_per_club)")
    .eq("club_id", c.id)
    .single();

  const plan = (sub as { plans: { name: string; max_coaches: number; max_calendars_per_club: number } | null } | null)?.plans;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Paramètres — {c.name}</h1>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/clubs/${clubSlug}`}>Retour au club</Link>
        </Button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adresse et logo</CardTitle>
          <p className="text-sm text-muted-foreground">
            L&apos;adresse sert de lieu par défaut pour les matchs à domicile. Le logo apparaît sur les pages du club et le PDF.
          </p>
        </CardHeader>
        <CardContent>
          <ClubSettingsForm
            clubId={c.id}
            clubSlug={clubSlug}
            initialAddress={c.address}
            initialLogoUrl={c.logo_url}
            initialPrimaryColor={c.primary_color}
            initialSecondaryColor={c.secondary_color}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{plan?.name ?? "Gratuit"}</p>
          {plan && (
            <p className="text-sm text-muted-foreground mt-1">
              {plan.max_coaches} coachs max, {plan.max_calendars_per_club}{" "}
              calendriers max.
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Passer à Pro ou Club : à brancher avec Stripe (webhook + checkout).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
