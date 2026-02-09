"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-2">Connexion</h1>
      <p className="text-muted-foreground text-center text-sm mb-6">
        Accédez à vos clubs et calendriers.
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
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <p className="text-center text-sm mt-4">
        <Link
          href="/forgot-password"
          className="text-primary hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground mt-2">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-primary hover:underline font-medium">
          S&apos;inscrire
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Chargement…</div>}>
      <LoginForm />
    </Suspense>
  );
}
