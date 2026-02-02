import { ParticlesBackground } from "@/components/ParticlesBackground";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calendrier Andernos Sport",
  description:
    "Ne ratez plus jamais un match. Calendrier partagé pour les équipes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="touch-manipulation">
      <body className="relative antialiased font-sans bg-background text-foreground min-h-[100dvh] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom)]">
        <ParticlesBackground />
        {children}
        <Toaster
          richColors
          position="top-center"
          closeButton
          toastOptions={{
            style: { marginTop: "max(0.5rem, env(safe-area-inset-top))" },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
