import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="font-semibold text-foreground hover:underline"
          >
            Tableau de bord
          </Link>
          <Link
            href="/dashboard/clubs"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Mon club
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[120px]">
            {user.email}
          </span>
          <form action="/api/auth/logout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              Déconnexion
            </Button>
          </form>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
