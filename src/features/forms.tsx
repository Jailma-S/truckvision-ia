"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { SIGNAL_TYPES, SIGNAL_TYPE_LABEL, type Source } from "@/domain/entities";
import type { AnalysisKind } from "@/application/use-cases/generate-analysis";
import {
  addInteractionAction,
  createCompanyAction,
  generateAnalysisAction,
  registerSignalAction,
  type FormState,
} from "./actions";

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p className="text-sm text-danger" role="alert">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-green-700" role="status">{state.ok}</p>;
  return null;
}

export function CompanyForm() {
  const [state, action, pending] = useActionState(createCompanyAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="company_name">Nome da empresa *</Label>
        <Input id="company_name" name="company_name" required />
      </div>
      <div>
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" />
      </div>
      <div>
        <Label htmlFor="city">Município (MA)</Label>
        <Input id="city" name="city" placeholder="Imperatriz" />
      </div>
      <div>
        <Label htmlFor="segment">Segmento</Label>
        <Input id="segment" name="segment" placeholder="Transporte rodoviário de cargas" />
      </div>
      <div>
        <Label htmlFor="website">Site</Label>
        <Input id="website" name="website" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button disabled={pending}>{pending ? "Salvando…" : "Cadastrar empresa"}</Button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function SignalForm({
  companies,
  sources,
  companyId,
}: {
  companies: { id: string; company_name: string }[];
  sources: Source[];
  companyId?: string;
}) {
  const [state, action, pending] = useActionState(registerSignalAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {companyId ? (
        <input type="hidden" name="company_id" value={companyId} />
      ) : (
        <div className="sm:col-span-2">
          <Label htmlFor="company_id">Empresa *</Label>
          <Select id="company_id" name="company_id" required defaultValue="">
            <option value="" disabled>
              Selecione…
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="signal_type">Tipo de sinal *</Label>
        <Select id="signal_type" name="signal_type" required>
          {SIGNAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {SIGNAL_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="source_id">Fonte</Label>
        <Select id="source_id" name="source_id">
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.source_name} ({s.reliability_score})
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="title">Título *</Label>
        <Input id="title" name="title" required placeholder="Ex.: Empresa vence licitação de transporte de insumos" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="content">Texto / trecho da notícia</Label>
        <Textarea id="content" name="content" rows={4} placeholder="Cole o trecho relevante — a IA gera o resumo e as evidências." />
      </div>
      <div>
        <Label htmlFor="url">Link da fonte</Label>
        <Input id="url" name="url" type="url" placeholder="https://…" />
      </div>
      <div>
        <Label htmlFor="signal_date">Data do sinal</Label>
        <Input id="signal_date" name="signal_date" type="date" />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Classificando…" : "Registrar sinal"}
        </Button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function GenerateAnalysisButton({
  companyId,
  kind,
  label,
  variant = "primary",
}: {
  companyId: string;
  kind: AnalysisKind;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>({});
  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={variant}
        disabled={pending}
        onClick={() => start(async () => setState(await generateAnalysisAction(companyId, kind)))}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {pending ? "Gerando…" : label}
      </Button>
      {state.error && <Feedback state={state} />}
    </div>
  );
}

export function InteractionForm({ companyId }: { companyId: string }) {
  const [state, action, pending] = useActionState(addInteractionAction, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="company_id" value={companyId} />
      <Textarea name="notes" rows={2} placeholder="O que aconteceu na abordagem?" required />
      <div className="flex flex-wrap gap-2">
        <Select name="result" className="w-auto flex-1">
          <option value="">Resultado…</option>
          <option>Sem retorno</option>
          <option>Interesse confirmado</option>
          <option>Sem necessidade no momento</option>
          <option>Proposta enviada</option>
          <option>Venda realizada</option>
        </Select>
        <Button variant="secondary" disabled={pending}>
          Registrar
        </Button>
      </div>
      <Feedback state={state} />
    </form>
  );
}
