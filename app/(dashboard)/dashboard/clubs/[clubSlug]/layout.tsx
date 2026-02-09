import { ClubThemeProvider } from "@/components/ClubThemeProvider";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function ClubLayout({
  params,
  children,
}: {
  params: Promise<{ clubSlug: string }>;
  children: React.ReactNode;
}) {
  const { clubSlug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("primary_color, secondary_color")
    .eq("slug", clubSlug)
    .single();

  if (!club) notFound();

  return (
    <ClubThemeProvider
      primaryColor={(club as { primary_color: string | null }).primary_color}
      secondaryColor={(club as { secondary_color: string | null }).secondary_color}
      className="flex-1"
    >
      {children}
    </ClubThemeProvider>
  );
}
