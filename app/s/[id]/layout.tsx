import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from("calendars")
    .select("team_name")
    .eq("id", params.id)
    .single();

  const teamName = (data as { team_name?: string } | null)?.team_name;

  if (!teamName) {
    return {
      title: "Calendrier",
      description:
        "Ajoutez le calendrier des matchs à votre téléphone pour ne rater aucun match.",
    };
  }

  const title = `Calendrier de ${teamName}`;
  const description = `Ajoutez le calendrier des matchs de ${teamName} à votre téléphone pour ne rater aucun match.`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
  };
}

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
