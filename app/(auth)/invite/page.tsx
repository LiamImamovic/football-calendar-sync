"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

type InviteInfo = {
  club_name: string;
  inviter_name: string;
  invited_email: string;
};

type Status =
  | "loading"
  | "signup"
  | "accepting"
  | "success"
  | "error"
  | "email_mismatch"
  | "expired";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [clubName, setClubName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch invite info (no auth required)
  const fetchInviteInfo = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await fetch(`/api/invite-info?token=${token}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 410) {
          setStatus("expired");
          return null;
        }
        setErrorMsg(data.error || "Invitation introuvable");
        setStatus("error");
        return null;
      }
      const data: InviteInfo = await res.json();
      setInviteInfo(data);
      return data;
    } catch {
      setStatus("error");
      return null;
    }
  }, [token]);

  // Accept invite via API (auth required)
  const acceptInvite = useCallback(async () => {
    if (!token) return;
    setStatus("accepting");
    try {
      const res = await fetch("/api/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setStatus("email_mismatch");
          return;
        }
        if (res.status === 410) {
          setStatus("expired");
          return;
        }
        setErrorMsg(data.error || "Erreur lors de l'acceptation");
        setStatus("error");
        return;
      }
      setClubName(data.club_name || "");
      setStatus("success");
      if (data.club_slug) {
        router.replace(`/dashboard/clubs/${data.club_slug}`);
        router.refresh();
      }
    } catch {
      setErrorMsg("Erreur réseau");
      setStatus("error");
    }
  }, [token, router]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Lien d'invitation invalide");
      return;
    }

    let cancelled = false;

    async function init() {
      // 1. Fetch invite details
      const info = await fetchInviteInfo();
      if (cancelled || !info) return;

      // 2. Check if user is authenticated
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setStatus("signup");
        return;
      }

      // 3. User is authenticated → accept the invite
      if (!cancelled) await acceptInvite();
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [token, fetchInviteInfo, acceptInvite]);

  // --- Loading ---
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

  // --- Accepting ---
  if (status === "accepting") {
    return (
      <div className="text-center py-8">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"
          aria-hidden
        />
        {inviteInfo && (
          <p className="mt-4 text-muted-foreground text-sm">
            Vous rejoignez <strong>{inviteInfo.club_name}</strong>…
          </p>
        )}
      </div>
    );
  }

  // --- Signup / Login required ---
  if (status === "signup") {
    const loginUrl = `/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`;
    return (
      <>
        {inviteInfo && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <svg
                className="w-7 h-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              Invitation à rejoindre un club
            </h1>
            <p className="text-muted-foreground text-sm">
              <strong>{inviteInfo.inviter_name}</strong> vous invite à rejoindre{" "}
              <strong>{inviteInfo.club_name}</strong>.
            </p>
          </div>
        )}
        {!inviteInfo && (
          <h1 className="text-2xl font-bold text-center mb-2">
            Invitation à rejoindre un club
          </h1>
        )}
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

  // --- Email mismatch ---
  if (status === "email_mismatch") {
    return (
      <>
        <h1 className="text-2xl font-bold text-center mb-2">
          Mauvais compte
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Cette invitation a été envoyée à une autre adresse email.
          Déconnectez-vous et connectez-vous avec le bon compte.
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

  // --- Expired ---
  if (status === "expired") {
    return (
      <>
        <h1 className="text-2xl font-bold text-center mb-2">
          Invitation expirée
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Cette invitation a expiré. Demandez au propriétaire du club de vous
          renvoyer une invitation.
        </p>
        <Button asChild className="w-full" size="lg">
          <Link href="/login">Se connecter</Link>
        </Button>
      </>
    );
  }

  // --- Error ---
  if (status === "error") {
    return (
      <>
        <h1 className="text-2xl font-bold text-center mb-2">
          Lien invalide
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          {errorMsg || "Cette invitation n'existe pas ou a expiré."}
        </p>
        <Button asChild className="w-full" size="lg">
          <Link href="/dashboard">Aller au tableau de bord</Link>
        </Button>
      </>
    );
  }

  // --- Success ---
  return (
    <>
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
          <svg
            className="w-7 h-7 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Bienvenue !</h1>
      </div>
      <p className="text-muted-foreground text-center text-sm mb-6">
        Vous avez rejoint le club{" "}
        <strong>{clubName || inviteInfo?.club_name || ""}</strong>.
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
