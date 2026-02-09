"use client";

import { hexToHslString } from "@/lib/utils";

type ClubThemeProviderProps = {
  primaryColor: string | null;
  secondaryColor: string | null;
  children: React.ReactNode;
  className?: string;
};

/**
 * Override les CSS variables du thème avec les couleurs du club.
 * Wrap les pages/layouts qui doivent afficher l'identité du club.
 *
 * Si les couleurs sont null, on ne surcharge rien (les couleurs SaaS par défaut s'appliquent).
 */
export function ClubThemeProvider({
  primaryColor,
  secondaryColor,
  children,
  className,
}: ClubThemeProviderProps) {
  const style: Record<string, string> = {};

  if (primaryColor) {
    const hsl = hexToHslString(primaryColor);
    style["--primary"] = hsl;
    style["--primary-foreground"] = "0 0% 100%";
    style["--ring"] = hsl;
    style["--foreground"] = hsl;
    style["--card-foreground"] = hsl;
    style["--popover-foreground"] = hsl;
    style["--secondary-foreground"] = hsl;
    style["--accent-foreground"] = hsl;
    style["--particles-color"] = primaryColor;
  }

  if (secondaryColor) {
    const hsl = hexToHslString(secondaryColor);
    style["--accent"] = hsl;
    // Créer une version très claire pour le secondary/muted
    const secondaryLight = hexToHslString(secondaryColor)
      .replace(/\d+%$/, "94%");
    style["--secondary"] = secondaryLight;
  }

  return (
    <div style={style as React.CSSProperties} className={className}>
      {children}
    </div>
  );
}
