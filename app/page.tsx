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
  FileDown,
  Link2,
  Smartphone,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import logo from "@/assets/images/logo-andernos-sport.avif";

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Image
            src={logo}
            alt="Football Calendar Sync"
            className="h-9 w-auto object-contain"
            priority
          />
          <span className="font-semibold text-foreground hidden sm:inline">
            Football Calendar Sync
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild size="sm">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Commencer gratuitement</Link>
          </Button>
        </nav>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight max-w-2xl">
          Ne ratez plus jamais un match
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl">
          Créez un calendrier pour votre équipe, partagez-le aux parents.
          Abonnement .ics et PDF en un clic.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="min-h-[48px]">
            <Link href="/signup">Commencer gratuitement</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-h-[48px]">
            <Link href="/login">J&apos;ai déjà un compte</Link>
          </Button>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-16 border-t border-border">
        <h2 className="text-2xl font-bold text-center mb-8">
          Pour les clubs et les coachs
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-base">Calendrier partagé</CardTitle>
              <CardDescription>
                Ajoutez les matchs, les parents voient tout à jour.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Link2 className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-base">Lien .ics</CardTitle>
              <CardDescription>
                Un lien à envoyer : abonnement direct sur iPhone et Android.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <FileDown className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-base">PDF à télécharger</CardTitle>
              <CardDescription>
                Les parents peuvent télécharger le calendrier en PDF.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-base">Plusieurs équipes</CardTitle>
              <CardDescription>
                Un club, plusieurs coachs et équipes, tout centralisé.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-16 bg-muted/30">
        <h2 className="text-2xl font-bold text-center mb-8">Tarifs</h2>
        <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
          <Card>
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
          <Card className="border-primary shadow-md">
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
          <Card>
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

      <section className="px-4 py-12 sm:py-16 flex flex-col items-center text-center">
        <Smartphone className="h-12 w-12 text-primary mb-4" />
        <h2 className="text-xl font-bold">Les parents s&apos;abonnent en un clic</h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          Le coach envoie le lien du calendrier. Les parents ouvrent le lien,
          cliquent « S&apos;abonner au calendrier » : les matchs apparaissent sur
          leur téléphone. Pas de compte requis.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/signup">Créer un compte et essayer</Link>
        </Button>
      </section>

      <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
        <p>Football Calendar Sync — Calendriers partagés pour les équipes.</p>
      </footer>
    </main>
  );
}
