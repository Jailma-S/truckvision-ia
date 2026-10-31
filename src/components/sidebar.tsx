"use client";

import { Building2, KanbanSquare, LayoutDashboard, Menu, MessageSquare, Radar, Truck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/oportunidades", label: "Oportunidades", icon: KanbanSquare },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/sinais", label: "Inteligência de Mercado", icon: Radar },
  { href: "/chat", label: "Chat IA", icon: MessageSquare },
];

export function Sidebar({ mode, userEmail }: { mode: "demo" | "supabase"; userEmail?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "btn-3d text-white"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-500")} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3">
      <span className="tile-3d flex h-10 w-10 items-center justify-center rounded-xl">
        <Truck className="h-5 w-5 text-white" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold tracking-tight text-white">TruckVision IA</p>
        <p className="text-[11px] tracking-wide text-slate-400">Inteligência Comercial · MA</p>
      </div>
    </div>
  );

  const footer = (
    <div className="mt-auto space-y-3 text-xs text-slate-400">
      {mode === "demo" ? (
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-200">
          Modo demonstração: dados fictícios em memória. Configure o Supabase para usar dados reais.
        </p>
      ) : (
        userEmail && (
          <form action="/auth/signout" method="post" className="flex items-center justify-between gap-2">
            <span className="truncate">{userEmail}</span>
            <button className="text-slate-300 hover:text-white">Sair</button>
          </form>
        )
      )}
      <p className="border-t border-white/5 pt-3 text-[11px] text-slate-500">Enxergue hoje as oportunidades de amanhã</p>
    </div>
  );

  const surface =
    "bg-gradient-to-b from-[#071330] via-[#06102a] to-[#040a1c] shadow-[inset_-1px_0_0_rgb(148_180_255/0.08),8px_0_32px_-12px_rgb(0_0_0/0.7)]";

  return (
    <>
      {/* mobile */}
      <header className={cn("sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden", surface)}>
        {brand}
        <button onClick={() => setOpen(!open)} aria-label={open ? "Fechar menu" : "Abrir menu"} className="text-white">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open && (
        <div className={cn("fixed inset-0 top-16 z-20 flex flex-col gap-6 p-4 lg:hidden", surface)}>
          {nav}
          {footer}
        </div>
      )}
      {/* desktop */}
      <aside className={cn("sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 p-5 lg:flex", surface)}>
        {/* luz de topo atrás da marca */}
        <div aria-hidden className="pointer-events-none absolute top-0 left-0 h-40 w-full bg-[radial-gradient(60%_80%_at_30%_0%,rgb(0_87_255/0.35),transparent)]" />
        <div className="relative">{brand}</div>
        <div className="relative">{nav}</div>
        <div className="relative mt-auto flex flex-col">{footer}</div>
      </aside>
    </>
  );
}
