import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: memberships } = await supabase
    .from("club_members")
    .select("club_id, clubs(slug, name)")
    .eq("user_id", user.id);

  const clubs = (memberships ?? [])
    .map((m) => {
      const row = m as { clubs: { slug: string; name: string } | { slug: string; name: string }[] | null };
      const c = row.clubs;
      return Array.isArray(c) ? c[0] : c;
    })
    .filter(Boolean) as { slug: string; name: string }[];

  if (clubs.length === 0) {
    redirect("/dashboard/clubs/new");
  }

  redirect(`/dashboard/clubs/${clubs[0].slug}`);
}
