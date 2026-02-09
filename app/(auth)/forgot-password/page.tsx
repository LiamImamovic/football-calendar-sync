"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=/dashboard` }
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message ?? "Une erreur s'est produite.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className="text-2xl font-bold text-center mb-2">Email envoyé</h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Si un compte existe pour <strong>{email}</strong>, vous recevrez un
          lien pour réinitialiser votre mot de passe.
        </p>
        <Button asChild className="w-full" size="lg">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-2">
        Mot de passe oublié
      </h1>
      <p className="text-muted-foreground text-center text-sm mb-6">
        Entrez votre email pour recevoir un lien de réinitialisation.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Envoi…" : "Envoyer le lien"}
        </Button>
      </form>
      <p className="text-center text-sm mt-6">
        <Link href="/login" className="text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
