"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const BUCKET_LOGO = "club-logos";

function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "club"
  );
}

export default function NewClubForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [secondaryColor, setSecondaryColor] = useState("#f59e0b");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  function handleNameChange(value: string) {
    setName(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const finalSlug = slugify(name) || "club";
    setLoading(true);
    const { data: club, error: insertClubError } = await supabase
      .from("clubs")
      .insert({
        name: name.trim(),
        slug: finalSlug,
        address: address.trim() || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        owner_id: user.id,
      })
      .select("id")
      .single();

    if (insertClubError) {
      setLoading(false);
      setError(insertClubError.message ?? "Erreur lors de la création.");
      return;
    }

    const clubId = (club as { id: string }).id;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${clubId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_LOGO)
        .upload(path, logoFile, { upsert: true });
      if (uploadError) {
        toast.error(
          "Logo : " +
            (uploadError.message ??
              "upload impossible. Vérifiez les policies Storage (bucket club-logos)."),
        );
      } else {
        const { data: urlData } = supabase.storage
          .from(BUCKET_LOGO)
          .getPublicUrl(path);
        await supabase
          .from("clubs")
          .update({ logo_url: urlData.publicUrl })
          .eq("id", clubId);
      }
    }

    await supabase.from("club_members").insert({
      club_id: clubId,
      user_id: user.id,
      role: "owner",
    });

    const { data: plan } = await supabase
      .from("plans")
      .select("id")
      .eq("id", "free")
      .single();
    if (plan) {
      await supabase.from("subscriptions").insert({
        club_id: clubId,
        plan_id: "free",
      });
    }

    setLoading(false);
    router.push(`/dashboard/clubs/${finalSlug}`);
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Créer mon club</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du club</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="ex: FC Mon Club"
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Adresse (optionnel)</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse du siège"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label>Logo du club (optionnel)</Label>
          <div className="flex items-center gap-4">
            {logoPreview && (
              <div className="relative h-16 w-16 rounded border border-border overflow-hidden bg-muted">
                <Image
                  src={logoPreview}
                  alt="Aperçu"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setLogoFile(f);
                    setLogoPreview(URL.createObjectURL(f));
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={loading}
              >
                {logoFile ? "Changer" : "Choisir un fichier"}
              </Button>
              {logoFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogoFile(null);
                    if (logoPreview) URL.revokeObjectURL(logoPreview);
                    setLogoPreview(null);
                    if (logoInputRef.current) logoInputRef.current.value = "";
                  }}
                >
                  Retirer
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Couleur principale</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded border border-input cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 font-mono text-sm"
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Couleur secondaire</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-14 rounded border border-input cursor-pointer"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 font-mono text-sm"
                disabled={loading}
              />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Création…" : "Créer mon club"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/clubs">Annuler</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
