import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Identifiant du calendrier requis" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { error } = await supabase.from("calendars").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Impossible de supprimer le calendrier" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
