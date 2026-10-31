import { z } from "zod";
import type { TruckVisionRepository } from "@/domain/repositories";

export const leadSchema = z.object({
  company_name: z.string().trim().min(2, "Informe o nome da empresa"),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, "CNPJ inválido")
    .optional()
    .or(z.literal("")),
  segment: z.string().trim().optional(),
  city: z.string().trim().optional(),
  website: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createLeadUseCase(repo: TruckVisionRepository, input: z.infer<typeof leadSchema>) {
  const data = leadSchema.parse(input);
  const existing = await repo.findCompanyByName(data.company_name);
  if (existing) return { company: existing, created: false };
  const company = await repo.createCompany({
    company_name: data.company_name,
    cnpj: data.cnpj || null,
    segment: data.segment || null,
    city: data.city || null,
    state: "MA",
    website: data.website || null,
    notes: data.notes || null,
  });
  return { company, created: true };
}
