"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function InviteCoachForm({
  clubId,
  canInvite,
}: {
  clubId: string;
  canInvite: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Saisissez l'email du coach.");
      return;
    }
    if (!canInvite) {
      setError("Limite de coachs atteinte. Passez au plan supérieur.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const token = crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const { error: insertError } = await supabase.from("club_invites").insert({
      club_id: clubId,
      email: trimmed,
      role: "coach",
      token,
      expires_at: expiresAt.toISOString(),
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message ?? "Erreur lors de l'invitation.");
      return;
    }
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const inviteUrl = `${baseUrl}/invite?token=${token}`;
    toast.success("Invitation créée. Envoyez ce lien au coach : " + inviteUrl);
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px] space-y-2">
        <Label htmlFor="invite-email">Email du coach</Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="coach@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || !canInvite}
        />
      </div>
      <Button type="submit" disabled={loading || !canInvite}>
        {loading ? "Envoi…" : "Inviter"}
      </Button>
      {error && <p className="text-sm text-red-600 w-full">{error}</p>}
    </form>
  );
}
