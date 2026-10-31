/**
 * Corrige nomes de fontes gravados com acentuação quebrada (ex.: "DiÃ¡rio")
 * quando o seed.sql foi colado com codificação errada.  npm run fix:sources
 */
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

/** Desfaz UTF-8 lido como Windows-1252/Latin-1. */
const repair = (s: string) =>
  (/[ÃÂ]/.test(s) ? Buffer.from(s, "latin1").toString("utf8") : s).replace(/â€”/g, "—").replace(/â€“/g, "–");

async function main() {
  const { data, error } = await db.from("sources").select("id, source_name");
  if (error) throw error;
  for (const row of data) {
    const fixed = repair(row.source_name);
    console.log(fixed === row.source_name ? "ok      " : "corrigido", JSON.stringify(fixed));
    if (fixed !== row.source_name) {
      const { error: e } = await db.from("sources").update({ source_name: fixed }).eq("id", row.id);
      if (e) throw e;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
