import { NextResponse, type NextRequest } from "next/server";
import { getAIProvider, getServiceRepository } from "@/application/container";
import { monitorSourcesUseCase } from "@/application/use-cases/monitor-sources";

export const maxDuration = 300;

/**
 * IA 08 — executado pelo Vercel Cron (vercel.json).
 * O Vercel envia "Authorization: Bearer <CRON_SECRET>" automaticamente.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const report = await monitorSourcesUseCase(getServiceRepository(), getAIProvider());
  return NextResponse.json(report);
}
