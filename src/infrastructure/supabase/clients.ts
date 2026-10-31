import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * AUTH_REQUIRED=true exige login por e-mail (RLS por usuário).
 * Desligado (padrão), o link é aberto e o servidor acessa o banco com a service role.
 * Religue antes de carregar dados reais.
 */
export const isAuthRequired = () => process.env.AUTH_REQUIRED === "true";

/** Cliente com a sessão do usuário (respeita RLS). Usar em Server Components e Server Actions. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // chamado de um Server Component: o middleware já renova a sessão
        }
      },
    },
  });
}

/** Cliente com service role (ignora RLS). Somente para o agente de monitoramento. */
export function createSupabaseServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
