"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite_token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    // Build emailRedirectTo so the confirmation email links back to the invite
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const redirectAfterConfirm = inviteToken
      ? `${baseUrl}/auth/callback?next=${encodeURIComponent(`/invite?token=${inviteToken}`)}`
      : `${baseUrl}/auth/callback?next=/dashboard`;

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() || undefined },
        emailRedirectTo: redirectAfterConfirm,
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message ?? "Une erreur s'est produite.");
      return;
    }
    setSuccess(true);
    router.refresh();
    // Si pas de confirmation email, l'utilisateur est déjà connecté → aller accepter l'invite
    if (inviteToken) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(`/invite?token=${inviteToken}`);
      }
    }
  }

  if (success) {
    const loginRedirect = inviteToken
      ? `/login?redirect=${encodeURIComponent(`/invite?token=${inviteToken}`)}`
      : "/login";
    return (
      <>
        <h1 className="text-2xl font-bold text-center mb-2">Vérifiez votre email</h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Un lien de confirmation a été envoyé à <strong>{email}</strong>.
          Cliquez dessus pour activer votre compte, puis connectez-vous pour rejoindre le club.
        </p>
        <Button asChild className="w-full" size="lg">
          <Link href={loginRedirect}>Aller à la connexion</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-2">Créer un compte</h1>
      <p className="text-muted-foreground text-center text-sm mb-6">
        {inviteToken
          ? "Créez un compte pour rejoindre le club qui vous a invité."
          : "Créez votre club et partagez vos calendriers."}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom (optionnel)</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Jean Dupont"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="6 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Inscription…" : "S'inscrire"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Chargement…</div>}>
      <SignupForm />
    </Suspense>
  );
}
