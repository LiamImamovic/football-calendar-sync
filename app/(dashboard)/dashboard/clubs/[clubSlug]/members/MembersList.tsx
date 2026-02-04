"use client";

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
  expires_at: string;
};

export function MembersList({
  members,
  invites,
}: {
  members: Member[];
  invites: Invite[];
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Membres</h2>
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div>
              <p className="font-medium">
                {m.profiles?.full_name || m.profiles?.email || m.user_id}
              </p>
              {m.profiles?.email && (
                <p className="text-sm text-muted-foreground">
                  {m.profiles.email}
                </p>
              )}
            </div>
            <span className="text-sm rounded-full bg-muted px-2 py-0.5">
              {m.role === "owner" ? "Owner" : "Coach"}
            </span>
          </li>
        ))}
      </ul>
      {invites.length > 0 && (
        <>
          <h2 className="font-semibold mt-6">Invitations en attente</h2>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <p className="text-muted-foreground">{inv.email}</p>
                <span className="text-xs text-muted-foreground">
                  Expire le{" "}
                  {new Date(inv.expires_at).toLocaleDateString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
