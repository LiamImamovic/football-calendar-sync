import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewClubForm from "./NewClubForm";

export default async function NewClubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/clubs/new");

  const { data: membership } = await supabase
    .from("club_members")
    .select("clubs(slug)")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  const club = membership?.clubs
    ? Array.isArray(membership.clubs)
      ? membership.clubs[0]
      : membership.clubs
    : null;

  if (club) {
    redirect(`/dashboard/clubs/${(club as { slug: string }).slug}`);
  }

  return <NewClubForm />;
}
