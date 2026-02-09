"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const BUCKET_LOGO = "club-logos";

type Props = {
  clubId: string;
  clubSlug: string;
  initialAddress: string | null;
  initialLogoUrl: string | null;
  initialPrimaryColor: string | null;
  initialSecondaryColor: string | null;
};

export function ClubSettingsForm({
  clubId,
  clubSlug,
  initialAddress,
  initialLogoUrl,
  initialPrimaryColor,
  initialSecondaryColor,
}: Props) {
  const router = useRouter();
  const [address, setAddress] = useState(initialAddress ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl);
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor ?? "");
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const updates: Record<string, string | null> = {};
    if (address.trim() !== (initialAddress ?? "")) {
      updates.address = address.trim() || null;
    }
    const pColor = primaryColor.trim() || null;
    const sColor = secondaryColor.trim() || null;
    if (pColor !== (initialPrimaryColor ?? null)) {
      updates.primary_color = pColor;
    }
    if (sColor !== (initialSecondaryColor ?? null)) {
      updates.secondary_color = sColor;
    }
    if (logoFile) {
      const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${clubId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_LOGO)
        .upload(path, logoFile, { upsert: true });
      if (uploadError) {
        setError("Logo : " + (uploadError.message ?? "upload impossible. Ajoutez les policies Storage (voir docs/STORAGE.md)."));
        toast.error(uploadError.message ?? "Upload du logo impossible.");
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from(BUCKET_LOGO).getPublicUrl(path);
      updates.logo_url = urlData.publicUrl;
    }
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("clubs")
        .update(updates)
        .eq("id", clubId);
      if (updateError) {
        setError(updateError.message ?? "Erreur lors de l'enregistrement.");
        setLoading(false);
        return;
      }
      toast.success("Paramètres enregistrés.");
      router.refresh();
    }
    setLogoFile(null);
    if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(updates.logo_url ?? initialLogoUrl ?? null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    setLoading(false);
  }

  function handleRemoveLogo() {
    setLogoFile(null);
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="address">Adresse du club (domicile)</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="ex: Stade municipal, 123 rue du Sport..."
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Utilisée comme lieu par défaut pour les matchs à domicile.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Logo du club</Label>
        <div className="flex items-center gap-4">
          {(logoPreview || initialLogoUrl) && (
            <div className="relative h-20 w-20 rounded border border-border overflow-hidden bg-muted shrink-0">
              <Image
                src={logoPreview ?? initialLogoUrl ?? ""}
                alt="Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
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
            {(logoPreview || initialLogoUrl) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
              >
                Retirer
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Couleurs du club */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Couleurs du club</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Ces couleurs personnalisent l&apos;interface pour votre club (calendrier parents, pages admin, etc.).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Couleur principale</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="primaryColorPicker"
                value={primaryColor || "#6366f1"}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={loading}
                className="h-10 w-10 rounded border border-border cursor-pointer shrink-0"
              />
              <Input
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#1A4382"
                disabled={loading}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Couleur secondaire</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="secondaryColorPicker"
                value={secondaryColor || "#e8c061"}
                onChange={(e) => setSecondaryColor(e.target.value)}
                disabled={loading}
                className="h-10 w-10 rounded border border-border cursor-pointer shrink-0"
              />
              <Input
                id="secondaryColor"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#E8C061"
                disabled={loading}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>
        {(primaryColor || secondaryColor) && (
          <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/30">
            <span className="text-xs text-muted-foreground">Aperçu :</span>
            {primaryColor && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-5 h-5 rounded-full border border-border"
                  style={{ backgroundColor: primaryColor }}
                />
                <span className="text-xs font-mono">{primaryColor}</span>
              </span>
            )}
            {secondaryColor && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-5 h-5 rounded-full border border-border"
                  style={{ backgroundColor: secondaryColor }}
                />
                <span className="text-xs font-mono">{secondaryColor}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
