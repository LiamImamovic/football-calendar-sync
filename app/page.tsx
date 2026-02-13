import { TypewriterHeading } from "@/components/landing/TypewriterHeading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  ChevronRight,
  FileDown,
  Link2,
  Smartphone,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 sm:px-6 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground hidden sm:inline">
            Football Calendar Sync
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild size="sm">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild size="sm" className="cta-glow">
            <Link href="/signup">Commencer gratuitement</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-20 text-center">
        <div className="landing-animate landing-animate-delay-1 flex justify-center w-full">
          <TypewriterHeading className="whitespace-nowrap" />
        </div>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl landing-animate landing-animate-delay-2">
          Créez un calendrier pour votre équipe, partagez-le aux parents.
          Abonnement .ics et PDF en un clic.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center landing-animate landing-animate-delay-3">
          <Button
            asChild
            size="lg"
            className="min-h-[48px] cta-glow text-base px-6"
          >
            <Link href="/signup">Commencer gratuitement</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-h-[48px] text-base"
          >
            <Link href="/login">J&apos;ai déjà un compte</Link>
          </Button>
        </div>
      </section>

      {/* Bento features */}
      <section className="px-4 py-16 sm:py-20 border-t border-border/60">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 landing-animate">
          Pour les clubs et les coachs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <Card className="bento-card lg:col-span-1 landing-animate landing-animate-delay-1 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
                <Calendar className="h-6 w-6" />
              </div>
              <CardTitle className="text-base">Calendrier partagé</CardTitle>
              <CardDescription>
                Ajoutez les matchs, les parents voient tout à jour.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bento-card lg:col-span-1 landing-animate landing-animate-delay-2 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
                <Link2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-base">Lien .ics</CardTitle>
              <CardDescription>
                Un lien à envoyer : abonnement direct sur iPhone et Android.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bento-card lg:col-span-1 landing-animate landing-animate-delay-3 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
                <FileDown className="h-6 w-6" />
              </div>
              <CardTitle className="text-base">PDF à télécharger</CardTitle>
              <CardDescription>
                Les parents peuvent télécharger le calendrier en PDF.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bento-card lg:col-span-1 landing-animate landing-animate-delay-4 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle className="text-base">Plusieurs équipes</CardTitle>
              <CardDescription>
                Un club, plusieurs coachs et équipes, tout centralisé.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-16 sm:py-20 bg-muted/30 border-t border-border/60">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          Tarifs
        </h2>
        <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
          <Card className="bento-card">
            <CardHeader>
              <CardTitle>Gratuit</CardTitle>
              <CardDescription>Pour démarrer</CardDescription>
              <p className="text-2xl font-bold mt-2">0 €</p>
              <p className="text-sm text-muted-foreground">/ an</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>3 coachs max</p>
              <p>5 calendriers (équipes)</p>
              <p>Toutes les fonctionnalités de base</p>
            </CardContent>
          </Card>
          <Card className="bento-card border-primary shadow-lg ring-2 ring-primary/20">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Clubs actifs</CardDescription>
              <p className="text-2xl font-bold mt-2">15 €</p>
              <p className="text-sm text-muted-foreground">/ an</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>5 coachs max</p>
              <p>10 calendriers</p>
              <p>Idéal pour plusieurs équipes</p>
            </CardContent>
          </Card>
          <Card className="bento-card">
            <CardHeader>
              <CardTitle>Club</CardTitle>
              <CardDescription>Gros clubs</CardDescription>
              <p className="text-2xl font-bold mt-2">49 €</p>
              <p className="text-sm text-muted-foreground">/ an</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>10 coachs max</p>
              <p>25 calendriers</p>
              <p>Pour les structures importantes</p>
            </CardContent>
          </Card>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Géré par l&apos;owner du club. Les parents ne paient rien.
        </p>
      </section>

      {/* CTA parents */}
      <section className="px-4 py-16 sm:py-20 flex flex-col items-center text-center border-t border-border/60">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
          <Smartphone className="h-8 w-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">
          Les parents s&apos;abonnent en un clic
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md">
          Le coach envoie le lien du calendrier. Les parents ouvrent le lien,
          cliquent « S&apos;abonner au calendrier » : les matchs apparaissent
          sur leur téléphone. Pas de compte requis.
        </p>
        <Button asChild size="lg" className="mt-8 cta-glow" variant="default">
          <Link href="/signup">
            Créer un compte et essayer
            <ChevronRight className="ml-1 h-4 w-4 inline" />
          </Link>
        </Button>
      </section>

      <footer className="border-t border-border/80 px-4 py-8 text-center text-sm text-muted-foreground bg-muted/20">
        <p>Football Calendar Sync — Calendriers partagés pour les équipes.</p>
      </footer>
    </main>
  );
}
