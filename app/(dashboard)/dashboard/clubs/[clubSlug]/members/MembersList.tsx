"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Member = {
  id: string;
  user_id: string;
  role: string;
  profiles: { full_name: string | null; email: string | null } | null;
};
type Invite = {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  created_at: string;
};

function CopyInviteLinkButton({
  token,
  appUrl,
}: {
  token: string;
  appUrl: string;
}) {
  function copyLink() {
    const baseUrl =
      appUrl ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const url = `${baseUrl}/invite?token=${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Lien copié dans le presse-papier"),
      () => toast.error("Impossible de copier le lien")
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copyLink}>
      Copier le lien
    </Button>
  );
}

function memberDisplayName(
  m: Member,
  currentUserId: string
): { primary: string; secondary: string | null } {
  const isYou = m.user_id === currentUserId;
  const name = m.profiles?.full_name?.trim() || m.profiles?.email || null;
  if (isYou) {
    return { primary: "Vous", secondary: name || null };
  }
  return {
    primary: name || "Membre",
    secondary: m.profiles?.email && name !== m.profiles?.email ? m.profiles.email : null,
  };
}

export function MembersList({
  members,
  invites,
  appUrl,
  currentUserId,
}: {
  members: Member[];
  invites: Invite[];
  appUrl: string;
  currentUserId: string;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-semibold mb-3">Membres du club</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Personnes qui ont rejoint le club (vous et les coachs ayant accepté
          l&apos;invitation).
        </p>
        <ul className="space-y-2">
          {members.map((m) => {
            const { primary, secondary } = memberDisplayName(m, currentUserId);
            return (
              <li
                key={m.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium">{primary}</p>
                  {secondary && (
                    <p className="text-sm text-muted-foreground">
                      {secondary}
                    </p>
                  )}
                </div>
                <span className="text-sm rounded-full bg-muted px-2 py-0.5">
                  {m.role === "owner" ? "Propriétaire" : "Coach"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Invitations envoyées</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Invitations en attente. Vous pouvez copier le lien à tout moment pour
          le renvoyer au coach.
        </p>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Aucune invitation en attente.
          </p>
        ) : (
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Invité le{" "}
                    {new Date(inv.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · Expire le{" "}
                    {new Date(inv.expires_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {new Date(inv.expires_at) > new Date() ? (
                    <>
                      <span className="text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5">
                        En attente
                      </span>
                      <CopyInviteLinkButton token={inv.token} appUrl={appUrl} />
                    </>
                  ) : (
                    <span className="text-xs rounded-full bg-muted text-muted-foreground px-2 py-0.5">
                      Expirée
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
