import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Plus, Settings, Users } from "lucide-react";
import { CalendarList } from "./CalendarList";

export default async function ClubDashboardPage({
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

  const { data: clubRow } = await supabase
    .from("clubs")
    .select("id, name, slug, primary_color, secondary_color, owner_id")
    .eq("slug", clubSlug)
    .single();
  if (!clubRow) notFound();

  const club = clubRow as {
    id: string;
    name: string;
    slug: string;
    primary_color: string | null;
    secondary_color: string | null;
    owner_id: string;
  };

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();
  if (!membership) notFound();

  const isOwner = (membership as { role: string }).role === "owner";

  const { data: calendars } = await supabase
    .from("calendars")
    .select("id, team_name, admin_slug")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, plans(max_calendars_per_club)")
    .eq("club_id", club.id)
    .single();
  const maxCalendars =
    (sub as { plans: { max_calendars_per_club: number } | null } | null)?.plans
      ?.max_calendars_per_club ?? 5;
  const calendarList = (calendars ?? []) as {
    id: string;
    team_name: string;
    admin_slug: string;
  }[];
  const canAddCalendar = calendarList.length < maxCalendars;

  return (
    <div className="min-h-[100dvh] px-4 py-8">

      <div className="max-w-3xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{club.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Calendriers (équipes) du club
            </p>
          </div>
          <nav className="flex items-center gap-2">
            {isOwner && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/clubs/${club.slug}/members`}>
                    <Users className="h-4 w-4 mr-2" />
                    Membres
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/clubs/${club.slug}/settings`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </header>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Équipes / Calendriers
            </h2>
            {canAddCalendar ? (
              <Button asChild size="sm">
                <Link href={`/dashboard/clubs/${club.slug}/team/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une équipe
                </Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Limite atteinte ({maxCalendars} calendriers). Passez au plan
                supérieur pour en ajouter.
              </p>
            )}
          </div>

          {calendarList.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aucun calendrier</CardTitle>
                <CardDescription>
                  Créez une équipe pour avoir un calendrier à partager aux
                  parents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canAddCalendar && (
                  <Button asChild>
                    <Link href={`/dashboard/clubs/${club.slug}/team/new`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une équipe
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <CalendarList calendarList={calendarList} clubSlug={club.slug} />
          )}
        </section>
      </div>
    </div>
  );
}
