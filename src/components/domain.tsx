import Link from "next/link";
import {
  PRIORITY_LABEL,
  SIGNAL_TYPE_LABEL,
  type Priority,
  type Relevance,
  type SignalWithRefs,
} from "@/domain/entities";
import { cn, formatDate } from "@/lib/utils";
import { Badge, Card } from "./ui";

const PRIORITY_STYLE: Record<Priority, string> = {
  alta: "bg-green-100 text-green-800",
  media: "bg-amber-100 text-amber-800",
  exploratoria: "bg-slate-100 text-slate-700",
};

export function PriorityBadge({ priority }: { priority: Priority | null | undefined }) {
  if (!priority) return <Badge className="bg-slate-100 text-slate-500">Sem oportunidade</Badge>;
  return <Badge className={PRIORITY_STYLE[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}

const RELEVANCE_STYLE: Record<Relevance, string> = {
  alta: "bg-blue-100 text-blue-800",
  media: "bg-sky-50 text-sky-800",
  baixa: "bg-slate-100 text-slate-600",
};

export function RelevanceBadge({ relevance }: { relevance: Relevance }) {
  return <Badge className={RELEVANCE_STYLE[relevance]}>Relevância {relevance}</Badge>;
}

export function IacScore({ score, className }: { score: number; className?: string }) {
  const color = score >= 80 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-slate-400";
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label={`IAC ${score} de 100`}>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right text-sm font-semibold tabular-nums">{score}</span>
    </div>
  );
}

export function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export function SignalTimeline({ signals, showCompany = true }: { signals: SignalWithRefs[]; showCompany?: boolean }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {signals.map((s) => (
        <li key={s.id} className="relative">
          <span className="absolute top-1.5 -left-[26px] h-2.5 w-2.5 rounded-full border-2 border-white bg-primary" />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{formatDate(s.signal_date)}</span>
            <Badge className="bg-slate-100 text-slate-700">{SIGNAL_TYPE_LABEL[s.signal_type]}</Badge>
            <RelevanceBadge relevance={s.relevance} />
            {s.created_by === "agent" && <Badge className="bg-violet-100 text-violet-800">Agente IA</Badge>}
          </div>
          <p className="mt-1 text-sm font-medium">
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
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
                <Link href={`/empresas/${s.company.id}`} className="font-medium text-primary hover:underline">
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
  return <div className="prose-tv text-sm">{blocks}</div>;
}
