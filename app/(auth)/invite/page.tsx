"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "signup" | "email_mismatch">("loading");
  const [clubName, setClubName] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    async function acceptInvite() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setStatus("signup");
        return;
      }

      const { data: invite, error: inviteError } = await supabase
        .from("club_invites")
        .select("club_id, email")
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cancelled) return;
      if (inviteError || !invite) {
        setStatus("error");
        return;
      }

      const inviteRow = invite as { club_id: string; email: string };
      if (inviteRow.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
        setStatus("email_mismatch");
        return;
      }

      const cid = inviteRow.club_id;

      const { error: insertError } = await supabase.from("club_members").insert({
        club_id: cid,
        user_id: user.id,
        role: "coach",
      });

      if (insertError) {
        setStatus("error");
        return;
      }

      await supabase.from("club_invites").delete().eq("token", token);

      const { data: clubData } = await supabase
        .from("clubs")
        .select("name, slug")
        .eq("id", cid)
        .single();
      const slug = (clubData as { slug: string } | null)?.slug;
      if (clubData) setClubName((clubData as { name: string }).name);

      if (!cancelled) {
        setStatus("success");
        if (slug) {
          router.replace(`/dashboard/clubs/${slug}`);
          router.refresh();
        }
      }
    }

    acceptInvite();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="text-center py-8">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"
          aria-hidden
        />
        <p className="mt-4 text-muted-foreground text-sm">
          Vérification de l&apos;invitation…
        </p>
      </div>
    );
  }

  if (status === "signup") {
    const loginUrl = `/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`;
    return (
      <>
        <h1 className="text-2xl font-bold text-center mb-2">
          Invitation à rejoindre un club
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Créez un compte ou connectez-vous pour accepter cette invitation.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href={`/signup?invite_token=${token}`}>Créer un compte</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href={loginUrl}>J&apos;ai déjà un compte</Link>
          </Button>
        </div>
      </>
    );
  }

  if (status === "email_mismatch") {
    return (
      <>
        <h1 className="text-2xl font-bold text-center mb-2">
          Mauvais compte
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Cette invitation a été envoyée à une autre adresse email. Déconnectez-vous et connectez-vous avec le compte invité.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/login">Se connecter avec un autre compte</Link>
          </Button>
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">Aller au tableau de bord</Link>
          </Button>
        </div>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <h1 className="text-2xl font-bold text-center mb-2">
          Lien invalide ou expiré
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Cette invitation n&apos;existe pas ou a expiré.
        </p>
        <Button asChild className="w-full" size="lg">
          <Link href="/dashboard">Aller au tableau de bord</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-2">Bienvenue !</h1>
      <p className="text-muted-foreground text-center text-sm mb-6">
        Vous avez rejoint le club {clubName || "."}
      </p>
      <Button asChild className="w-full" size="lg">
        <Link href="/dashboard">Aller au tableau de bord</Link>
      </Button>
    </>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Chargement…</div>}>
      <InviteContent />
    </Suspense>
  );
}
