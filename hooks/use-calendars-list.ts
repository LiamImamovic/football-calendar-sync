"use client";

import { useCallback, useEffect, useState } from "react";

export type CalendarOption = { team_name: string; admin_slug: string };

const CALENDARS_URL = "/api/calendars";

async function fetchCalendars(): Promise<CalendarOption[]> {
  const res = await fetch(CALENDARS_URL, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) return [];
  return res.json();
}

export function useCalendarsList() {
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCalendars();
      setCalendars(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refetch();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refetch]);

  return { calendars, loading, refetch };
}
