import { supabase } from "@/lib/supabase";
import { getMapsUrl } from "@/lib/utils";
import type { CalendarEvent } from "@/types/database";
import { createEvents } from "ics";
import { NextResponse } from "next/server";

type CalendarRow = {
  id: string;
  team_name: string;
  events: unknown;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("calendars")
    .select("id, team_name, events")
    .eq("id", id)
    .single();

  if (error || !data) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const calendar = data as CalendarRow;
  const allEvents = (calendar.events ?? []) as CalendarEvent[];

  const now = new Date();
  const startOfTodayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const events = allEvents.filter((e) => new Date(e.date) >= startOfTodayUTC);

  const icsEvents = events.map((event) => {
    const date = new Date(event.date);
    const homeAway = event.is_home ? "Domicile" : "Extérieur";
    const cancelled = !!(event as CalendarEvent).cancelled;
    const titleSuffix = cancelled ? " (Annulé)" : "";
    return {
      start: [
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
      ] as [number, number, number, number, number],
      duration: { hours: 2, minutes: 0 },
      title: `${homeAway}: Match vs ${event.opponent}${titleSuffix}`,
      description: `Match de ${calendar.team_name} (${homeAway}).\nLieu: ${
        event.location
      }\n\nVoir sur la carte: ${getMapsUrl(event.location)}`,
      location: event.location,
      status: (cancelled ? "CANCELLED" : "CONFIRMED") as
        | "CANCELLED"
        | "CONFIRMED",
      busyStatus: "BUSY" as const,
      categories: [homeAway],
    };
  });

  if (icsEvents.length === 0) {
    const { value } = createEvents([]);
    return new NextResponse(value ?? "", {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${calendar.team_name}.ics"`,
      },
    });
  }

  const { error: icsError, value } = createEvents(icsEvents);

  if (icsError) {
    return new NextResponse("Error generating ICS", { status: 500 });
  }

  return new NextResponse(value ?? "", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${calendar.team_name}.ics"`,
    },
  });
}
