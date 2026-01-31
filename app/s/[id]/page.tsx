"use client";

import logo from "@/assets/images/logo-andernos-sport.avif";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { copyToClipboard, getMapsUrl, shareUrl } from "@/lib/utils";
import type { CalendarEvent, Calendar as CalendarType } from "@/types/database";
import { differenceInDays, format, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { FileDown, MapPin, Share2, Smartphone } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type EventFilter = "upcoming" | "all" | "next5" | "thisMonth";

export default function SubscribePage() {
  const params = useParams();
  const id = params.id as string;
  const [calendar, setCalendar] = useState<CalendarType | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState<EventFilter>("upcoming");
  const [shareFeedback, setShareFeedback] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("calendars")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setCalendar(null);
        setLoading(false);
        return;
      }
      setCalendar(data as unknown as CalendarType);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden
        />
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Calendrier introuvable.</p>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const calUrl = `${baseUrl}/api/cal/${calendar.id}`;
  const webcalUrl = `webcal://${baseUrl.replace(/^https?:\/\//, "")}/api/cal/${
    calendar.id
  }`;

  const allEvents = (calendar.events || []).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const notCancelled = (e: CalendarEvent) => !(e.cancelled ?? false);
  const filteredEvents =
    eventFilter === "upcoming"
      ? allEvents.filter(
          (e) => notCancelled(e) && new Date(e.date) >= startOfToday,
        )
      : eventFilter === "all"
      ? allEvents
      : eventFilter === "next5"
      ? allEvents
          .filter((e) => notCancelled(e) && new Date(e.date) >= now)
          .slice(0, 5)
      : allEvents.filter((e) => {
          const d = new Date(e.date);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        });

  const upcomingCount = allEvents.filter(
    (e) => notCancelled(e) && new Date(e.date) >= startOfToday,
  ).length;
  const nextMatch =
    upcomingCount > 0
      ? allEvents.find(
          (e) => notCancelled(e) && new Date(e.date) >= startOfToday,
        ) ?? null
      : null;
  const nextMatchLabel = nextMatch
    ? isToday(new Date(nextMatch.date))
      ? "aujourd'hui"
      : isTomorrow(new Date(nextMatch.date))
      ? "demain"
      : differenceInDays(new Date(nextMatch.date), now) <= 7
      ? `dans ${differenceInDays(new Date(nextMatch.date), now)} jours`
      : format(new Date(nextMatch.date), "d MMM", { locale: fr })
    : null;

  async function getLogoDataUrl(): Promise<string | null> {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(null);
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = `${window.location.origin}${logo.src}`;
    });
  }

  async function handleDownloadPDF() {
    if (!calendar) return;
    setPdfLoading(true);
    try {
      const [logoDataUrl, { pdf }, { CalendarPDFDocument }] = await Promise.all(
        [
          getLogoDataUrl(),
          import("@react-pdf/renderer"),
          import("@/components/CalendarPDFDocument"),
        ],
      );
      const eventsForPdf = filteredEvents.filter(
        (e: CalendarEvent) => !(e.cancelled ?? false),
      );
      const blob = await pdf(
        <CalendarPDFDocument
          teamName={calendar.team_name}
          events={eventsForPdf}
          logoDataUrl={logoDataUrl}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `calendrier-${calendar.team_name.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Erreur génération PDF:", e);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] p-4 pb-8 max-w-lg mx-auto">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="flex justify-center mb-3">
          <Image
            src={logo}
            alt="Andernos Sport"
            className="h-14 w-auto object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-foreground leading-tight">
          Calendrier de {calendar.team_name}
        </h1>
        <p className="text-base text-muted-foreground mt-1">
          Ajoutez ce calendrier à votre téléphone pour ne rater aucun match.
        </p>
      </div>

      <Card className="mb-6 border-2 border-primary/20 bg-background shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 shrink-0" /> S&apos;abonner au
            calendrier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button asChild className="flex-1" size="lg">
              <a href={webcalUrl}>S&apos;abonner au calendrier</a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="shrink-0"
              onClick={async () => {
                const url =
                  typeof window !== "undefined" ? window.location.href : "";
                const ok = await shareUrl(
                  url,
                  `Calendrier des matchs - ${calendar.team_name}`,
                  `Abonnez-vous au calendrier des matchs : ${url}`,
                );
                if (!ok) {
                  const copied = await copyToClipboard(url);
                  if (copied) {
                    setShareFeedback(true);
                    setTimeout(() => setShareFeedback(false), 3000);
                  }
                }
              }}
              aria-label="Partager cette page"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          {shareFeedback && (
            <p className="text-xs text-green-600">
              Lien copié ! Collez-le dans WhatsApp, Messages ou un mail pour
              partager.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Ce lien ouvre l&apos;application Calendrier sur votre téléphone.
          </p>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="mb-8">
        <AccordionItem value="iphone">
          <AccordionTrigger>Comment ajouter sur iPhone ?</AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700">
              <li>
                Appuyez sur &quot;S&apos;abonner au calendrier&quot; ci-dessus.
              </li>
              <li>
                Choisissez &quot;S&apos;abonner&quot; dans la fenêtre qui
                s&apos;ouvre.
              </li>
              <li>Les matchs apparaîtront dans l&apos;app Calendrier.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="android">
          <AccordionTrigger className="py-4 text-left">
            Comment ajouter sur Android ?
          </AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700">
              <li>Ouvrez Google Agenda sur votre téléphone.</li>
              <li>
                Menu (≡) → Paramètres → Ajouter un compte → Importer un
                calendrier.
              </li>
              <li>
                Collez ce lien :{" "}
                <code className="bg-zinc-100 px-1 rounded text-xs break-all">
                  {calUrl}
                </code>
              </li>
              <li>Validez : les matchs seront visibles dans Google Agenda.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="text-lg">Matchs à venir</CardTitle>
              <CardDescription>
                {allEvents.length === 0
                  ? "Liste des matchs du calendrier (lecture seule)."
                  : nextMatchLabel
                  ? `Prochain match : ${nextMatchLabel}.`
                  : ""}
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="w-full shrink-0"
            >
              <FileDown className="h-5 w-5 mr-2 shrink-0" />
              {pdfLoading ? "Génération…" : "Télécharger le PDF"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun match programmé pour l&apos;instant.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <label
                  htmlFor="event-filter"
                  className="text-sm text-zinc-600 shrink-0"
                >
                  Afficher :
                </label>
                <select
                  id="event-filter"
                  value={eventFilter}
                  onChange={(e) =>
                    setEventFilter(e.target.value as EventFilter)
                  }
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full max-w-[180px]"
                >
                  <option value="upcoming">À venir</option>
                  <option value="all">Tous les matchs</option>
                  <option value="next5">5 prochains</option>
                  <option value="thisMonth">Ce mois</option>
                </select>
              </div>
              {filteredEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun match dans cette période.
                </p>
              ) : (
                <ul className="space-y-3">
                  {filteredEvents.map((ev: CalendarEvent) => {
                    const isCancelled = ev.cancelled ?? false;
                    return (
                      <li
                        key={ev.id}
                        className={`flex flex-col gap-1 py-3 border-b border-zinc-100 last:border-0 ${
                          isCancelled
                            ? "opacity-60 bg-zinc-50/50 rounded-md px-2 -mx-2"
                            : ""
                        }`}
                      >
                        <span
                          className={`font-medium inline-flex items-center gap-2 ${
                            isCancelled
                              ? "text-zinc-500 line-through"
                              : "text-zinc-900"
                          }`}
                        >
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: ev.is_home
                                ? "#1A4382"
                                : "#d97706",
                            }}
                            title={ev.is_home ? "Domicile" : "Extérieur"}
                            aria-hidden
                          />
                          {ev.is_home ? (
                            <>Nous vs {ev.opponent}</>
                          ) : (
                            <>{ev.opponent} vs Nous</>
                          )}
                          {isCancelled && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Annulé
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-sm ${
                            isCancelled
                              ? "text-zinc-400 line-through"
                              : "text-zinc-600"
                          }`}
                        >
                          {format(new Date(ev.date), "EEEE d MMMM · HH:mm", {
                            locale: fr,
                          })}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span
                            className={
                              isCancelled
                                ? "text-zinc-400 line-through"
                                : "text-zinc-600"
                            }
                          >
                            {ev.location}
                          </span>
                          <a
                            href={getMapsUrl(ev.location)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline py-1.5"
                          >
                            <MapPin className="h-4 w-4 shrink-0" />
                            Voir sur la carte
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {filteredEvents.length > 0 && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-[#1A4382]"
                      aria-hidden
                    />
                    Domicile
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-[#d97706]"
                      aria-hidden
                    />
                    Extérieur
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
