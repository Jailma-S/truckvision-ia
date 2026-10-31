import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date.length === 10 ? `${date}T12:00:00` : date).toLocaleDateString("pt-BR");
}
