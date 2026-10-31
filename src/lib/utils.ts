import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** R$ compacto: "R$ 12,4 mi", "R$ 780 mil". */
export function formatBRLCompact(value: number) {
  if (Math.abs(value) >= 1_000_000)
    return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  if (Math.abs(value) >= 1_000) return `R$ ${Math.round(value / 1_000).toLocaleString("pt-BR")} mil`;
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date.length === 10 ? `${date}T12:00:00` : date).toLocaleDateString("pt-BR");
}
