"use client";

import { ArrowLeft, ArrowRight, Presentation, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Step {
  path: string;
  target: string;
  title: string;
  text: string;
}

interface TourState {
  step: number;
  companyId: string | null;
}

const STORAGE_KEY = "tv-tour";
const EVENT = "tv-tour";

function buildSteps(companyId: string | null): Step[] {
  const company = companyId ? `/empresas/${companyId}` : "/empresas";
  return [
    {
      path: "/",
      target: "radar",
      title: "Detectamos antes da concorrência",
      text: "O TruckVision monitora fontes públicas — Diário Oficial, licitações, imprensa — e acende no radar as empresas com sinais de compra de caminhões. Quanto mais perto do centro, maior o IAC.",
    },
    {
      path: "/",
      target: "impact",
      title: "Quanto isso vale",
      text: "Cada oportunidade vira valor: pipeline potencial, receita ponderada pela etapa do funil e quantos dias antes do pedido formal a equipe ficou sabendo. Nesta demonstração os valores são fictícios.",
    },
    {
      path: "/",
      target: "simulate",
      title: "Ao vivo",
      text: "Clique em “Simular novo sinal”: um novo contrato é detectado, o IAC é recalculado na hora e o pipeline cresce. Depois, avance.",
    },
    {
      path: "/mapa",
      target: "map",
      title: "Onde estão as oportunidades",
      text: "O mapa mostra cada município pulsando conforme o volume de oportunidades. Clique em uma cidade para ver as empresas — é a base para distribuir os territórios entre os vendedores.",
    },
    {
      path: "/",
      target: "ranking",
      title: "Onde focar primeiro",
      text: "O ranking ordena as empresas pelo IAC. O vendedor começa o dia sabendo quem abordar — e por quê.",
    },
    {
      path: company,
      target: "iac",
      title: "Por que essa empresa?",
      text: "O IAC é explicável: cada critério mostra os pontos conquistados e as evidências que o sustentam. Nada de caixa-preta.",
    },
    {
      path: company,
      target: "briefing",
      title: "Pronto para a visita",
      text: "Com um clique, a IA gera a justificativa e o briefing pré-visita: resumo, evidências, possíveis dores do cliente e perguntas para a reunião.",
    },
    {
      path: "/oportunidades",
      target: "kanban",
      title: "Ação comercial acompanhada",
      text: "Cada oportunidade avança no funil até a venda. O resultado volta para a base e deixa o radar mais preciso a cada ciclo.",
    },
  ];
}

function readState(): TourState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TourState) : null;
  } catch {
    return null;
  }
}

function writeState(state: TourState | null) {
  try {
    if (state) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sem sessionStorage: o tour funciona só na página atual
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: state }));
}

export function TourButton({ companyId }: { companyId: string | null }) {
  return (
    <Button variant="secondary" onClick={() => writeState({ step: 0, companyId })}>
      <Presentation className="h-4 w-4" /> Apresentar
    </Button>
  );
}

/** Sobreposição do tour: fica no layout e acompanha a navegação entre páginas. */
export function TourOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<TourState | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setState(readState());
    const onChange = (e: Event) => setState((e as CustomEvent<TourState | null>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  // memorizado: o efeito abaixo depende da identidade do passo
  const companyId = state?.companyId ?? null;
  const steps = useMemo(() => buildSteps(companyId), [companyId]);
  const step = state ? steps[state.step] : null;

  const go = useCallback(
    (index: number) => {
      if (!state) return;
      if (index < 0) return;
      if (index >= steps.length) return writeState(null);
      writeState({ ...(readState() ?? state), step: index });
    },
    [state, steps.length],
  );

  // navega para a página do passo e localiza o elemento destacado
  useEffect(() => {
    if (!step) return;
    setRect(null);
    setMissing(false);
    if (pathname !== step.path) {
      router.push(step.path);
      return;
    }
    let tries = 0;
    let frame = 0;
    let el: Element | null = null;
    const measure = () => {
      if (el) {
        const r = el.getBoundingClientRect();
        // só re-renderiza quando o elemento realmente se move (rolagem, redimensionamento)
        setRect((prev) =>
          prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
            ? prev
            : r,
        );
      }
      frame = requestAnimationFrame(measure);
    };
    const find = setInterval(() => {
      el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        clearInterval(find);
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        frame = requestAnimationFrame(measure);
      } else if (++tries > 40) {
        clearInterval(find);
        setMissing(true);
      }
    }, 100);
    return () => {
      clearInterval(find);
      cancelAnimationFrame(frame);
    };
  }, [step, pathname, router]);

  // teclado: → / Enter avança, ← volta, Esc sai
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      // lê o passo salvo: teclas seguidas chegam antes do próximo render
      const current = readState()?.step ?? state.step;
      if (e.key === "Escape") writeState(null);
      else if (e.key === "ArrowRight") go(current + 1);
      else if (e.key === "ArrowLeft") go(current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, go]);

  if (!state || !step || (!rect && !missing)) return null;

  const pad = 10;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardWidth = Math.min(380, vw - 32);
  const cardHeight = 230; // estimativa da altura da caixa de narração
  const gap = pad + 12;
  const left = rect ? Math.min(Math.max(16, rect.left), vw - cardWidth - 16) : (vw - cardWidth) / 2;
  // abaixo do destaque > acima do destaque > canto inferior direito (destaque maior que a tela)
  const cardStyle: React.CSSProperties = !rect
    ? { width: cardWidth, left, top: vh / 2 - cardHeight / 2 }
    : rect.bottom + gap + cardHeight < vh
      ? { width: cardWidth, left, top: rect.bottom + gap }
      : rect.top - gap - cardHeight > 0
        ? { width: cardWidth, left, bottom: vh - (rect.top - gap) }
        : { width: cardWidth, right: 16, bottom: 16 };
  const last = state.step === steps.length - 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-live="polite">
      {rect ? (
        <div
          className="tour-spot absolute rounded-2xl ring-2 ring-accent/80 transition-all duration-300 ease-out"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgb(2 6 18 / 0.74), 0 0 40px 6px rgb(0 87 255 / 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgb(2_6_18/0.74)]" />
      )}

      <div
        role="dialog"
        aria-label={step.title}
        className="toast-in pointer-events-auto absolute rounded-2xl border border-accent/30 bg-[#0b1a3a] p-5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9),0_0_40px_-10px_rgb(0_87_255/0.7)]"
        style={cardStyle}
      >
        <button onClick={() => writeState(null)} className="absolute top-3 right-3 text-muted hover:text-white" aria-label="Sair da apresentação">
          <X className="h-4 w-4" />
        </button>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
          Passo {state.step + 1} de {steps.length}
        </p>
        <h3 className="mt-1.5 pr-6 text-lg font-bold text-white">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.text}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === state.step ? "w-5 bg-accent shadow-[0_0_8px_rgb(110_168_255)]" : "w-1.5 bg-white/20",
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {state.step > 0 && (
              <Button variant="ghost" className="h-8 px-2.5" onClick={() => go(state.step - 1)} aria-label="Passo anterior">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Button className="h-8 px-3" onClick={() => go(state.step + 1)}>
              {last ? "Concluir" : "Próximo"} {!last && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
