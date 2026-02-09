"use client";

import { createClient } from "@/lib/supabase/client";
import { supabase } from "@/lib/supabase";
import type { Calendar } from "@/types/database";
import { useEffect, useState } from "react";

export function useCalendar(adminSlug: string | undefined) {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminSlug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("calendars")
        .select("*")
        .eq("admin_slug", adminSlug)
        .single();
      if (cancelled) return;
      setLoading(false);
      if (error || !data) {
        setCalendar(null);
        return;
      }
      setCalendar(data as unknown as Calendar);
    }
    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [adminSlug]);

  return { calendar, loading, setCalendar };
}

export function useCalendarById(calendarId: string | undefined) {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseClient = createClient();

  useEffect(() => {
    if (!calendarId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      const { data, error } = await supabaseClient
        .from("calendars")
        .select("*")
        .eq("id", calendarId)
        .single();
      if (cancelled) return;
      setLoading(false);
      if (error || !data) {
        setCalendar(null);
        return;
      }
      setCalendar(data as unknown as Calendar);
    }
    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [calendarId]);

  return { calendar, loading, setCalendar, supabase: supabaseClient };
}
