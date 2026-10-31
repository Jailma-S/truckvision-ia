import { Sidebar } from "@/components/sidebar";
import {
  createSupabaseServerClient,
  isAuthRequired,
  isSupabaseConfigured,
} from "@/infrastructure/supabase/clients";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let userEmail: string | null = null;
  if (isSupabaseConfigured() && isAuthRequired()) {
    const supabase = await createSupabaseServerClient();
    userEmail = (await supabase.auth.getUser()).data.user?.email ?? null;
  }
  return (
    <div className="relative min-h-screen lg:flex">
      {/* luzes de fundo em movimento lento */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="orb absolute top-[-10%] left-[20%] h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-[110px]" />
        <div className="orb-slow absolute top-[40%] right-[-8%] h-[24rem] w-[24rem] rounded-full bg-secondary/10 blur-[110px]" />
      </div>
      <Sidebar mode={isSupabaseConfigured() ? "supabase" : "demo"} userEmail={userEmail} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
