import { Sidebar } from "@/components/sidebar";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/infrastructure/supabase/clients";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let userEmail: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    userEmail = (await supabase.auth.getUser()).data.user?.email ?? null;
  }
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar mode={isSupabaseConfigured() ? "supabase" : "demo"} userEmail={userEmail} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
