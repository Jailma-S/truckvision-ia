import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  PRIORITY_LABEL,
  SIGNAL_TYPE_LABEL,
  type Priority,
  type Relevance,
  type SignalWithRefs,
} from "@/domain/entities";
import { cn, formatDate } from "@/lib/utils";
import { CountUp, Tilt } from "./motion";
import { Badge, Card } from "./ui";

const PRIORITY_STYLE: Record<Priority, string> = {
  alta: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_12px_-2px_rgb(52_211_153/0.45)]",
  media: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  exploratoria: "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

export function PriorityBadge({ priority }: { priority: Priority | null | undefined }) {
  if (!priority) return <Badge className="border-border bg-white/5 text-muted">Sem oportunidade</Badge>;
  return <Badge className={PRIORITY_STYLE[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}

const RELEVANCE_STYLE: Record<Relevance, string> = {
  alta: "border-accent/30 bg-primary/15 text-accent",
  media: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  baixa: "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

export function RelevanceBadge({ relevance }: { relevance: Relevance }) {
  return <Badge className={RELEVANCE_STYLE[relevance]}>Relevância {relevance}</Badge>;
}

export function NeutralBadge({ className, ...props }: React.ComponentProps<typeof Badge>) {
  return <Badge className={cn("border-border bg-white/5 text-slate-200", className)} {...props} />;
}

export function IacScore({ score, className, index = 0 }: { score: number; className?: string; index?: number }) {
  const bar =
    score >= 80
      ? "from-emerald-400 to-emerald-300 text-emerald-400"
      : score >= 50
        ? "from-amber-500 to-amber-300 text-amber-400"
        : "from-slate-500 to-slate-400 text-slate-500";
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label={`IAC ${score} de 100`}>
      <div className="track-3d h-2 w-20 overflow-hidden rounded-full">
        <div
          className={cn("bar-glow fill-anim h-full rounded-full bg-gradient-to-r", bar)}
          style={{ width: `${score}%`, ["--i" as string]: index }}
        />
      </div>
      <span className="w-8 text-right text-sm font-semibold text-white tabular-nums">{score}</span>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  highlight = false,
  index = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  highlight?: boolean;
  index?: number;
}) {
  return (
    // a entrada fica no invólucro: a animação travaria o transform usado pela inclinação
    <div className="reveal" style={{ ["--i" as string]: index }}>
      <Tilt className="h-full">
        <Card
          className={cn("relative h-full overflow-hidden p-4", highlight && "card-glow shine")}
          style={{ ["--shine-delay" as string]: `${1.5 + index * 0.6}s` }}
        >
          {/* feixe de luz no canto do cartão */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl",
              highlight ? "bg-primary/45" : "bg-primary/20",
            )}
          />
          <div className="relative flex items-start justify-between gap-3">
            <p className="text-xs font-medium text-muted">{label}</p>
            {Icon && (
              <span className="tile-3d flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Icon className="h-4 w-4 text-white" aria-hidden />
              </span>
            )}
          </div>
          <p className="metric-glow relative mt-2 text-3xl font-semibold tracking-tight text-white tabular-nums">
            <CountUp value={value} />
          </p>
          {hint && <p className="relative mt-1 text-xs text-muted">{hint}</p>}
        </Card>
      </Tilt>
    </div>
  );
}

export function SignalTimeline({ signals, showCompany = true }: { signals: SignalWithRefs[]; showCompany?: boolean }) {
  return (
    <ol className="relative space-y-5 border-l border-accent/20 pl-5">
      {signals.map((s) => (
        <li key={s.id} className="relative">
          <span className="absolute top-1.5 -left-[26px] h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_10px_2px_rgb(110_168_255/0.6)] ring-4 ring-background" />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{formatDate(s.signal_date)}</span>
            <NeutralBadge>{SIGNAL_TYPE_LABEL[s.signal_type]}</NeutralBadge>
            <RelevanceBadge relevance={s.relevance} />
            {s.created_by === "agent" && (
              <Badge className="border-violet-400/30 bg-violet-400/10 text-violet-300">Agente IA</Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm font-medium text-white">
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-accent hover:underline">
                {s.title}
              </a>
            ) : (
              s.title
            )}
          </p>
          {s.summary && s.summary !== s.title && <p className="mt-0.5 text-sm text-muted">{s.summary}</p>}
          <p className="mt-1 text-xs text-muted">
            {showCompany && s.company && (
              <>
                <Link href={`/empresas/${s.company.id}`} className="font-medium text-accent hover:underline">
                  {s.company.company_name}
                </Link>
                {" · "}
              </>
            )}
            Fonte: {s.source?.source_name ?? "não informada"}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Renderizador mínimo de Markdown para as respostas da IA (sem HTML bruto). */
export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
    );
  const flush = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it)}</li>);
    blocks.push(list.ordered ? <ol key={blocks.length}>{items}</ol> : <ul key={blocks.length}>{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    if (line.startsWith("### ")) blocks.push(<h3 key={blocks.length}>{inline(line.slice(4))}</h3>);
    else if (line.startsWith("## ") || line.startsWith("# "))
      blocks.push(<h2 key={blocks.length}>{inline(line.replace(/^#+\s/, ""))}</h2>);
    else if (line.startsWith("> ")) blocks.push(<blockquote key={blocks.length}>{inline(line.slice(2))}</blockquote>);
    else blocks.push(<p key={blocks.length}>{inline(line)}</p>);
  }
  flush();
  return <div className="prose-tv text-sm text-slate-200">{blocks}</div>;
}
