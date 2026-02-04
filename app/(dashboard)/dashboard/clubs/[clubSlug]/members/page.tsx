import { createClient } from "@/lib/supabase/server";
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
  const { data: invites } = await supabase
    .from("club_invites")
    .select("id, email, role, expires_at")
    .eq("club_id", c.id)
    .gt("expires_at", new Date().toISOString());

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
  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      (p as { id: string }).id,
      p as { full_name: string | null; email: string | null },
    ])
  );
  const membersList = membersListRaw.map((m) => ({
    ...m,
    profiles: profileMap.get(m.user_id) ?? null,
  }));
  const invitesList = (invites ?? []) as {
    id: string;
    email: string;
    role: string;
    expires_at: string;
  }[];
  const coachCount =
    membersListRaw.filter((m) => m.role === "coach").length + invitesList.length;
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

      <MembersList members={membersList} invites={invitesList} />
    </div>
  );
}
