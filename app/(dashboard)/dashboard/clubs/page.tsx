import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ClubsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: membership } = await supabase
    .from("club_members")
    .select("club_id, clubs(id, name, slug)")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  const club = membership?.clubs
    ? Array.isArray(membership.clubs)
      ? membership.clubs[0]
      : membership.clubs
    : null;

  if (!club) {
    redirect("/dashboard/clubs/new");
  }

  redirect(`/dashboard/clubs/${(club as { slug: string }).slug}`);
}
