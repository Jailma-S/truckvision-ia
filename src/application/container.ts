import "server-only";
import type { TruckVisionRepository } from "@/domain/repositories";
import { getAIProvider } from "@/infrastructure/ai";
import { DemoRepository } from "@/infrastructure/demo/demo-repository";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  isAuthRequired,
  isSupabaseConfigured,
} from "@/infrastructure/supabase/clients";
import { SupabaseRepository } from "@/infrastructure/supabase/supabase-repository";

/**
 * Repositório da requisição atual: modo demonstração (sem Supabase),
 * Supabase com a sessão do usuário (AUTH_REQUIRED=true) ou Supabase aberto (service role).
 */
export async function getRepository(): Promise<TruckVisionRepository> {
  if (!isSupabaseConfigured()) return new DemoRepository();
  if (!isAuthRequired()) return new SupabaseRepository(createSupabaseServiceClient());
  return new SupabaseRepository(await createSupabaseServerClient());
}

/** Repositório para jobs sem usuário (agente de monitoramento). */
export function getServiceRepository(): TruckVisionRepository {
  if (!isSupabaseConfigured()) return new DemoRepository();
  return new SupabaseRepository(createSupabaseServiceClient());
}

export { getAIProvider };
