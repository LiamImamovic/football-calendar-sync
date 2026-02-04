import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminSlugClientPage } from "./AdminSlugClientPage";

type Props = { params: Promise<{ admin_slug: string }> };

export default async function AdminSlugPage({ params }: Props) {
  const { admin_slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: calendar } = await supabase
    .from("calendars")
    .select("id, club_id")
    .eq("admin_slug", admin_slug)
    .single();

  if (!calendar) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8">
        <p className="text-muted-foreground text-center mb-4">
          Calendrier introuvable.
        </p>
        <Button asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    );
  }

  const cal = calendar as { id: string; club_id: string | null };

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8">
        <h1 className="text-xl font-bold text-center mb-2">
          Ce lien est réservé aux coaches
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Connectez-vous pour accéder au calendrier.
        </p>
        <Button asChild size="lg">
          <Link href={`/login?redirect=/${admin_slug}`}>Se connecter</Link>
        </Button>
      </div>
    );
  }

  if (cal.club_id) {
    const { data: membership } = await supabase
      .from("club_members")
      .select("clubs(slug)")
      .eq("club_id", cal.club_id)
      .eq("user_id", user.id)
      .single();
    const slug = (membership as { clubs: { slug: string } | null } | null)
      ?.clubs?.slug;
    if (slug) {
      redirect(`/dashboard/clubs/${slug}/team/${cal.id}`);
    }
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8">
        <p className="text-muted-foreground text-center mb-4">
          Vous n&apos;avez pas accès à ce calendrier.
        </p>
        <Button asChild>
          <Link href="/dashboard">Tableau de bord</Link>
        </Button>
      </div>
    );
  }

  return <AdminSlugClientPage adminSlug={admin_slug} />;
}
