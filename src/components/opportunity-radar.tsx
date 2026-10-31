import Link from "next/link";
import { SIGNAL_TYPE_LABEL, type OpportunityWithCompany, type SignalWithRefs } from "@/domain/entities";
import { CountUp } from "./motion";

/** Raio do radar (viewBox 400×400, centro em 200,200). */
const C = 200;
const R = 186;
/** Uma volta do feixe: deve ser igual à duração de .radar-sweep no CSS. */
const SWEEP_SECONDS = 4;

/** Distância ao centro pelo IAC: quanto maior o IAC, mais perto do centro. */
const radiusFor = (score: number) => 30 + (1 - score / 100) * 150;

/** Posição estável: ângulo pelo id da oportunidade, distância pelo IAC. */
function blipPosition(id: string, score: number) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const deg = hash % 360;
  const rad = (deg * Math.PI) / 180;
  const r = radiusFor(score);
  return { x: C + Math.cos(rad) * r, y: C + Math.sin(rad) * r, deg };
}

const COLOR = { alta: "#34d399", media: "#fbbf24", exploratoria: "#94a3b8" } as const;

const point = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180;
  return `${(C + Math.cos(rad) * r).toFixed(1)} ${(C + Math.sin(rad) * r).toFixed(1)}`;
};

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
  const blips = opportunities.slice(0, 16).map((o) => ({ o, ...blipPosition(o.id, o.iac_score), labelY: 0, right: true }));

  // rótulos das empresas de alta prioridade: lado com mais espaço e sem sobreposição vertical
  const used: Record<"l" | "r", number[]> = { l: [], r: [] };
  for (const b of [...blips].filter((b) => b.o.priority === "alta").sort((a, c) => a.y - c.y)) {
    b.right = b.x < C;
    const side = b.right ? "r" : "l";
    let y = b.y + 4;
    while (used[side].some((u) => Math.abs(u - y) < 15)) y += 15;
    used[side].push(y);
    b.labelY = y;
  }
  const shortName = (name: string) => {
    const words = name.replace(" (demo)", "").split(" ");
    const two = words.slice(0, 2).join(" ");
    return two.length > 18 ? `${two.slice(0, 17)}…` : two;
  };

  return (
    <section data-tour="radar" className="card-3d card-glow reveal relative overflow-hidden rounded-3xl">
      <div aria-hidden className="orb pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/35 blur-3xl" />
      <div aria-hidden className="orb-slow pointer-events-none absolute -right-24 -bottom-32 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />

      <div className="relative grid items-center gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Radar */}
        <div className="relative mx-auto w-full max-w-[460px]">
          <div aria-hidden className="absolute inset-[8%] rounded-full bg-primary/25 blur-3xl" />
          <svg viewBox="0 0 400 400" className="relative w-full" role="img" aria-label="Radar de oportunidades">
            <defs>
              <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0d3480" />
                <stop offset="70%" stopColor="#071a45" />
                <stop offset="100%" stopColor="#040b1f" />
              </radialGradient>
              <linearGradient id="radar-beam" x1={C} y1={C} x2={C + R} y2={C - 60} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6ea8ff" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#6ea8ff" stopOpacity="0" />
              </linearGradient>
              <filter id="radar-glow">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* disco */}
            <circle cx={C} cy={C} r={R} fill="url(#radar-bg)" stroke="rgb(110 168 255 / 0.5)" strokeWidth="2" />
            <circle cx={C} cy={C} r={R} fill="none" stroke="#6ea8ff" strokeWidth="2" opacity="0.5" filter="url(#radar-glow)" />

            {/* marcações da borda a cada 10° */}
            {Array.from({ length: 36 }, (_, k) => k * 10).map((deg) => (
              <line
                key={deg}
                x1={point(deg, R - (deg % 30 === 0 ? 12 : 6)).split(" ")[0]}
                y1={point(deg, R - (deg % 30 === 0 ? 12 : 6)).split(" ")[1]}
                x2={point(deg, R).split(" ")[0]}
                y2={point(deg, R).split(" ")[1]}
                stroke="rgb(110 168 255 / 0.45)"
                strokeWidth={deg % 30 === 0 ? 1.5 : 1}
              />
            ))}

            {/* anéis por faixa de IAC */}
            {[
              { r: radiusFor(80), label: "IAC 80+" },
              { r: radiusFor(50), label: "IAC 50" },
              { r: radiusFor(0) - 2, label: "" },
            ].map((ring) => (
              <g key={ring.r}>
                <circle cx={C} cy={C} r={ring.r} fill="none" stroke="rgb(110 168 255 / 0.22)" strokeDasharray="3 5" />
                {ring.label && (
                  // rótulo do anel embaixo, longe dos nomes das empresas
                  <text x={C + 4} y={C + ring.r - 5} fontSize="10" fill="rgb(156 195 255 / 0.75)" fontWeight="600">
                    {ring.label}
                  </text>
                )}
              </g>
            ))}
            {/* zona de alta prioridade */}
            <circle cx={C} cy={C} r={radiusFor(80)} fill="rgb(52 211 153 / 0.06)" />
            <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="rgb(110 168 255 / 0.12)" />
            <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="rgb(110 168 255 / 0.12)" />

            {/* feixe de varredura (gira no sentido horário a partir das 3h) */}
            <g className="radar-sweep">
              <path d={`M${C} ${C} L${point(0, R)} A${R} ${R} 0 0 0 ${point(-50, R)} Z`} fill="url(#radar-beam)" opacity="0.65" />
              <path d={`M${C} ${C} L${point(-50, R)} A${R} ${R} 0 0 0 ${point(-100, R)} Z`} fill="#6ea8ff" opacity="0.05" />
              <line x1={C} y1={C} x2={C + R} y2={C} stroke="#b9d4ff" strokeWidth="2.5" />
              <circle cx={C + R} cy={C} r="4" fill="#b9d4ff" />
            </g>

            {/* empresas: acendem quando o feixe passa */}
            {blips.map(({ o, x, y, deg, labelY, right }) => {
              const color = COLOR[o.priority];
              // atraso negativo: o ciclo já começa em andamento e o "acender" cai exatamente quando o feixe passa
              const delay = `${((deg / 360) * SWEEP_SECONDS - SWEEP_SECONDS).toFixed(2)}s`;
              const big = o.priority === "alta";
              return (
                <Link key={o.id} href={`/empresas/${o.company_id}`}>
                  <g className="cursor-pointer">
                    <circle cx={x} cy={y} r={big ? 10 : 7} fill="none" stroke={color} strokeWidth="2" className="radar-ping" style={{ animationDelay: delay }} />
                    <circle cx={x} cy={y} r={big ? 13 : 9} fill={color} opacity="0.16" />
                    <circle cx={x} cy={y} r={big ? 6 : 4.5} fill={color} stroke="#fff" strokeWidth={big ? 1.5 : 0} className="radar-hit" style={{ animationDelay: delay }} />
                    <circle cx={x} cy={y} r="16" fill="transparent" />
                    {big && (
                      <text
                        x={right ? x + 12 : x - 12}
                        y={labelY}
                        textAnchor={right ? "start" : "end"}
                        fontSize="12"
                        fontWeight="700"
                        fill="#fff"
                        stroke="#050b1a"
                        strokeWidth="3"
                        paintOrder="stroke"
                      >
                        {shortName(o.company.company_name)}
                        <tspan fill={color} dx="5">
                          {o.iac_score}
                        </tspan>
                      </text>
                    )}
                    <title>{`${o.company.company_name} — IAC ${o.iac_score}`}</title>
                  </g>
                </Link>
              );
            })}

            <circle cx={C} cy={C} r="7" fill="#b9d4ff" />
            <circle cx={C} cy={C} r="14" fill="none" stroke="#b9d4ff" opacity="0.4" className="map-ripple" />
          </svg>
        </div>

        {/* Leitura do radar */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
            <span className="text-[11px] font-semibold tracking-[0.18em] text-emerald-300 uppercase">
              Radar ao vivo · Maranhão
            </span>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Radar de <span className="bg-gradient-to-r from-[#6ea8ff] to-emerald-300 bg-clip-text text-transparent">Oportunidades</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
            Cada ponto é uma empresa com sinais de compra de caminhões. <strong className="text-white">Quanto mais perto do centro, maior o IAC</strong>{" "}
            — e mais cedo a equipe deve agir. Clique em um ponto para abrir a empresa.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <BigStat label="Empresas no radar" value={opportunities.length} />
            <BigStat label="Alta prioridade" value={high.length} accent />
            <BigStat label="Sinais em 30 dias" value={signalsLast30} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
            {(Object.keys(COLOR) as (keyof typeof COLOR)[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[k], boxShadow: `0 0 8px ${COLOR[k]}` }} />
                {k === "alta" ? "Alta prioridade" : k === "media" ? "Média" : "Exploratória"}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {high.slice(0, 4).map((o) => (
              <Link
                key={o.id}
                href={`/empresas/${o.company_id}`}
                className="lift rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-medium text-emerald-200 hover:bg-emerald-400/20"
              >
                {o.company.company_name.replace(" (demo)", "")} · {o.iac_score}
              </Link>
            ))}
          </div>

          {ticker.length > 0 && (
            <div className="relative mt-5 overflow-hidden rounded-xl border border-border bg-black/30 py-2.5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
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

function BigStat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-3 shadow-[0_0_30px_-10px_rgb(52_211_153/0.6)]"
          : "rounded-2xl border border-border bg-black/25 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]"
      }
    >
      <p className={accent ? "text-[11px] text-emerald-200" : "text-[11px] text-muted"}>{label}</p>
      <p className={`font-display mt-1 text-3xl font-extrabold tabular-nums ${accent ? "text-emerald-300" : "text-white"}`}>
        <CountUp value={value} />
      </p>
    </div>
  );
}
