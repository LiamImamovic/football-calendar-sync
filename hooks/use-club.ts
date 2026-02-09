"use client";

import { createClient } from "@/lib/supabase/client";
import type { Club } from "@/types/database";
import { useEffect, useState } from "react";

export function useClub(slug: string | undefined) {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("slug", slug)
        .single();
      if (cancelled) return;
      setLoading(false);
      if (error || !data) {
        setClub(null);
        return;
      }
      setClub(data as unknown as Club);
    }
    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { club, loading };
}

export function useClubById(clubId: string | undefined) {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!clubId) {
      setLoading(false);
      setClub(null);
      return;
    }
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", clubId)
        .single();
      if (cancelled) return;
      setLoading(false);
      if (error || !data) {
        setClub(null);
        return;
      }
      setClub(data as unknown as Club);
    }
    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  return { club, loading };
}
