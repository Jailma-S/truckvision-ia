/** Confere a conexão com o Supabase e se as tabelas existem.  npm run check:db */
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function main() {
  for (const table of ["companies", "sources", "market_signals", "opportunities", "ia_analyses", "interactions"]) {
    const { count, error, status } = await db.from(table).select("*", { count: "exact" }).limit(1);
    console.log(
      table.padEnd(16),
      error ? `ERRO (${status}): ${error.message || error.code}` : `ok, ${count ?? "?"} linhas`,
    );
  }
}

main();
