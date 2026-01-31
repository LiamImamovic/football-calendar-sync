import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

type Props = {
  params: { admin_slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from("calendars")
    .select("team_name")
    .eq("admin_slug", params.admin_slug)
    .single();

  const teamName = (data as { team_name?: string } | null)?.team_name;

  if (!teamName) {
    return {
      title: "Admin calendrier",
      description: "Gérez les matchs et partagez le lien du calendrier aux parents.",
    };
  }

  const title = `${teamName} – Admin`;
  const description = `Gérez les matchs de ${teamName} et partagez le lien du calendrier aux parents.`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
