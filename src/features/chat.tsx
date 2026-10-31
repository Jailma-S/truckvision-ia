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
    <div className="flex h-[calc(100vh-12rem)] min-h-[480px] flex-col rounded-xl border border-border bg-white">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {!turns.length && (
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm text-muted">Pergunte sobre empresas, sinais e oportunidades da base.</p>
            <div className="mt-4 grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-lg border border-border px-3 py-2 text-left text-sm hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-white">
              {t.content}
            </div>
          ) : (
            <div key={i} className="max-w-[95%] rounded-2xl rounded-bl-sm bg-slate-50 px-4 py-3">
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
