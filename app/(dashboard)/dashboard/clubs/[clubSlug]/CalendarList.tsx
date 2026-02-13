"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Link2, Trash2 } from "lucide-react";

type CalendarItem = {
  id: string;
  team_name: string;
  admin_slug: string;
};

export function CalendarList({
  calendarList,
  clubSlug,
}: {
  calendarList: CalendarItem[];
  clubSlug: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>("");

  async function handleDelete(cal: CalendarItem) {
    setDeletingId(cal.id);
    try {
      const res = await fetch(`/api/calendars/${cal.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur lors de la suppression");
      }
      toast.success(`« ${cal.team_name} » a été supprimé.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  function openConfirm(cal: CalendarItem) {
    setConfirmId(cal.id);
    setConfirmName(cal.team_name);
  }

  return (
    <>
      <ul className="space-y-3">
        {calendarList.map((cal) => (
          <li key={cal.id}>
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{cal.team_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Lien parents : /s/{cal.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/clubs/${clubSlug}/team/${cal.id}`}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Modifier
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/s/${cal.id}`} target="_blank">
                      Voir page parents
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => openConfirm(cal)}
                    disabled={deletingId !== null}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <AlertDialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette équipe ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;équipe « {confirmName} » et son calendrier seront définitivement
              supprimés. Les parents ne pourront plus accéder au lien. Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const cal = calendarList.find((c) => c.id === confirmId);
                if (cal) handleDelete(cal);
              }}
            >
              {deletingId === confirmId ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
