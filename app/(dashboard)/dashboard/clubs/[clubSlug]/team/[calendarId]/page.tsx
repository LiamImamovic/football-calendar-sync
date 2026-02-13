"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCalendarById } from "@/hooks/use-calendar";
import { useClub } from "@/hooks/use-club";
import { copyToClipboard, getMapsUrl, randomUUID, shareUrl } from "@/lib/utils";
import type { CalendarEvent } from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInDays, format, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Check,
  Copy,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const eventSchema = z.object({
  date: z.date(),
  time: z.string().regex(/^\d{1,2}:\d{2}$/, "Format HH:MM"),
  opponent: z.string().min(1, "Obligatoire"),
  location: z.string().min(1, "Obligatoire"),
  is_home: z.boolean(),
});

type EventFormValues = z.infer<typeof eventSchema>;

type HomeAwayFilter = "all" | "home" | "away";

export default function TeamCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const clubSlug = params.clubSlug as string;
  const calendarId = params.calendarId as string;
  const { calendar, loading, setCalendar, supabase } =
    useCalendarById(calendarId);
  const { club } = useClub(clubSlug);
  const [addEventLoading, setAddEventLoading] = useState(false);
  const [addEventError, setAddEventError] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [copiedParents, setCopiedParents] = useState(false);
  const [eventIdToCancel, setEventIdToCancel] = useState<string | null>(null);
  const [homeAwayFilter, setHomeAwayFilter] = useState<HomeAwayFilter>("all");
  const [showDeleteTeamDialog, setShowDeleteTeamDialog] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);

  const domicileAddress = club?.address ?? "";
  const clubLogoUrl = club?.logo_url ?? null;

  const parentsShareUrl =
    typeof window !== "undefined" && calendar?.id
      ? `${window.location.origin}/s/${calendar.id}`
      : "";

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      date: new Date(),
      time: "14:00",
      opponent: "",
      location: "",
      is_home: true,
    },
  });

  useEffect(() => {
    if (!loading && !calendar) {
      router.push(`/dashboard/clubs/${clubSlug}`);
    }
  }, [loading, calendar, router, clubSlug]);

  useEffect(() => {
    if (club?.address && form.getValues("is_home")) {
      form.setValue("location", club.address);
    }
  }, [club?.address]);

  async function onAddEvent(values: EventFormValues) {
    if (!calendar) return;
    setAddEventError(null);
    setAddEventLoading(true);
    const [h, m] = values.time.split(":").map(Number);
    const d = new Date(values.date);
    d.setHours(h, m, 0, 0);
    const event: CalendarEvent = {
      id: randomUUID(),
      date: d.toISOString(),
      opponent: values.opponent,
      location: values.location,
      is_home: values.is_home,
      cancelled: false,
    };
    const events = [...(calendar.events || []), event];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("calendars") as any)
      .update({ events })
      .eq("id", calendar.id);
    setAddEventLoading(false);
    if (!error) {
      setCalendar({ ...calendar, events });
      form.reset({
        date: new Date(),
        time: "14:00",
        opponent: "",
        location: form.getValues("is_home") ? domicileAddress : "",
        is_home: form.getValues("is_home"),
      });
      toast.success("Match ajouté");
    } else {
      setAddEventError("Erreur lors de l'ajout. Réessayez.");
      toast.error("Erreur lors de l'ajout. Réessayez.");
    }
  }

  async function onUpdateEvent(eventId: string, values: EventFormValues) {
    if (!calendar) return;
    setAddEventError(null);
    setAddEventLoading(true);
    const [h, m] = values.time.split(":").map(Number);
    const d = new Date(values.date);
    d.setHours(h, m, 0, 0);
    const current = (calendar.events || []).find((e) => e.id === eventId);
    const updated: CalendarEvent = {
      id: eventId,
      date: d.toISOString(),
      opponent: values.opponent,
      location: values.location,
      is_home: values.is_home,
      cancelled: current?.cancelled ?? false,
    };
    const events = (calendar.events || []).map((e) =>
      e.id === eventId ? updated : e,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("calendars") as any)
      .update({ events })
      .eq("id", calendar.id);
    setAddEventLoading(false);
    if (!error) {
      setCalendar({ ...calendar, events });
      setEditingEventId(null);
      form.reset({
        date: new Date(),
        time: "14:00",
        opponent: "",
        location: domicileAddress,
        is_home: true,
      });
      toast.success("Match modifié");
    } else {
      setAddEventError("Erreur lors de la modification. Réessayez.");
      toast.error("Erreur lors de la modification. Réessayez.");
    }
  }

  function startEditEvent(ev: CalendarEvent) {
    form.reset({
      date: new Date(ev.date),
      time: format(new Date(ev.date), "HH:mm"),
      opponent: ev.opponent,
      location: ev.is_home ? domicileAddress : ev.location,
      is_home: ev.is_home,
    });
    setEditingEventId(ev.id);
    setAddEventError(null);
  }

  function cancelEdit() {
    setEditingEventId(null);
    form.reset({
      date: new Date(),
      time: "14:00",
      opponent: "",
      location: domicileAddress,
      is_home: true,
    });
  }

  async function onToggleCancelEvent(eventId: string) {
    if (!calendar) return;
    const target = (calendar.events || []).find((e) => e.id === eventId);
    const willBeCancelled = !(target?.cancelled ?? false);
    const events = (calendar.events || []).map((e) =>
      e.id === eventId ? { ...e, cancelled: willBeCancelled } : e,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("calendars") as any)
      .update({ events })
      .eq("id", calendar.id);
    if (!error) {
      setCalendar({ ...calendar, events });
      if (editingEventId === eventId) cancelEdit();
      toast.success(willBeCancelled ? "Match annulé" : "Match restauré");
    } else {
      toast.error("Une erreur s'est produite. Réessayez.");
    }
  }

  async function copyShareLink() {
    if (!calendar) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${calendar.id}`;
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedParents(true);
      setTimeout(() => setCopiedParents(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden
        />
      </div>
    );
  }

  if (!calendar) return null;

  const events = (calendar.events || []).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const filteredEvents =
    homeAwayFilter === "all"
      ? events
      : events.filter((e) =>
          homeAwayFilter === "home" ? e.is_home : !e.is_home,
        );
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const notCancelled = (e: CalendarEvent) => !(e.cancelled ?? false);
  const upcomingCount = events.filter(
    (e) => notCancelled(e) && new Date(e.date) >= startOfToday,
  ).length;
  const nextMatch =
    upcomingCount > 0
      ? (events.find(
          (e) => notCancelled(e) && new Date(e.date) >= startOfToday,
        ) ?? null)
      : null;
  const nextMatchLabel = nextMatch
    ? isToday(new Date(nextMatch.date))
      ? "aujourd'hui"
      : isTomorrow(new Date(nextMatch.date))
        ? "demain"
        : differenceInDays(new Date(nextMatch.date), new Date()) <= 7
          ? `dans ${differenceInDays(new Date(nextMatch.date), new Date())} jours`
          : format(new Date(nextMatch.date), "d MMM", { locale: fr })
    : null;

  return (
    <main className="min-h-[100dvh] p-4 pb-8 max-w-4xl mx-auto sm:p-6">
      <AlertDialog
        open={eventIdToCancel !== null}
        onOpenChange={(open) => !open && setEventIdToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler ce match ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les parents le verront comme annulé dans leur calendrier. Vous
              pourrez le restaurer à tout moment avec le bouton « Restaurer ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ne pas annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => {
                if (eventIdToCancel) {
                  onToggleCancelEvent(eventIdToCancel);
                  setEventIdToCancel(null);
                }
              }}
            >
              Oui, annuler le match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteTeamDialog} onOpenChange={setShowDeleteTeamDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette équipe ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;équipe « {calendar.team_name} » et son calendrier seront définitivement
              supprimés. Les parents ne pourront plus accéder au lien. Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                setDeletingTeam(true);
                try {
                  const res = await fetch(`/api/calendars/${calendar.id}`, { method: "DELETE" });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error ?? "Erreur lors de la suppression");
                  }
                  toast.success("Équipe supprimée.");
                  router.push(`/dashboard/clubs/${clubSlug}`);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
                } finally {
                  setDeletingTeam(false);
                }
              }}
            >
              {deletingTeam ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8">
        <Button variant="ghost" size="icon" asChild aria-label="Retour au club">
          <Link href={`/dashboard/clubs/${clubSlug}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        {clubLogoUrl ? (
          <Image
            src={clubLogoUrl}
            alt="Logo club"
            width={48}
            height={48}
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0 rounded"
            unoptimized
          />
        ) : (
          <span>LOGO</span>
        )}
        <h1 className="text-xl font-bold text-foreground leading-tight sm:text-2xl">
          {calendar.team_name}
        </h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 text-xs font-medium">
          <Shield className="h-3.5 w-3.5" /> Admin
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setShowDeleteTeamDialog(true)}
          disabled={deletingTeam}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer l&apos;équipe
        </Button>
      </header>

      <section className="mb-6 sm:mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plus className="h-5 w-5 shrink-0" />
              {editingEventId ? "Modifier le match" : "Ajouter un match"}
            </CardTitle>
            <CardDescription>
              {editingEventId
                ? "Modifiez les champs puis enregistrez."
                : "Renseignez la date, l'heure, l'adversaire et le lieu."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((values) =>
                editingEventId
                  ? onUpdateEvent(editingEventId, values)
                  : onAddEvent(values),
              )}
              className="grid gap-4 grid-cols-1"
            >
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={format(form.watch("date"), "yyyy-MM-dd")}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) form.setValue("date", new Date(v + "T12:00:00"));
                  }}
                  className="bg-background text-sm [&::-webkit-datetime-edit]:text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Input
                  id="time"
                  type="time"
                  {...form.register("time")}
                  className="bg-background text-base [&::-webkit-datetime-edit]:text-foreground"
                />
                {form.formState.errors.time && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.time.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Adversaire</Label>
                <Input
                  placeholder="FC Nantes U13"
                  {...form.register("opponent")}
                  className="bg-background"
                />
                {form.formState.errors.opponent && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.opponent.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lieu</Label>
                {form.watch("is_home") ? (
                  <Input
                    id="location"
                    value={domicileAddress}
                    readOnly
                    placeholder={
                      domicileAddress
                        ? undefined
                        : "Adresse du club (paramètres)"
                    }
                    className="bg-muted/50"
                  />
                ) : (
                  <Input
                    id="location"
                    placeholder="Stade de la Beaujoire"
                    {...form.register("location")}
                    className="bg-background"
                  />
                )}
                {form.formState.errors.location && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 py-3 min-h-[44px]">
                <Switch
                  id="is_home"
                  checked={form.watch("is_home")}
                  onCheckedChange={(v) => {
                    form.setValue("is_home", v);
                    form.setValue("location", v ? domicileAddress : "");
                  }}
                />
                <Label
                  htmlFor="is_home"
                  className="cursor-pointer touch-manipulation"
                >
                  {form.watch("is_home") ? "Domicile" : "Extérieur"}
                </Label>
              </div>
              {addEventError && (
                <p className="text-sm text-red-600">{addEventError}</p>
              )}
              <div className="flex gap-2">
                {editingEventId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={cancelEdit}
                    disabled={addEventLoading}
                  >
                    Annuler
                  </Button>
                )}
                <Button
                  type="submit"
                  className={editingEventId ? "flex-1" : "w-full"}
                  disabled={addEventLoading}
                >
                  {addEventLoading
                    ? "Enregistrement…"
                    : editingEventId
                      ? "Enregistrer"
                      : "Ajouter au calendrier"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="mb-6 sm:mb-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg sm:text-base">Matchs</CardTitle>
                <CardDescription>
                  {events.length === 0
                    ? "Liste des matchs à venir et passés."
                    : nextMatchLabel
                      ? `Prochain match : ${nextMatchLabel}.`
                      : ""}
                </CardDescription>
              </div>
              {events.length > 0 && (
                <div className="flex rounded-lg border bg-muted/30 p-0.5">
                  <button
                    type="button"
                    onClick={() => setHomeAwayFilter("all")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      homeAwayFilter === "all"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Tous ({events.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHomeAwayFilter("home")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      homeAwayFilter === "home"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Domicile ({events.filter((e) => e.is_home).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHomeAwayFilter("away")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      homeAwayFilter === "away"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Extérieur ({events.filter((e) => !e.is_home).length})
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun match pour l'instant. Ajoutez-en un ci-dessus.
              </p>
            ) : filteredEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun match{" "}
                {homeAwayFilter === "home"
                  ? "à domicile"
                  : homeAwayFilter === "away"
                    ? "à l'extérieur"
                    : ""}
                .
              </p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {filteredEvents.map((ev) => {
                    const isCancelled = ev.cancelled ?? false;
                    return (
                      <div
                        key={ev.id}
                        className={`rounded-lg border p-4 ${
                          isCancelled ? "opacity-60 bg-muted/30" : "bg-card"
                        }`}
                      >
                        <p
                          className={
                            isCancelled
                              ? "text-muted-foreground text-sm line-through"
                              : "text-sm font-medium text-foreground"
                          }
                        >
                          {format(new Date(ev.date), "dd MMM yyyy · HH:mm", {
                            locale: fr,
                          })}
                        </p>
                        <p
                          className={`mt-1 inline-flex items-center gap-2 ${
                            isCancelled
                              ? "text-muted-foreground line-through"
                              : ""
                          }`}
                        >
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: ev.is_home
                                ? "hsl(var(--primary))"
                                : "#d97706",
                            }}
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
                        </p>
                        <div
                          className={`mt-2 text-sm ${
                            isCancelled
                              ? "text-muted-foreground line-through"
                              : "text-muted-foreground"
                          }`}
                        >
                          {ev.location}
                        </div>
                        <a
                          href={getMapsUrl(ev.location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex min-h-[44px] min-w-[44px] items-center gap-1 text-primary hover:underline"
                        >
                          <MapPin className="h-4 w-4 shrink-0" />
                          Voir sur la carte
                        </a>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="default"
                            className="flex-1 min-h-[44px]"
                            onClick={() => startEditEvent(ev)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                          <Button
                            variant={isCancelled ? "default" : "destructive"}
                            size="icon"
                            className="shrink-0"
                            onClick={() =>
                              isCancelled
                                ? onToggleCancelEvent(ev.id)
                                : setEventIdToCancel(ev.id)
                            }
                            aria-label={
                              isCancelled
                                ? "Restaurer le match"
                                : "Annuler le match"
                            }
                          >
                            {isCancelled ? (
                              <RotateCcw className="h-5 w-5" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden overflow-x-auto -mx-1 md:block">
                  <Table className="min-w-[320px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead>Lieu</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((ev) => {
                        const isCancelled = ev.cancelled ?? false;
                        return (
                          <TableRow
                            key={ev.id}
                            className={
                              isCancelled ? "opacity-60 bg-muted/30" : undefined
                            }
                          >
                            <TableCell
                              className={
                                isCancelled
                                  ? "line-through text-muted-foreground"
                                  : undefined
                              }
                            >
                              {format(
                                new Date(ev.date),
                                "dd MMM yyyy · HH:mm",
                                { locale: fr },
                              )}
                            </TableCell>
                            <TableCell
                              className={
                                isCancelled
                                  ? "line-through text-muted-foreground"
                                  : undefined
                              }
                            >
                              <span
                                className="inline-block w-2 h-2 rounded-full shrink-0 mr-2 align-middle"
                                style={{
                                  backgroundColor: ev.is_home
                                    ? "hsl(var(--primary))"
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
                                <span className="ml-2 text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded ">
                                  Annulé
                                </span>
                              )}
                            </TableCell>
                            <TableCell
                              className={
                                isCancelled
                                  ? "line-through text-muted-foreground"
                                  : undefined
                              }
                            >
                              <div className="flex flex-col gap-0.5">
                                <span>{ev.location}</span>
                                <a
                                  href={getMapsUrl(ev.location)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline w-fit"
                                >
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  Voir sur la carte
                                </a>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0"
                                  onClick={() => startEditEvent(ev)}
                                  aria-label="Modifier le match"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={
                                    isCancelled
                                      ? "text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0"
                                      : "text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                                  }
                                  onClick={() =>
                                    isCancelled
                                      ? onToggleCancelEvent(ev.id)
                                      : setEventIdToCancel(ev.id)
                                  }
                                  aria-label={
                                    isCancelled
                                      ? "Restaurer le match"
                                      : "Annuler le match"
                                  }
                                >
                                  {isCancelled ? (
                                    <RotateCcw className="h-5 w-5" />
                                  ) : (
                                    <Trash2 className="h-5 w-5" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {events.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full bg-primary"
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
      </section>

      <section>
        <Card className="border-primary/20 bg-secondary/30">
          <CardHeader>
            <CardTitle>Partager aux parents</CardTitle>
            <CardDescription>
              Envoyez ce lien aux parents pour qu&apos;ils s&apos;abonnent au
              calendrier sur leur téléphone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-700 mb-1">
                Lien à donner aux parents
              </p>
              {parentsShareUrl && (
                <div className="flex flex-col items-center gap-2 mb-4 p-4 rounded-lg bg-background/60">
                  <QRCodeSVG
                    value={parentsShareUrl}
                    size={200}
                    level="M"
                    includeMargin={false}
                    className="rounded"
                  />
                  <p className="text-sm text-zinc-600 text-center">
                    Les parents flashent ce QR code pour s&apos;abonner au
                    calendrier
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Input
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/s/${calendar.id}`
                      : `/s/${calendar.id}`
                  }
                  className="bg-background font-mono text-sm flex-1 min-w-0"
                />
                <div className="flex gap-2 sm:shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-1 sm:flex-none shrink-0"
                    onClick={async () => {
                      const url =
                        typeof window !== "undefined"
                          ? `${window.location.origin}/s/${calendar.id}`
                          : `/s/${calendar.id}`;
                      const ok = await shareUrl(
                        url,
                        `Calendrier des matchs - ${calendar.team_name}`,
                        `Abonnez-vous au calendrier des matchs : ${url}`,
                      );
                      if (!ok) copyShareLink();
                    }}
                    aria-label="Partager le lien parents"
                  >
                    {copiedParents ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Share2 className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-1 sm:flex-none shrink-0"
                    onClick={copyShareLink}
                    aria-label="Copier le lien parents"
                  >
                    {copiedParents ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
