import "server-only";
import type { TruckVisionRepository } from "@/domain/repositories";
import { getAIProvider } from "@/infrastructure/ai";
import { DemoRepository } from "@/infrastructure/demo/demo-repository";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
  isSupabaseConfigured,
} from "@/infrastructure/supabase/clients";
import { SupabaseRepository } from "@/infrastructure/supabase/supabase-repository";

/** Repositório da requisição atual: Supabase (sessão do usuário) ou modo demonstração. */
export async function getRepository(): Promise<TruckVisionRepository> {
  if (!isSupabaseConfigured()) return new DemoRepository();
  return new SupabaseRepository(await createSupabaseServerClient());
}

/** Repositório para jobs sem usuário (agente de monitoramento). */
export function getServiceRepository(): TruckVisionRepository {
  if (!isSupabaseConfigured()) return new DemoRepository();
  return new SupabaseRepository(createSupabaseServiceClient());
}

export { getAIProvider };
