import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/invite-info?token=xxx
 * Returns public invite details (club name, inviter name) — no auth required.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch invite
  const { data: invite, error: inviteError } = await supabase
    .from("club_invites")
    .select("club_id, email, expires_at")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "Invitation introuvable" },
      { status: 404 }
    );
  }

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Invitation expirée" },
      { status: 410 }
    );
  }

  // Fetch club
  const { data: club } = await supabase
    .from("clubs")
    .select("name, owner_id")
    .eq("id", invite.club_id)
    .single();

  if (!club) {
    return NextResponse.json(
      { error: "Club introuvable" },
      { status: 404 }
    );
  }

  // Fetch inviter (club owner) name
  const { data: owner } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", club.owner_id)
    .single();

  const inviterName =
    owner?.full_name || owner?.email || "Le propriétaire du club";

  return NextResponse.json({
    club_name: club.name,
    inviter_name: inviterName,
    invited_email: invite.email,
  });
}
