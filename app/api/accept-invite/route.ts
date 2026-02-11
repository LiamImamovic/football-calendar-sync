import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/accept-invite
 * Body: { token: string }
 * Authenticated user accepts a club invitation.
 */
export async function POST(request: NextRequest) {
  // 1. Verify the user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  // 2. Parse body
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const token = body.token;
  if (!token) {
    return NextResponse.json(
      { error: "Token manquant" },
      { status: 400 }
    );
  }

  // 3. Use admin client (bypasses RLS) to read invite
  const admin = createAdminClient();

  const { data: invite, error: inviteError } = await admin
    .from("club_invites")
    .select("club_id, email, expires_at")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "Invitation introuvable ou invalide" },
      { status: 404 }
    );
  }

  // 4. Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Invitation expirée" },
      { status: 410 }
    );
  }

  // 5. Check email match
  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return NextResponse.json(
      { error: "Cette invitation est destinée à une autre adresse email" },
      { status: 403 }
    );
  }

  // 6. Check if already a member
  const { data: existing } = await admin
    .from("club_members")
    .select("id")
    .eq("club_id", invite.club_id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Already a member — just clean up the invite
    await admin.from("club_invites").delete().eq("token", token);

    const { data: club } = await admin
      .from("clubs")
      .select("slug, name")
      .eq("id", invite.club_id)
      .single();

    return NextResponse.json({
      success: true,
      club_slug: club?.slug,
      club_name: club?.name,
    });
  }

  // 7. Insert as club member
  const { error: insertError } = await admin.from("club_members").insert({
    club_id: invite.club_id,
    user_id: user.id,
    role: "coach",
  });

  if (insertError) {
    console.error("Failed to insert club member:", insertError);
    return NextResponse.json(
      { error: "Impossible de rejoindre le club" },
      { status: 500 }
    );
  }

  // 8. Delete the invite
  await admin.from("club_invites").delete().eq("token", token);

  // 9. Return club info
  const { data: club } = await admin
    .from("clubs")
    .select("slug, name")
    .eq("id", invite.club_id)
    .single();

  return NextResponse.json({
    success: true,
    club_slug: club?.slug,
    club_name: club?.name,
  });
}
