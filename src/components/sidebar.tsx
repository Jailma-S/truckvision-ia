"use client";

import {
  Bell,
  Bot,
  Building2,
  CalendarCheck,
  KanbanSquare,
  LayoutDashboard,
  MapPinned,
  Menu,
  MessageSquare,
  Radar,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUnseenCount } from "@/features/alerts";
import { cn } from "@/lib/utils";

const NAV = [
  {
    section: "Visão",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/meu-dia", label: "Meu Dia", icon: CalendarCheck },
      { href: "/mapa", label: "Mapa Territorial", icon: MapPinned },
      { href: "/resultados", label: "Resultados & ROI", icon: TrendingUp },
    ],
  },
  {
    section: "Comercial",
    items: [
      { href: "/oportunidades", label: "Oportunidades", icon: KanbanSquare },
      { href: "/empresas", label: "Empresas", icon: Building2 },
      { href: "/alertas", label: "Alertas", icon: Bell, badge: true },
    ],
  },
  {
    section: "Inteligência",
    items: [
      { href: "/sinais", label: "Inteligência de Mercado", icon: Radar },
      { href: "/agente", label: "Agente de IA", icon: Bot },
      { href: "/chat", label: "Chat IA", icon: MessageSquare },
    ],
  },
];

export function Sidebar({
  mode,
  userEmail,
  alertIds = [],
}: {
  mode: "demo" | "supabase";
  userEmail?: string | null;
  alertIds?: string[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const unseen = useUnseenCount(alertIds);

  const nav = (
    <nav className="flex flex-col gap-5">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">{group.section}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map(({ href, label, icon: Icon, ...rest }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              const count = "badge" in rest ? unseen : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                    active ? "btn-3d text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-500")} aria-hidden />
                  <span className="flex-1">{label}</span>
                  {count > 0 && (
                    <span
                      className="live-dot rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white tabular-nums"
                      aria-label={`${count} alertas não lidos`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3">
      <span className="tile-3d flex h-10 w-10 items-center justify-center rounded-xl">
        <Truck className="h-5 w-5 text-white" aria-hidden />
      </span>
      <div>
        <p className="font-display text-[15px] font-bold tracking-tight text-white">TruckVision IA</p>
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
        <div className="flex items-center gap-4">
          <Link href="/alertas" className="relative text-white" aria-label={`Alertas${unseen ? `: ${unseen} não lidos` : ""}`}>
            <Bell className="h-5 w-5" />
            {unseen > 0 && (
              <span className="live-dot absolute -top-1.5 -right-2 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unseen}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen(!open)} aria-label={open ? "Fechar menu" : "Abrir menu"} className="text-white">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>
      {open && (
        <div className={cn("fixed inset-0 top-16 z-20 flex flex-col gap-6 overflow-y-auto p-4 lg:hidden", surface)}>
          {nav}
          {footer}
        </div>
      )}
      {/* desktop */}
      <aside className={cn("sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-7 overflow-y-auto p-5 lg:flex", surface)}>
        {/* luz de topo atrás da marca */}
        <div aria-hidden className="pointer-events-none absolute top-0 left-0 h-40 w-full bg-[radial-gradient(60%_80%_at_30%_0%,rgb(0_87_255/0.35),transparent)]" />
        <div className="relative">{brand}</div>
        <div className="relative">{nav}</div>
        <div className="relative mt-auto flex flex-col">{footer}</div>
      </aside>
    </>
  );
}
