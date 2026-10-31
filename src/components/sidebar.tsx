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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-white" : "text-slate-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Truck className="h-4 w-4 text-white" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-white">TruckVision IA</p>
        <p className="text-[11px] text-slate-400">Maranhão · MVP</p>
      </div>
    </div>
  );

  const footer = (
    <div className="mt-auto space-y-2 text-xs text-slate-400">
      {mode === "demo" ? (
        <p className="rounded-lg bg-amber-500/15 p-2 text-amber-200">
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
    </div>
  );

  return (
    <>
      {/* mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-900 px-4 py-3 lg:hidden">
        {brand}
        <button onClick={() => setOpen(!open)} aria-label="Abrir menu" className="text-white">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 top-14 z-20 flex flex-col gap-6 bg-slate-900 p-4 lg:hidden">
          {nav}
          {footer}
        </div>
      )}
      {/* desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 bg-slate-900 p-5 lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>
    </>
  );
}
