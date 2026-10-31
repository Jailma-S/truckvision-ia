import { Truck, Wrench } from "lucide-react";
import { formatBRLCompact } from "@/lib/utils";
import { CountUp } from "./motion";

/** Comparativo de margem por caminhão: venda × pós-venda no horizonte (premissas fictícias). */
export function AftermarketHero({
  saleMargin,
  afterMargin,
  multiple,
  years,
}: {
  saleMargin: number;
  afterMargin: number;
  multiple: number;
  years: number;
}) {
  const max = Math.max(saleMargin, afterMargin);
  return (
    <section data-tour="aftermarket" className="card-3d card-glow reveal relative overflow-hidden rounded-3xl p-5 sm:p-7">
      <div aria-hidden className="orb pointer-events-none absolute -top-28 -right-16 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-emerald-300 uppercase">
            <Wrench className="h-4 w-4" /> Receita depois da venda
          </p>
          <p className="font-display mt-2 flex items-baseline gap-2 leading-none">
            <span className="bg-gradient-to-br from-white via-emerald-200 to-emerald-400 bg-clip-text text-7xl font-extrabold tracking-tighter text-transparent tabular-nums [filter:drop-shadow(0_0_28px_rgb(52_211_153/0.45))] sm:text-8xl">
              <CountUp value={multiple.toFixed(1).replace(".", ",")} duration={1600} />
            </span>
            <span className="text-4xl font-bold text-white">×</span>
          </p>
          <p className="mt-3 text-lg font-semibold text-white">a margem da venda, em {years} anos de pós-venda</p>
          <p className="mt-1 max-w-md text-sm text-slate-300">
            Cada caminhão que entra no radar não é só uma venda: é uma <strong className="text-white">receita recorrente</strong>{" "}
            de manutenção, peças e revisões — com margem muito maior que a do equipamento.
          </p>
        </div>

        <div className="space-y-6">
          <Bar
            icon={Truck}
            label="Margem na venda do caminhão"
            value={saleMargin}
            pct={(saleMargin / max) * 100}
            className="from-slate-500 to-slate-400 text-slate-400"
            index={2}
          />
          <Bar
            icon={Wrench}
            label={`Margem de pós-venda em ${years} anos`}
            value={afterMargin}
            pct={(afterMargin / max) * 100}
            className="from-emerald-500 to-emerald-300 text-emerald-400"
            index={3}
            highlight
          />
          <p className="text-[11px] text-muted">
            Por caminhão. Margens por referência de mercado (equipamentos 6–12%, peças 28–38%, serviços 55–70%), não são
            dados da Tracbel. Valores fictícios.
          </p>
        </div>
      </div>
    </section>
  );
}

function Bar({
  icon: Icon,
  label,
  value,
  pct,
  className,
  index,
  highlight = false,
}: {
  icon: typeof Truck;
  label: string;
  value: number;
  pct: number;
  className: string;
  index: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-slate-300">
          <Icon className="h-4 w-4" /> {label}
        </span>
        <span className={`font-display text-2xl font-bold whitespace-nowrap tabular-nums ${highlight ? "text-emerald-300" : "text-white"}`}>
          <CountUp value={formatBRLCompact(value)} />
        </span>
      </div>
      <div className="track-3d h-5 rounded-full">
        <div
          className={`bar-glow fill-anim h-full rounded-full bg-gradient-to-r ${className}`}
          style={{ width: `${pct}%`, ["--i" as string]: index }}
        />
      </div>
    </div>
  );
}
