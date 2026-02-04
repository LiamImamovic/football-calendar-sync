import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  const { data: memberships } = await supabase
    .from("club_members")
    .select("club_id")
    .eq("user_id", user.id);
  const clubIds = (memberships ?? []).map(
    (m) => (m as { club_id: string }).club_id
  );

  if (clubIds.length === 0) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  const { data, error } = await supabase
    .from("calendars")
    .select("team_name, admin_slug, id")
    .in("club_id", clubIds)
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
      id: (row as { id: string }).id,
    })),
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
