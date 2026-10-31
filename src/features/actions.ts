"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAIProvider, getRepository } from "@/application/container";
import { chatUseCase, type ChatTurn } from "@/application/use-cases/chat";
import { createLeadUseCase } from "@/application/use-cases/create-lead";
import { generateAnalysisUseCase, type AnalysisKind } from "@/application/use-cases/generate-analysis";
import { registerSignalUseCase } from "@/application/use-cases/register-signal";
import { OPPORTUNITY_STATUSES, SIGNAL_TYPES, type OpportunityStatus, type SignalType } from "@/domain/entities";
import { ZodError } from "zod";

export interface FormState {
  error?: string;
  ok?: string;
}

const str = (fd: FormData, key: string) => (fd.get(key) as string | null) ?? undefined;
const errorMessage = (err: unknown) =>
  err instanceof ZodError ? err.issues.map((i) => i.message).join("; ") : (err as Error).message;

export async function createCompanyAction(_: FormState, fd: FormData): Promise<FormState> {
  let companyId: string;
  try {
    const { company, created } = await createLeadUseCase(await getRepository(), {
      company_name: str(fd, "company_name") ?? "",
      cnpj: str(fd, "cnpj"),
      segment: str(fd, "segment"),
      city: str(fd, "city"),
      website: str(fd, "website"),
      notes: str(fd, "notes"),
    });
    if (!created) return { error: `Empresa já cadastrada: ${company.company_name}` };
    companyId = company.id;
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath("/empresas");
  redirect(`/empresas/${companyId}`);
}

export async function registerSignalAction(_: FormState, fd: FormData): Promise<FormState> {
  try {
    const type = str(fd, "signal_type") as SignalType;
    if (!SIGNAL_TYPES.includes(type)) return { error: "Tipo de sinal inválido" };
    const { opportunity } = await registerSignalUseCase(await getRepository(), getAIProvider(), {
      company_id: str(fd, "company_id") ?? "",
      source_id: str(fd, "source_id"),
      signal_type: type,
      title: str(fd, "title") ?? "",
      content: str(fd, "content"),
      url: str(fd, "url"),
      signal_date: str(fd, "signal_date"),
    });
    revalidatePath("/", "layout");
    return { ok: opportunity ? `Sinal registrado. IAC atualizado: ${opportunity.iac_score}/100.` : "Sinal registrado." };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export async function moveOpportunityAction(fd: FormData) {
  const id = str(fd, "id");
  const status = str(fd, "status") as OpportunityStatus;
  if (!id || !OPPORTUNITY_STATUSES.includes(status)) return;
  await (await getRepository()).updateOpportunityStatus(id, status);
  revalidatePath("/", "layout");
}

export async function generateAnalysisAction(companyId: string, kind: AnalysisKind): Promise<FormState> {
  try {
    await generateAnalysisUseCase(await getRepository(), getAIProvider(), companyId, kind);
    revalidatePath(`/empresas/${companyId}`);
    return { ok: "Análise gerada." };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export async function addInteractionAction(_: FormState, fd: FormData): Promise<FormState> {
  const companyId = str(fd, "company_id");
  const notes = str(fd, "notes")?.trim();
  if (!companyId || !notes) return { error: "Descreva a interação." };
  const repo = await getRepository();
  const opportunity = await repo.getOpenOpportunity(companyId);
  await repo.createInteraction({
    company_id: companyId,
    opportunity_id: opportunity?.id ?? null,
    notes,
    result: str(fd, "result") || null,
  });
  revalidatePath(`/empresas/${companyId}`);
  return { ok: "Interação registrada." };
}

export async function chatAction(history: ChatTurn[], question: string) {
  try {
    return await chatUseCase(await getRepository(), getAIProvider(), history, question);
  } catch (err) {
    return { answer: `Erro ao consultar a IA: ${errorMessage(err)}`, model: "erro" };
  }
}
