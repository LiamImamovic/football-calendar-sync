import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase
    .from("calendars")
    .select("team_name, admin_slug")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: "Erreur lors du chargement des calendriers" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    (data ?? []).map((row) => ({
      team_name: (row as { team_name: string }).team_name,
      admin_slug: (row as { admin_slug: string }).admin_slug,
    })),
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
