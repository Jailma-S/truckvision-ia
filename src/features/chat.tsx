"use client";

import { Loader2, Send } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Markdown } from "@/components/domain";
import { Button, Textarea } from "@/components/ui";
import type { ChatTurn } from "@/application/use-cases/chat";
import { chatAction } from "./actions";

const SUGGESTIONS = [
  "Quais empresas em Imperatriz tiveram sinais relevantes nos últimos 30 dias?",
  "Explique o ranking atual: por que a primeira colocada está no topo?",
  "Quais oportunidades de alta prioridade ainda não tiveram contato?",
  "Gere um relatório curto das oportunidades do segmento de agronegócio.",
];

export function ChatInterface() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  const ask = (question: string) => {
    if (!question.trim() || pending) return;
    const history = turns;
    setTurns([...history, { role: "user", content: question }]);
    setInput("");
    start(async () => {
      const { answer } = await chatAction(history, question);
      setTurns((t) => [...t, { role: "assistant", content: answer }]);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    });
  };

  return (
    <div className="card-3d relative flex h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl">
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {!turns.length && (
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm text-muted">Pergunte sobre empresas, sinais e oportunidades da base.</p>
            <div className="mt-4 grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="lift rounded-xl border border-border bg-white/[0.03] px-3 py-2.5 text-left text-sm text-slate-200 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] hover:bg-primary/10 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="btn-3d ml-auto max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2 text-sm text-white">
              {t.content}
            </div>
          ) : (
            <div
              key={i}
              className="max-w-[95%] rounded-2xl rounded-bl-sm border border-border bg-surface-2/60 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
            >
              <Markdown text={t.content} />
            </div>
          ),
        )}
        {pending && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Consultando a base…
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={1}
          placeholder="Faça uma pergunta…"
          aria-label="Pergunta"
          className="min-h-9 resize-none"
        />
        <Button disabled={pending || !input.trim()} aria-label="Enviar">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
