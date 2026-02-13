import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteCoachForm } from "./InviteCoachForm";
import { MembersList } from "./MembersList";

export default async function ClubMembersPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, owner_id")
    .eq("slug", clubSlug)
    .single();
  if (!club) notFound();

  const c = club as { id: string; name: string; slug: string; owner_id: string };
  if (c.owner_id !== user.id) notFound();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, plans(max_coaches)")
    .eq("club_id", c.id)
    .single();
  const maxCoaches =
    (sub as { plans: { max_coaches: number } | null } | null)?.plans
      ?.max_coaches ?? 3;

  const { data: members } = await supabase
    .from("club_members")
    .select("id, user_id, role")
    .eq("club_id", c.id);
  // Charger les invitations avec le client admin pour contourner la RLS
  // (l'owner doit toujours voir la liste ; la policy "Owners can view" peut ne pas être appliquée)
  let invites: { id: string; email: string; role: string; token: string; expires_at: string; created_at: string }[] | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("club_invites")
      .select("id, email, role, token, expires_at, created_at")
      .eq("club_id", c.id)
      .order("created_at", { ascending: false });
    invites = data;
  } catch {
    const { data } = await supabase
      .from("club_invites")
      .select("id, email, role, token, expires_at, created_at")
      .eq("club_id", c.id)
      .order("created_at", { ascending: false });
    invites = data;
  }

  const membersListRaw = (members ?? []) as {
    id: string;
    user_id: string;
    role: string;
  }[];
  const userIds = Array.from(new Set(membersListRaw.map((m) => m.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);
  const profileMap = new Map<string, { full_name: string | null; email: string | null }>(
    (profiles ?? []).map((p) => [
      (p as { id: string }).id,
      p as { full_name: string | null; email: string | null },
    ])
  );
  // Pour les utilisateurs sans profil (ou profil vide), récupérer nom/email depuis auth
  const missingUserIds = userIds.filter((id) => {
    const p = profileMap.get(id);
    return !p || ((p.full_name == null || p.full_name.trim() === "") && (p.email == null || p.email.trim() === ""));
  });
  if (missingUserIds.length > 0) {
    const admin = createAdminClient();
    for (const uid of missingUserIds) {
      const { data: authUser } = await admin.auth.admin.getUserById(uid);
      const u = authUser?.user;
      if (u) {
        const fullName = (u.user_metadata?.full_name as string)?.trim() || null;
        const email = (u.email as string)?.trim() || null;
        const existing = profileMap.get(uid);
        profileMap.set(uid, {
          full_name: fullName || (existing?.full_name ?? null),
          email: email || (existing?.email ?? null),
        });
      }
    }
  }
  const membersList = membersListRaw.map((m) => ({
    ...m,
    profiles: profileMap.get(m.user_id) ?? null,
  }));
  const invitesList = (invites ?? []) as {
    id: string;
    email: string;
    role: string;
    token: string;
    expires_at: string;
    created_at: string;
  }[];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const now = new Date().toISOString();
  const pendingInvitesCount = invitesList.filter(
    (inv) => inv.expires_at > now
  ).length;
  const coachCount =
    membersListRaw.filter((m) => m.role === "coach").length + pendingInvitesCount;
  const canInvite = coachCount < maxCoaches;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Membres — {c.name}</h1>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/clubs/${clubSlug}`}>Retour au club</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Inviter un coach</CardTitle>
          <CardDescription>
            Saisissez l&apos;email du coach. Il recevra un lien d&apos;invitation
            pour rejoindre le club. Limite : {maxCoaches} coachs (hors vous).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteCoachForm clubId={c.id} canInvite={canInvite} />
        </CardContent>
      </Card>

      <MembersList
        members={membersList}
        invites={invitesList}
        appUrl={appUrl}
        currentUserId={user.id}
      />
    </div>
  );
}
