import Link from "next/link";
import { SIGNAL_TYPE_LABEL, type OpportunityWithCompany, type SignalWithRefs } from "@/domain/entities";

/** Posição estável de cada empresa no radar: ângulo pelo id, distância pelo IAC (quanto maior, mais ao centro). */
function blipPosition(id: string, score: number) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const angle = ((hash % 360) * Math.PI) / 180;
  const radius = 18 + (1 - score / 100) * 64;
  return { x: 100 + Math.cos(angle) * radius, y: 100 + Math.sin(angle) * radius };
}

export function OpportunityRadar({
  opportunities,
  signals,
  signalsLast30,
}: {
  opportunities: OpportunityWithCompany[];
  signals: SignalWithRefs[];
  signalsLast30: number;
}) {
  const high = opportunities.filter((o) => o.priority === "alta");
  const ticker = signals.slice(0, 12);

  return (
    <section data-tour="radar" className="card-3d card-glow reveal relative overflow-hidden rounded-2xl">
      <div aria-hidden className="orb pointer-events-none absolute -top-28 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <div aria-hidden className="orb-slow pointer-events-none absolute -right-24 -bottom-32 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative grid items-center gap-6 p-5 sm:p-6 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Radar */}
        <svg viewBox="0 0 200 200" className="mx-auto h-48 w-48 md:h-52 md:w-52" role="img" aria-label="Radar de oportunidades">
          <defs>
            <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0b2a66" />
              <stop offset="100%" stopColor="#050b1a" />
            </radialGradient>
            <linearGradient id="radar-beam" x1="100" y1="100" x2="190" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6ea8ff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#6ea8ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="96" fill="url(#radar-bg)" stroke="rgb(110 168 255 / 0.35)" />
          {[72, 48, 24].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgb(110 168 255 / 0.18)" />
          ))}
          <line x1="4" y1="100" x2="196" y2="100" stroke="rgb(110 168 255 / 0.12)" />
          <line x1="100" y1="4" x2="100" y2="196" stroke="rgb(110 168 255 / 0.12)" />
          {/* feixe de varredura */}
          <g className="radar-sweep">
            <path d="M100 100 L196 100 A96 96 0 0 0 183 52 Z" fill="url(#radar-beam)" opacity="0.55" />
            <line x1="100" y1="100" x2="196" y2="100" stroke="#9cc3ff" strokeWidth="1.5" />
          </g>
          {/* empresas */}
          {opportunities.slice(0, 14).map((o, i) => {
            const { x, y } = blipPosition(o.id, o.iac_score);
            const color = o.priority === "alta" ? "#34d399" : o.priority === "media" ? "#fbbf24" : "#94a3b8";
            return (
              <g key={o.id}>
                <circle cx={x} cy={y} r={o.priority === "alta" ? 7 : 5} fill={color} opacity="0.18" />
                <circle
                  cx={x}
                  cy={y}
                  r={o.priority === "alta" ? 3.2 : 2.4}
                  fill={color}
                  className="radar-blip"
                  style={{ animationDelay: `${(i * 0.37) % 2.4}s` }}
                >
                  <title>{`${o.company.company_name} — IAC ${o.iac_score}`}</title>
                </circle>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="3" fill="#9cc3ff" />
        </svg>

        {/* Resumo + faixa */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
            <span className="text-[11px] font-semibold tracking-[0.16em] text-emerald-300 uppercase">
              Monitoramento ativo · Maranhão
            </span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">Radar de Oportunidades</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            <strong className="text-white">{high.length}</strong> empresa(s) em alta prioridade e{" "}
            <strong className="text-white">{signalsLast30}</strong> sinal(is) de mercado nos últimos 30 dias. Quanto mais
            perto do centro, maior o IAC.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {high.slice(0, 4).map((o) => (
              <Link
                key={o.id}
                href={`/empresas/${o.company_id}`}
                className="lift rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200 hover:bg-emerald-400/20"
              >
                {o.company.company_name.replace(" (demo)", "")} · {o.iac_score}
              </Link>
            ))}
          </div>

          {ticker.length > 0 && (
            <div className="relative mt-5 overflow-hidden rounded-xl border border-border bg-black/25 py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
              <div className="marquee flex w-max gap-8 pr-8">
                {[...ticker, ...ticker].map((s, i) => (
                  <span key={`${s.id}-${i}`} className="flex shrink-0 items-center gap-2 text-xs whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(110_168_255)]" />
                    <span className="font-semibold text-accent">{SIGNAL_TYPE_LABEL[s.signal_type]}</span>
                    <span className="text-slate-200">{s.title}</span>
                    {s.company && <span className="text-muted">· {s.company.company_name.replace(" (demo)", "")}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
