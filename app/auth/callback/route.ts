import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const INVITE_COOKIE = "pending_invite_token";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? null;

  // Après confirmation email, Supabase ne garde pas toujours "next" → utiliser le cookie
  if (!next) {
    const cookieStore = await cookies();
    const pendingToken = cookieStore.get(INVITE_COOKIE)?.value;
    if (pendingToken) {
      try {
        next = `/invite?token=${decodeURIComponent(pendingToken)}`;
      } catch {
        next = "/dashboard";
      }
    }
  }
  if (!next) next = "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const url = `${origin}${next}`;
      const res = NextResponse.redirect(url);
      // Supprimer le cookie d'invitation après utilisation
      res.cookies.set(INVITE_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
